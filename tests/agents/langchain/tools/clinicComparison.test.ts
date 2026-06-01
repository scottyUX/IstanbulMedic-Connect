import { describe, it, expect, vi, beforeEach } from "vitest";

const CLINIC_A = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  display_name: "Clinic A",
  status: "active",
  phone_contact: "+90 1",
  email_contact: "a@example.com",
  whatsapp_contact: null,
};

const CLINIC_B = {
  id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  display_name: "Clinic B",
  status: "active",
  phone_contact: "+90 2",
  email_contact: "b@example.com",
  whatsapp_contact: null,
};

const CLINIC_C = {
  id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
  display_name: "Clinic C",
  status: "active",
  phone_contact: null,
  email_contact: null,
  whatsapp_contact: null,
};

const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

interface TableResult {
  data: unknown;
  error: unknown;
  count?: number | null;
}

/**
 * Build a Supabase mock that returns per-clinic results based on the
 * `clinic_id` filter applied via chained `.eq("clinic_id", id)` or `.eq("id", id)`.
 * Handles `.maybeSingle()` by unwrapping array results to a single row or null.
 */
function buildMockSupabase(opts: {
  clinicsByName?: Record<string, typeof CLINIC_A>;
  clinicsById?: Record<string, typeof CLINIC_A>;
  perClinic?: Record<string, Record<string, TableResult>>;
  globalOverrides?: Record<string, TableResult>;
}) {
  const {
    clinicsByName = {},
    clinicsById = {},
    perClinic = {},
    globalOverrides = {},
  } = opts;

  function chainFor(table: string) {
    let pendingClinicId: string | undefined;
    let pendingNameLookup: string | undefined;
    let pendingIdLookup: string | undefined;
    let isMaybySingle = false;

    const proxy: Record<string, unknown> = {};
    const handler: ProxyHandler<Record<string, unknown>> = {
      get(_t, prop) {
        if (prop === "then") {
          let rawResult: TableResult;
          if (table === "clinics" && pendingNameLookup) {
            const match = Object.entries(clinicsByName).find(
              ([name]) =>
                name.toLowerCase().includes(pendingNameLookup!.toLowerCase()),
            );
            rawResult = { data: match ? [match[1]] : [], error: null };
          } else if (table === "clinics" && pendingIdLookup) {
            const found = clinicsById[pendingIdLookup];
            rawResult = { data: found ? [found] : [], error: null };
          } else if (pendingClinicId && perClinic[pendingClinicId]?.[table]) {
            rawResult = perClinic[pendingClinicId][table];
          } else if (globalOverrides[table]) {
            rawResult = globalOverrides[table];
          } else {
            rawResult = { data: [], error: null };
          }

          const result: TableResult =
            isMaybySingle && Array.isArray(rawResult.data)
              ? { ...rawResult, data: rawResult.data[0] ?? null }
              : rawResult;

          return (resolve: (val: unknown) => void) => resolve(result);
        }
        return (...args: unknown[]) => {
          if (prop === "eq") {
            const [key, value] = args as [string, string];
            if (table === "clinics" && key === "id") {
              pendingIdLookup = value;
            } else if (key === "clinic_id") {
              pendingClinicId = value;
            }
          } else if (prop === "ilike") {
            pendingNameLookup = String(args[1]).replace(/%/g, "");
          } else if (prop === "maybeSingle") {
            isMaybySingle = true;
          }
          return new Proxy(proxy, handler);
        };
      },
    };
    return new Proxy(proxy, handler);
  }

  return { from: vi.fn((t: string) => chainFor(t)) };
}

import { clinicComparisonTool } from "@/lib/agents/langchain/tools/clinicComparison";

