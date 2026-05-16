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

    const proxy: Record<string, unknown> = {};
    const handler: ProxyHandler<Record<string, unknown>> = {
      get(_t, prop) {
        if (prop === "then") {
          let result: TableResult;
          if (table === "clinics" && pendingNameLookup) {
            const match = Object.entries(clinicsByName).find(
              ([name]) =>
                name.toLowerCase().includes(pendingNameLookup!.toLowerCase()),
            );
            result = { data: match ? [match[1]] : [], error: null };
          } else if (table === "clinics" && pendingIdLookup) {
            const found = clinicsById[pendingIdLookup];
            result = { data: found ? [found] : [], error: null };
          } else if (pendingClinicId && perClinic[pendingClinicId]?.[table]) {
            result = perClinic[pendingClinicId][table];
          } else if (globalOverrides[table]) {
            result = globalOverrides[table];
          } else {
            result = { data: [], error: null };
          }
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

    it("defaults dimensions to the first four when none provided", async () => {
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
      // Spec says default to first 4 of [pricing, score, team, services, languages, location, accreditations]
      expect(dimKeys.length).toBeLessThanOrEqual(4);
      expect(dimKeys.length).toBeGreaterThan(0);
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
