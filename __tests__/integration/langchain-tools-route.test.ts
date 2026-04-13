/**
 * Integration tests for /api/langchain-tools endpoint.
 * Tests database_lookup and clinic_summary tool wrappers.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock Supabase — returns a chainable builder that resolves to sample data
vi.mock("@/lib/supabase/server", () => {
  const clinicRow = {
    id: "clinic-uuid-1",
    display_name: "Test Clinic Istanbul",
    status: "active",
    description: "A leading hair transplant clinic in Istanbul",
    short_description: "Expert FUE hair transplants",
    primary_city: "Istanbul",
    primary_country: "Turkey",
    website_url: "https://testclinic.example.com",
    phone_contact: "+90-555-0100",
    email_contact: "info@testclinic.example.com",
    whatsapp_contact: "+90-555-0100",
    years_in_operation: 12,
    procedures_performed: 8500,
  };

  function chainable(data: unknown[] = [], count: number | null = null) {
    const self: Record<string, (...args: unknown[]) => unknown> = {
      select: () => self,
      eq: () => self,
      ilike: () => self,
      or: () => self,
      limit: () => ({ data, error: null, count }),
      then: (resolve: unknown) =>
        (resolve as (val: { data: unknown[]; error: null; count: number | null }) => void)({ data, error: null, count }),
    };
    // Direct access for non-chained queries
    Object.defineProperty(self, "data", { get: () => data });
    Object.defineProperty(self, "error", { get: () => null });
    Object.defineProperty(self, "count", { get: () => count });
    return self;
  }

  return {
    createClient: vi.fn().mockResolvedValue({
      from: (_table: string) => chainable([clinicRow]),
    }),
  };
});

import { POST } from "@/app/api/langchain-tools/route";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/langchain-tools", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/langchain-tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // database_lookup
  // ==========================================================================

  describe("database_lookup", () => {
    it("returns 200 with results for a basic query", async () => {
      const req = makeRequest({
        tool: "database_lookup",
        args: { table: "clinics", query: "Istanbul" },
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.results).toBeDefined();
      expect(Array.isArray(body.results)).toBe(true);
      expect(body.metadata).toBeDefined();
      expect(body.metadata.table).toBe("clinics");
      expect(typeof body.metadata.count).toBe("number");
      expect(typeof body.metadata.tookMs).toBe("number");
    });

    it("returns results when using filters", async () => {
      const req = makeRequest({
        tool: "database_lookup",
        args: { table: "clinics", filters: { status: "active" } },
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.results).toBeDefined();
      expect(body.metadata).toBeDefined();
    });

    it("returns results with custom select and limit", async () => {
      const req = makeRequest({
        tool: "database_lookup",
        args: {
          table: "clinics",
          select: "display_name,status",
          limit: 5,
        },
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
    });
  });

  // ==========================================================================
  // clinic_summary
  // ==========================================================================

  describe("clinic_summary", () => {
    it("returns 200 for a clinic name search", async () => {
      const req = makeRequest({
        tool: "clinic_summary",
        args: { clinic_name: "Test Clinic" },
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      // Should have either summary or error
      expect(body.summary || body.error).toBeDefined();
    });

    it("returns summary with expected structure when clinic found", async () => {
      const req = makeRequest({
        tool: "clinic_summary",
        args: { clinic_name: "Test Clinic Istanbul" },
      });

      const res = await POST(req);
      const body = await res.json();

      if (body.summary) {
        expect(body.summary.display_name).toBeDefined();
        expect(body.summary.id).toBeDefined();
        expect(body.summary.status).toBeDefined();
        expect(body.metadata).toBeDefined();
        expect(typeof body.metadata.tookMs).toBe("number");
      }
    });
  });

  // ==========================================================================
  // Validation
  // ==========================================================================

  describe("validation", () => {
    it("returns 400 for missing tool field", async () => {
      const req = makeRequest({ args: { table: "clinics" } });
      const res = await POST(req);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toContain("tool");
    });

    it("returns 400 for unknown tool name", async () => {
      const req = makeRequest({ tool: "unknown_tool", args: {} });
      const res = await POST(req);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toContain("Unknown tool");
    });

    it("returns 500 for invalid JSON body", async () => {
      const req = new NextRequest("http://localhost:3000/api/langchain-tools", {
        method: "POST",
        body: "not json",
        headers: { "Content-Type": "application/json" },
      });

      const res = await POST(req);
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBeDefined();
    });
  });
});
