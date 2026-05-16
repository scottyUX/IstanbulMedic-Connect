import { describe, it, expect, vi, beforeEach } from "vitest";

const CLINIC_VERA = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  display_name: "Vera Clinic",
  status: "active",
};

const PKG_PREMIUM = {
  id: "pkg-1",
  clinic_id: CLINIC_VERA.id,
  package_name: "Premium Package",
  includes: ["hotel", "transport", "PRP"],
  excludes: ["flights"],
  nights_included: 3,
  transport_included: true,
  aftercare_duration_days: 365,
  price_min: 2500,
  price_max: 4000,
  currency: "EUR",
};

const PKG_BASIC = {
  id: "pkg-2",
  clinic_id: CLINIC_VERA.id,
  package_name: "Basic Package",
  includes: ["transport"],
  excludes: null,
  nights_included: null,
  transport_included: true,
  aftercare_duration_days: 30,
  price_min: 1500,
  price_max: 2000,
  currency: "EUR",
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
}

function buildMockSupabase(overrides: Record<string, TableResult> = {}) {
  const defaults: Record<string, TableResult> = {
    clinics: { data: [CLINIC_VERA], error: null },
    clinic_packages: { data: [PKG_BASIC, PKG_PREMIUM], error: null },
  };
  const results = { ...defaults, ...overrides };

  function chainFor(table: string) {
    const result = results[table] ?? { data: [], error: null };
    const chain: Record<string, unknown> = {};
    const chainProxy = new Proxy(chain, {
      get(_t, prop) {
        if (prop === "then") {
          return (resolve: (val: unknown) => void) => resolve(result);
        }
        return () => chainProxy;
      },
    });
    return chainProxy;
  }
  return { from: vi.fn((table: string) => chainFor(table)) };
}

import { clinicPackagesTool } from "@/lib/agents/langchain/tools/clinicPackages";

describe("clinicPackagesTool", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("metadata", () => {
    it("has the correct name", () => {
      expect(clinicPackagesTool.name).toBe("clinic_packages");
    });

    it("description mentions packages and prices", () => {
      const d = clinicPackagesTool.description.toLowerCase();
      expect(d).toContain("package");
      expect(d).toMatch(/price|cost/);
    });
  });

  describe("schema validation", () => {
    it("rejects when neither clinic_id nor clinic_name provided", async () => {
      await expect(clinicPackagesTool.invoke({})).rejects.toThrow();
    });

    it("accepts a valid clinic_id", async () => {
      mockCreateClient.mockResolvedValue(buildMockSupabase());
      const r = await clinicPackagesTool.invoke({ clinic_id: CLINIC_VERA.id });
      expect(() => JSON.parse(r)).not.toThrow();
    });
  });

  describe("happy path", () => {
    it("returns packages with clinic info", async () => {
      mockCreateClient.mockResolvedValue(buildMockSupabase());
      const r = await clinicPackagesTool.invoke({ clinic_id: CLINIC_VERA.id });
      const parsed = JSON.parse(r);

      expect(parsed.clinic).toEqual({
        id: CLINIC_VERA.id,
        display_name: "Vera Clinic",
      });
      expect(parsed.packages).toHaveLength(2);
    });

    it("strips null fields in packages", async () => {
      mockCreateClient.mockResolvedValue(buildMockSupabase());
      const r = await clinicPackagesTool.invoke({ clinic_id: CLINIC_VERA.id });
      const parsed = JSON.parse(r);

      const basic = parsed.packages.find(
        (p: { package_name: string }) => p.package_name === "Basic Package",
      );
      expect(basic.nights_included).toBeUndefined();
      expect(basic.excludes).toBeUndefined();
    });

    it("includes metadata.tookMs", async () => {
      mockCreateClient.mockResolvedValue(buildMockSupabase());
      const r = await clinicPackagesTool.invoke({ clinic_id: CLINIC_VERA.id });
      const parsed = JSON.parse(r);
      expect(typeof parsed.metadata.tookMs).toBe("number");
    });
  });

  describe("empty result", () => {
    it("returns empty packages array when clinic has none", async () => {
      mockCreateClient.mockResolvedValue(
        buildMockSupabase({ clinic_packages: { data: [], error: null } }),
      );
      const r = await clinicPackagesTool.invoke({ clinic_id: CLINIC_VERA.id });
      const parsed = JSON.parse(r);
      expect(parsed.packages).toEqual([]);
    });
  });

  describe("error handling", () => {
    it("returns error JSON on database error", async () => {
      mockCreateClient.mockResolvedValue(
        buildMockSupabase({
          clinic_packages: { data: null, error: { message: "timeout" } },
        }),
      );
      const r = await clinicPackagesTool.invoke({ clinic_id: CLINIC_VERA.id });
      const parsed = JSON.parse(r);
      expect(parsed.error).toBe("timeout");
    });

    it("returns error JSON when clinic not found", async () => {
      mockCreateClient.mockResolvedValue(
        buildMockSupabase({ clinics: { data: [], error: null } }),
      );
      const r = await clinicPackagesTool.invoke({ clinic_name: "Nope" });
      const parsed = JSON.parse(r);
      expect(parsed.error).toBeDefined();
    });

    it("returns error JSON when createClient throws", async () => {
      mockCreateClient.mockRejectedValueOnce(new Error("env"));
      const r = await clinicPackagesTool.invoke({ clinic_id: CLINIC_VERA.id });
      const parsed = JSON.parse(r);
      expect(parsed.error).toBe("env");
    });
  });
});
