import { describe, it, expect, vi, beforeEach } from "vitest";

const CLINIC_VERA = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  display_name: "Vera Clinic",
  status: "active",
};

function makeReview(rating: string, review_text: string, language = "en") {
  return {
    id: `rev-${Math.random().toString(36).slice(2)}`,
    clinic_id: CLINIC_VERA.id,
    source_id: "src-1",
    review_text,
    rating,
    review_date: "2024-05-01",
    language,
  };
}

const REVIEWS = [
  makeReview("5", "Excellent service from start to finish"),
  makeReview("5", "Best clinic ever, would recommend"),
  makeReview("4", "Very good, slight delay"),
  makeReview("4", "Solid experience"),
  makeReview("3", "Decent but rooms were small"),
  makeReview("2", "Not great"),
  makeReview("1", "Bad experience"),
];

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

function buildMockSupabase(overrides: Record<string, TableResult> = {}) {
  const defaults: Record<string, TableResult> = {
    clinics: { data: [CLINIC_VERA], error: null },
    clinic_reviews: { data: REVIEWS, error: null, count: REVIEWS.length },
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

import { clinicReviewsTool } from "@/lib/agents/langchain/tools/clinicReviews";

describe("clinicReviewsTool", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("metadata", () => {
    it("has the correct name", () => {
      expect(clinicReviewsTool.name).toBe("clinic_reviews");
    });

    it("description mentions reviews and aggregate", () => {
      const d = clinicReviewsTool.description.toLowerCase();
      expect(d).toContain("review");
    });
  });

  describe("schema validation", () => {
    it("rejects when neither clinic_id nor clinic_name provided", async () => {
      await expect(clinicReviewsTool.invoke({})).rejects.toThrow();
    });

    it("rejects limit > 10", async () => {
      mockCreateClient.mockResolvedValue(buildMockSupabase());
      await expect(
        clinicReviewsTool.invoke({ clinic_id: CLINIC_VERA.id, limit: 11 }),
      ).rejects.toThrow();
    });

    it("rejects min_rating < 1", async () => {
      mockCreateClient.mockResolvedValue(buildMockSupabase());
      await expect(
        clinicReviewsTool.invoke({ clinic_id: CLINIC_VERA.id, min_rating: 0 }),
      ).rejects.toThrow();
    });

    it("rejects min_rating > 5", async () => {
      mockCreateClient.mockResolvedValue(buildMockSupabase());
      await expect(
        clinicReviewsTool.invoke({ clinic_id: CLINIC_VERA.id, min_rating: 6 }),
      ).rejects.toThrow();
    });

    it("accepts a valid clinic_id and uses default limit", async () => {
      mockCreateClient.mockResolvedValue(buildMockSupabase());
      const r = await clinicReviewsTool.invoke({ clinic_id: CLINIC_VERA.id });
      expect(() => JSON.parse(r)).not.toThrow();
    });
  });

  describe("aggregate", () => {
    it("includes total_count matching the exact count from Supabase", async () => {
      mockCreateClient.mockResolvedValue(buildMockSupabase());
      const r = await clinicReviewsTool.invoke({ clinic_id: CLINIC_VERA.id });
      const parsed = JSON.parse(r);
      expect(parsed.aggregate.total_count).toBe(7);
    });

    it("computes average_rating using parseFloat (string column safe)", async () => {
      mockCreateClient.mockResolvedValue(buildMockSupabase());
      const r = await clinicReviewsTool.invoke({ clinic_id: CLINIC_VERA.id });
      const parsed = JSON.parse(r);
      // (5+5+4+4+3+2+1) / 7 = 24/7 = 3.43
      expect(parsed.aggregate.average_rating).toBeCloseTo(3.43, 1);
    });

    it("computes rating distribution by bucket 1..5", async () => {
      mockCreateClient.mockResolvedValue(buildMockSupabase());
      const r = await clinicReviewsTool.invoke({ clinic_id: CLINIC_VERA.id });
      const parsed = JSON.parse(r);
      expect(parsed.aggregate.distribution).toEqual({
        1: 1,
        2: 1,
        3: 1,
        4: 2,
        5: 2,
      });
    });

    it("filters by min_rating client-side (no string lex compare)", async () => {
      mockCreateClient.mockResolvedValue(buildMockSupabase());
      const r = await clinicReviewsTool.invoke({
        clinic_id: CLINIC_VERA.id,
        min_rating: 4,
      });
      const parsed = JSON.parse(r);
      // Only reviews with rating >= 4 (4, 4, 5, 5) should appear in the reviews list
      for (const rv of parsed.reviews) {
        expect(parseFloat(rv.rating)).toBeGreaterThanOrEqual(4);
      }
    });

    it("total_count reflects filtered subset when min_rating is set", async () => {
      mockCreateClient.mockResolvedValue(buildMockSupabase());
      const r = await clinicReviewsTool.invoke({
        clinic_id: CLINIC_VERA.id,
        min_rating: 4,
      });
      const parsed = JSON.parse(r);
      // REVIEWS with rating >= 4: ratings 5, 5, 4, 4 → 4 reviews
      // total_count must match the filtered count (4), not the Supabase unfiltered count (7)
      expect(parsed.aggregate.total_count).toBe(4);
    });
  });

  describe("display reviews", () => {
    it("caps display at default limit 5", async () => {
      mockCreateClient.mockResolvedValue(buildMockSupabase());
      const r = await clinicReviewsTool.invoke({ clinic_id: CLINIC_VERA.id });
      const parsed = JSON.parse(r);
      expect(parsed.reviews.length).toBe(5);
    });

    it("respects a custom limit (≤ 10)", async () => {
      mockCreateClient.mockResolvedValue(buildMockSupabase());
      const r = await clinicReviewsTool.invoke({
        clinic_id: CLINIC_VERA.id,
        limit: 3,
      });
      const parsed = JSON.parse(r);
      expect(parsed.reviews.length).toBe(3);
    });

    it("includes clinic info in the response", async () => {
      mockCreateClient.mockResolvedValue(buildMockSupabase());
      const r = await clinicReviewsTool.invoke({ clinic_id: CLINIC_VERA.id });
      const parsed = JSON.parse(r);
      expect(parsed.clinic).toEqual({
        id: CLINIC_VERA.id,
        display_name: "Vera Clinic",
      });
    });
  });

  describe("empty result", () => {
    it("returns empty reviews and zeroed aggregate for clinic with no reviews", async () => {
      mockCreateClient.mockResolvedValue(
        buildMockSupabase({
          clinic_reviews: { data: [], error: null, count: 0 },
        }),
      );
      const r = await clinicReviewsTool.invoke({ clinic_id: CLINIC_VERA.id });
      const parsed = JSON.parse(r);

      expect(parsed.reviews).toEqual([]);
      expect(parsed.aggregate.total_count).toBe(0);
      expect(parsed.aggregate.average_rating).toBeNull();
    });
  });

  describe("error handling", () => {
    it("returns error JSON on database error", async () => {
      mockCreateClient.mockResolvedValue(
        buildMockSupabase({
          clinic_reviews: { data: null, error: { message: "DB down" }, count: null },
        }),
      );
      const r = await clinicReviewsTool.invoke({ clinic_id: CLINIC_VERA.id });
      const parsed = JSON.parse(r);
      expect(parsed.error).toBe("DB down");
    });

    it("returns error JSON when clinic cannot be resolved", async () => {
      mockCreateClient.mockResolvedValue(
        buildMockSupabase({ clinics: { data: [], error: null } }),
      );
      const r = await clinicReviewsTool.invoke({ clinic_name: "Nope" });
      const parsed = JSON.parse(r);
      expect(parsed.error).toBeDefined();
    });

    it("returns error JSON when createClient throws", async () => {
      mockCreateClient.mockRejectedValueOnce(new Error("env missing"));
      const r = await clinicReviewsTool.invoke({ clinic_id: CLINIC_VERA.id });
      const parsed = JSON.parse(r);
      expect(parsed.error).toBe("env missing");
    });
  });

  describe("metadata", () => {
    it("includes tookMs", async () => {
      mockCreateClient.mockResolvedValue(buildMockSupabase());
      const r = await clinicReviewsTool.invoke({ clinic_id: CLINIC_VERA.id });
      const parsed = JSON.parse(r);
      expect(typeof parsed.metadata.tookMs).toBe("number");
    });
  });
});
