import { describe, it, expect, vi, beforeEach } from "vitest";

// =============================================================================
// Fixtures
// =============================================================================

const CLINIC_VERA = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  display_name: "Vera Clinic",
  status: "active",
};

const DOCTOR_AHMET = {
  id: "11111111-1111-1111-1111-111111111111",
  clinic_id: CLINIC_VERA.id,
  name: "Dr. Ahmet Yilmaz",
  role: "surgeon",
  credentials: "MD, ISHRS Fellow",
  years_experience: 15,
  photo_url: "https://example.com/ahmet.jpg",
  doctor_involvement_level: "primary_surgeon",
  clinics: { id: CLINIC_VERA.id, display_name: "Vera Clinic" },
};

const DOCTOR_MINIMAL = {
  id: "22222222-2222-2222-2222-222222222222",
  clinic_id: CLINIC_VERA.id,
  name: null,
  role: "coordinator",
  credentials: "Patient coordinator",
  years_experience: null,
  photo_url: null,
  doctor_involvement_level: "support_staff",
  clinics: { id: CLINIC_VERA.id, display_name: "Vera Clinic" },
};

// =============================================================================
// Supabase mock
// =============================================================================

const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

interface TableResult {
  data: unknown;
  error: unknown;
  count?: number;
}

function buildMockSupabase(overrides: Record<string, TableResult> = {}) {
  const defaults: Record<string, TableResult> = {
    clinics: { data: [CLINIC_VERA], error: null },
    clinic_team: { data: [DOCTOR_AHMET], error: null },
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

import { doctorProfileTool } from "@/lib/agents/langchain/tools/doctorProfile";

// =============================================================================
// Tests
// =============================================================================

describe("doctorProfileTool", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("metadata", () => {
    it("has the correct name", () => {
      expect(doctorProfileTool.name).toBe("doctor_profile");
    });

    it("description mentions key concepts", () => {
      const d = doctorProfileTool.description;
      expect(d.toLowerCase()).toContain("doctor");
      expect(d.toLowerCase()).toMatch(/clinic|surgeon|team/);
    });
  });

  describe("schema validation", () => {
    it("accepts doctor_id as a UUID", async () => {
      mockCreateClient.mockResolvedValue(buildMockSupabase());
      const r = await doctorProfileTool.invoke({
        doctor_id: "11111111-1111-1111-1111-111111111111",
      });
      expect(() => JSON.parse(r)).not.toThrow();
    });

    it("accepts doctor_name as a string", async () => {
      mockCreateClient.mockResolvedValue(buildMockSupabase());
      const r = await doctorProfileTool.invoke({ doctor_name: "Ahmet" });
      expect(() => JSON.parse(r)).not.toThrow();
    });

    it("accepts clinic_id as a UUID", async () => {
      mockCreateClient.mockResolvedValue(buildMockSupabase());
      const r = await doctorProfileTool.invoke({ clinic_id: CLINIC_VERA.id });
      expect(() => JSON.parse(r)).not.toThrow();
    });

    it("accepts clinic_name as a string", async () => {
      mockCreateClient.mockResolvedValue(buildMockSupabase());
      const r = await doctorProfileTool.invoke({ clinic_name: "Vera" });
      expect(() => JSON.parse(r)).not.toThrow();
    });

    it("rejects when none of doctor_id, doctor_name, clinic_id, clinic_name is provided", async () => {
      await expect(doctorProfileTool.invoke({})).rejects.toThrow();
    });
  });

  describe("happy path", () => {
    it("returns doctors with clinic info for clinic_id lookup", async () => {
      mockCreateClient.mockResolvedValue(buildMockSupabase());
      const r = await doctorProfileTool.invoke({ clinic_id: CLINIC_VERA.id });
      const parsed = JSON.parse(r);

      expect(parsed.doctors).toHaveLength(1);
      expect(parsed.doctors[0].id).toBe(DOCTOR_AHMET.id);
      expect(parsed.doctors[0].name).toBe("Dr. Ahmet Yilmaz");
      expect(parsed.doctors[0].role).toBe("surgeon");
      expect(parsed.doctors[0].credentials).toBe("MD, ISHRS Fellow");
      expect(parsed.doctors[0].years_experience).toBe(15);
      expect(parsed.doctors[0].photo_url).toBe(
        "https://example.com/ahmet.jpg",
      );
      expect(parsed.doctors[0].clinic).toEqual({
        id: CLINIC_VERA.id,
        display_name: "Vera Clinic",
      });
    });

    it("includes metadata.tookMs", async () => {
      mockCreateClient.mockResolvedValue(buildMockSupabase());
      const r = await doctorProfileTool.invoke({ clinic_id: CLINIC_VERA.id });
      const parsed = JSON.parse(r);
      expect(typeof parsed.metadata.tookMs).toBe("number");
    });

    it("includes metadata.count matching doctors length", async () => {
      mockCreateClient.mockResolvedValue(buildMockSupabase());
      const r = await doctorProfileTool.invoke({ clinic_id: CLINIC_VERA.id });
      const parsed = JSON.parse(r);
      expect(parsed.metadata.count).toBe(1);
      expect(parsed.metadata.count).toBe(parsed.doctors.length);
    });
  });

  describe("null stripping", () => {
    it("omits null name, years_experience, photo_url", async () => {
      mockCreateClient.mockResolvedValue(
        buildMockSupabase({
          clinic_team: { data: [DOCTOR_MINIMAL], error: null },
        }),
      );
      const r = await doctorProfileTool.invoke({ clinic_id: CLINIC_VERA.id });
      const parsed = JSON.parse(r);

      expect(parsed.doctors[0].id).toBe(DOCTOR_MINIMAL.id);
      expect(parsed.doctors[0].role).toBe("coordinator");
      expect(parsed.doctors[0].credentials).toBe("Patient coordinator");
      expect(parsed.doctors[0].name).toBeUndefined();
      expect(parsed.doctors[0].years_experience).toBeUndefined();
      expect(parsed.doctors[0].photo_url).toBeUndefined();
    });
  });

  describe("clinic_name lookup", () => {
    it("resolves clinic by name and returns its doctors", async () => {
      mockCreateClient.mockResolvedValue(buildMockSupabase());
      const r = await doctorProfileTool.invoke({ clinic_name: "Vera" });
      const parsed = JSON.parse(r);
      expect(parsed.doctors).toHaveLength(1);
      expect(parsed.doctors[0].name).toBe("Dr. Ahmet Yilmaz");
    });

    it("returns error JSON when clinic_name does not match any clinic", async () => {
      mockCreateClient.mockResolvedValue(
        buildMockSupabase({ clinics: { data: [], error: null } }),
      );
      const r = await doctorProfileTool.invoke({ clinic_name: "No Such Clinic" });
      const parsed = JSON.parse(r);
      expect(parsed.error).toMatch(/No clinic found/);
    });
  });

  describe("empty result", () => {
    it("returns empty doctors array for clinic with no team", async () => {
      mockCreateClient.mockResolvedValue(
        buildMockSupabase({ clinic_team: { data: [], error: null } }),
      );
      const r = await doctorProfileTool.invoke({ clinic_id: CLINIC_VERA.id });
      const parsed = JSON.parse(r);

      expect(parsed.doctors).toEqual([]);
      expect(parsed.metadata.count).toBe(0);
    });
  });

  describe("error handling", () => {
    it("returns error JSON on database error (does not throw)", async () => {
      mockCreateClient.mockResolvedValue(
        buildMockSupabase({
          clinic_team: { data: null, error: { message: "DB unreachable" } },
        }),
      );
      const r = await doctorProfileTool.invoke({ clinic_id: CLINIC_VERA.id });
      const parsed = JSON.parse(r);

      expect(parsed.error).toBe("DB unreachable");
    });

    it("returns error JSON when createClient throws", async () => {
      mockCreateClient.mockRejectedValueOnce(new Error("Missing Supabase env"));
      const r = await doctorProfileTool.invoke({ clinic_id: CLINIC_VERA.id });
      const parsed = JSON.parse(r);

      expect(parsed.error).toBe("Missing Supabase env");
      expect(parsed.metadata.tookMs).toBeDefined();
    });
  });
});