describe("clinicComparisonTool", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("metadata", () => {
    it("has the correct name", () => {
      expect(clinicComparisonTool.name).toBe("clinic_comparison");
    });

    it("description mentions comparison", () => {
      expect(clinicComparisonTool.description.toLowerCase()).toContain(
        "compar",
      );
    });
  });

  describe("schema validation", () => {
    it("rejects when total clinics < 2", async () => {
      await expect(
        clinicComparisonTool.invoke({ clinic_ids: [CLINIC_A.id] }),
      ).rejects.toThrow();
    });

    it("rejects when total clinics > 4", async () => {
      await expect(
        clinicComparisonTool.invoke({
          clinic_ids: [
            CLINIC_A.id,
            CLINIC_B.id,
            CLINIC_C.id,
            "dddddddd-dddd-dddd-dddd-dddddddddddd",
            "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
          ],
        }),
      ).rejects.toThrow();
    });

    it("accepts 2 clinic_ids", async () => {
      mockCreateClient.mockResolvedValue(
        buildMockSupabase({
          clinicsById: { [CLINIC_A.id]: CLINIC_A, [CLINIC_B.id]: CLINIC_B },
        }),
      );
      const r = await clinicComparisonTool.invoke({
        clinic_ids: [CLINIC_A.id, CLINIC_B.id],
      });
      expect(() => JSON.parse(r)).not.toThrow();
    });

    it("accepts a mix of clinic_ids and clinic_names totaling 2-4", async () => {
      mockCreateClient.mockResolvedValue(
        buildMockSupabase({
          clinicsById: { [CLINIC_A.id]: CLINIC_A },
          clinicsByName: { "Clinic B": CLINIC_B },
        }),
      );
      const r = await clinicComparisonTool.invoke({
        clinic_ids: [CLINIC_A.id],
        clinic_names: ["Clinic B"],
      });
      const parsed = JSON.parse(r);
      expect(parsed.clinics).toHaveLength(2);
    });
  });

  describe("happy path", () => {
    it("returns clinics array with id and display_name for each", async () => {
      mockCreateClient.mockResolvedValue(
        buildMockSupabase({
          clinicsById: { [CLINIC_A.id]: CLINIC_A, [CLINIC_B.id]: CLINIC_B },
        }),
      );
      const r = await clinicComparisonTool.invoke({
        clinic_ids: [CLINIC_A.id, CLINIC_B.id],
      });
      const parsed = JSON.parse(r);

      expect(parsed.clinics).toHaveLength(2);
      const ids = parsed.clinics.map((c: { id: string }) => c.id);
      expect(ids).toContain(CLINIC_A.id);
      expect(ids).toContain(CLINIC_B.id);
    });

    it("includes image_url in clinic entry when media exists", async () => {
      mockCreateClient.mockResolvedValue(
        buildMockSupabase({
          clinicsById: { [CLINIC_A.id]: CLINIC_A, [CLINIC_B.id]: CLINIC_B },
          perClinic: {
            [CLINIC_A.id]: {
              clinic_media: {
                data: [{ url: "https://example.com/a.jpg", is_primary: true, media_type: "image", display_order: 1 }],
                error: null,
              },
            },
          },
        }),
      );
      const r = await clinicComparisonTool.invoke({
        clinic_ids: [CLINIC_A.id, CLINIC_B.id],
        dimensions: ["score"],
      });
      const parsed = JSON.parse(r);
      const clinicA = parsed.clinics.find((c: { id: string }) => c.id === CLINIC_A.id);
      const clinicB = parsed.clinics.find((c: { id: string }) => c.id === CLINIC_B.id);
      expect(clinicA.image_url).toBe("https://example.com/a.jpg");
      expect(clinicB.image_url).toBeUndefined();
    });

    it("builds a comparison object keyed by dimension with per-clinic values", async () => {
      mockCreateClient.mockResolvedValue(
        buildMockSupabase({
          clinicsById: { [CLINIC_A.id]: CLINIC_A, [CLINIC_B.id]: CLINIC_B },
          perClinic: {
            [CLINIC_A.id]: {
              clinic_scores: { data: [{ overall_score: 90, band: "A" }], error: null },
            },
            [CLINIC_B.id]: {
              clinic_scores: { data: [{ overall_score: 70, band: "B" }], error: null },
            },
          },
        }),
      );
      const r = await clinicComparisonTool.invoke({
        clinic_ids: [CLINIC_A.id, CLINIC_B.id],
        dimensions: ["score"],
      });
      const parsed = JSON.parse(r);

      expect(parsed.comparison).toBeDefined();
      expect(parsed.comparison.score).toBeDefined();
      const scoreRow = parsed.comparison.score as {
        clinic_id: string;
        value: unknown;
      }[];
      expect(scoreRow).toHaveLength(2);

      const aScore = scoreRow.find((r) => r.clinic_id === CLINIC_A.id)!;
      const bScore = scoreRow.find((r) => r.clinic_id === CLINIC_B.id)!;
      expect((aScore.value as { overall_score: number }).overall_score).toBe(90);
      expect((bScore.value as { overall_score: number }).overall_score).toBe(70);
    });

    it("includes metadata.tookMs", async () => {
      mockCreateClient.mockResolvedValue(
        buildMockSupabase({
          clinicsById: { [CLINIC_A.id]: CLINIC_A, [CLINIC_B.id]: CLINIC_B },
        }),
      );
      const r = await clinicComparisonTool.invoke({
        clinic_ids: [CLINIC_A.id, CLINIC_B.id],
      });
      const parsed = JSON.parse(r);
      expect(typeof parsed.metadata.tookMs).toBe("number");
    });

    it("defaults to pricing, score, team, google, reddit, registry when no dimensions provided", async () => {
      mockCreateClient.mockResolvedValue(
        buildMockSupabase({
          clinicsById: { [CLINIC_A.id]: CLINIC_A, [CLINIC_B.id]: CLINIC_B },
        }),
      );
      const r = await clinicComparisonTool.invoke({
        clinic_ids: [CLINIC_A.id, CLINIC_B.id],
      });
      const parsed = JSON.parse(r);
      const dimKeys = Object.keys(parsed.comparison);
      expect(dimKeys).toContain("pricing");
      expect(dimKeys).toContain("score");
      expect(dimKeys).toContain("team");
      expect(dimKeys).toContain("google");
      expect(dimKeys).toContain("reddit");
      expect(dimKeys).toContain("registry");
      expect(dimKeys).not.toContain("services");
    });
  });

  describe("signal dimensions", () => {
    it("populates google dimension from clinic_reviews average", async () => {
      mockCreateClient.mockResolvedValue(
        buildMockSupabase({
          clinicsById: { [CLINIC_A.id]: CLINIC_A, [CLINIC_B.id]: CLINIC_B },
          perClinic: {
            [CLINIC_A.id]: {
              clinic_reviews: {
                data: [{ rating: "5" }, { rating: "4" }, { rating: "5" }],
                error: null,
              },
            },
          },
        }),
      );
      const r = await clinicComparisonTool.invoke({
        clinic_ids: [CLINIC_A.id, CLINIC_B.id],
        dimensions: ["google"],
      });
      const parsed = JSON.parse(r);
      const googleRow = parsed.comparison.google as { clinic_id: string; value: unknown }[];
      const aGoogle = googleRow.find((e) => e.clinic_id === CLINIC_A.id)!;
      const bGoogle = googleRow.find((e) => e.clinic_id === CLINIC_B.id)!;

      expect((aGoogle.value as { average_rating: number; review_count: number }).average_rating).toBeCloseTo(4.67, 1);
      expect((aGoogle.value as { review_count: number }).review_count).toBe(3);
      expect(bGoogle.value).toBeNull();
    });

    it("populates reddit dimension from clinic_forum_profiles", async () => {
      mockCreateClient.mockResolvedValue(
        buildMockSupabase({
          clinicsById: { [CLINIC_A.id]: CLINIC_A, [CLINIC_B.id]: CLINIC_B },
          perClinic: {
            [CLINIC_A.id]: {
              clinic_forum_profiles: {
                data: [{ score: 8.5, thread_count: 42, sentiment_score: 0.72, summary: "Great" }],
                error: null,
              },
            },
          },
        }),
      );
      const r = await clinicComparisonTool.invoke({
        clinic_ids: [CLINIC_A.id, CLINIC_B.id],
        dimensions: ["reddit"],
      });
      const parsed = JSON.parse(r);
      const redditRow = parsed.comparison.reddit as { clinic_id: string; value: unknown }[];
      const aReddit = redditRow.find((e) => e.clinic_id === CLINIC_A.id)!;
      const bReddit = redditRow.find((e) => e.clinic_id === CLINIC_B.id)!;

      expect((aReddit.value as { score: number }).score).toBe(8.5);
      expect((aReddit.value as { thread_count: number }).thread_count).toBe(42);
      expect(bReddit.value).toBeNull();
    });

    it("populates registry dimension from clinic_registry_records", async () => {
      mockCreateClient.mockResolvedValue(
        buildMockSupabase({
          clinicsById: { [CLINIC_A.id]: CLINIC_A, [CLINIC_B.id]: CLINIC_B },
          perClinic: {
            [CLINIC_A.id]: {
              clinic_registry_records: {
                data: [{ source: "turkish_ministry_of_health", license_status: "active", licensed_since: "2019-01-01" }],
                error: null,
              },
            },
          },
        }),
      );
      const r = await clinicComparisonTool.invoke({
        clinic_ids: [CLINIC_A.id, CLINIC_B.id],
        dimensions: ["registry"],
      });
      const parsed = JSON.parse(r);
      const registryRow = parsed.comparison.registry as { clinic_id: string; value: unknown }[];
      const aRegistry = registryRow.find((e) => e.clinic_id === CLINIC_A.id)!;
      const bRegistry = registryRow.find((e) => e.clinic_id === CLINIC_B.id)!;

      expect(Array.isArray(aRegistry.value)).toBe(true);
      expect((aRegistry.value as { license_status: string }[])[0].license_status).toBe("active");
      expect(bRegistry.value).toBeNull();
    });
  });

  describe("partial resolution", () => {
    it("includes unresolved entries when a clinic can't be found", async () => {
      mockCreateClient.mockResolvedValue(
        buildMockSupabase({
          clinicsById: { [CLINIC_A.id]: CLINIC_A },
        }),
      );
      const r = await clinicComparisonTool.invoke({
        clinic_ids: [CLINIC_A.id, "00000000-0000-4000-8000-000000000000"],
      });
      const parsed = JSON.parse(r);

      expect(parsed.clinics).toHaveLength(1);
      expect(parsed.unresolved).toBeDefined();
      expect(parsed.unresolved.length).toBeGreaterThan(0);
    });
  });

  describe("error handling", () => {
    it("returns error JSON when createClient throws", async () => {
      mockCreateClient.mockRejectedValueOnce(new Error("env"));
      const r = await clinicComparisonTool.invoke({
        clinic_ids: [CLINIC_A.id, CLINIC_B.id],
      });
      const parsed = JSON.parse(r);
      expect(parsed.error).toBe("env");
    });
  });
});
