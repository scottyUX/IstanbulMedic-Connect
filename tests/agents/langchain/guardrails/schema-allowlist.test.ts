import { describe, it, expect } from "vitest";
import {
  ALLOWED_TABLES,
  assertTableAllowed,
} from "@/lib/agents/langchain/guardrails/schema-allowlist";
import { GuardrailError } from "@/lib/agents/langchain/guardrails/errors";

describe("schema-allowlist guardrail", () => {
  describe("ALLOWED_TABLES", () => {
    it("is a Set", () => {
      expect(ALLOWED_TABLES).toBeInstanceOf(Set);
    });

    it("contains the 21 expected clinic tables", () => {
      expect(ALLOWED_TABLES.size).toBe(21);
      const expected = [
        "clinics",
        "clinic_locations",
        "clinic_services",
        "clinic_credentials",
        "clinic_pricing",
        "clinic_packages",
        "clinic_scores",
        "clinic_score_components",
        "clinic_languages",
        "clinic_team",
        "clinic_team_qualifications",
        "clinic_reviews",
        "clinic_google_places",
        "clinic_mentions",
        "clinic_facts",
        "clinic_media",
        "clinic_source_scores",
        "clinic_forum_profiles",
        "clinic_social_media",
        "clinic_registry_records",
        "clinic_compliance_history",
      ];
      for (const table of expected) {
        expect(ALLOWED_TABLES.has(table)).toBe(true);
      }
    });
  });

  describe("assertTableAllowed — allowed tables", () => {
    it.each([
      ["clinics"],
      ["clinic_locations"],
      ["clinic_services"],
      ["clinic_credentials"],
      ["clinic_pricing"],
      ["clinic_packages"],
      ["clinic_scores"],
      ["clinic_score_components"],
      ["clinic_languages"],
      ["clinic_team"],
      ["clinic_team_qualifications"],
      ["clinic_reviews"],
      ["clinic_google_places"],
      ["clinic_mentions"],
      ["clinic_facts"],
      ["clinic_media"],
      ["clinic_source_scores"],
      ["clinic_forum_profiles"],
      ["clinic_social_media"],
      ["clinic_registry_records"],
      ["clinic_compliance_history"],
    ])("allows '%s' without throwing", (table) => {
      expect(() => assertTableAllowed(table)).not.toThrow();
    });
  });

  describe("assertTableAllowed — denied tables", () => {
    it.each([
      // user PII
      "users",
      "user_profiles",
      "user_treatment_profiles",
      "user_prior_surgeries",
      "user_prior_transplants",
      "user_photos",
      "patient_profiles",
      "consultations",
      "consultation_requests",
      "user_uploads",
      // scraping pipeline (prompt injection risk)
      "forum_thread_index",
      "hrn_thread_content",
      "reddit_thread_content",
      "forum_thread_llm_analysis",
      "forum_thread_signals",
      "clinic_instagram_posts",
      "clinic_reddit_posts",
      "clinic_reddit_profiles",
      "clinic_scraped_data",
      // internal provenance
      "sources",
      "source_documents",
      "fact_evidence",
      "analyses",
      // schema bypass attempts
      "auth.users",
      "storage.objects",
    ])("rejects '%s' with a GuardrailError", (table) => {
      expect(() => assertTableAllowed(table)).toThrow(GuardrailError);
    });

    it("throws a GuardrailError with category 'schema_allowlist'", () => {
      try {
        assertTableAllowed("users");
        throw new Error("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GuardrailError);
        expect((err as GuardrailError).category).toBe("schema_allowlist");
      }
    });

    it("includes the table name in the error message", () => {
      try {
        assertTableAllowed("patient_profiles");
        throw new Error("should have thrown");
      } catch (err) {
        expect((err as Error).message).toContain("patient_profiles");
      }
    });
  });

  describe("assertTableAllowed — edge cases", () => {
    it("is case-sensitive: 'Users' is rejected even though 'users' would be too", () => {
      expect(() => assertTableAllowed("Users")).toThrow(GuardrailError);
    });

    it("is case-sensitive: 'Clinics' is rejected even though 'clinics' is allowed", () => {
      expect(() => assertTableAllowed("Clinics")).toThrow(GuardrailError);
    });

    it("rejects trailing whitespace", () => {
      expect(() => assertTableAllowed("clinics ")).toThrow(GuardrailError);
    });

    it("rejects leading whitespace", () => {
      expect(() => assertTableAllowed(" clinics")).toThrow(GuardrailError);
    });

    it("rejects SQL-injection-shaped names with quotes", () => {
      expect(() => assertTableAllowed("clinics'; DROP TABLE users; --")).toThrow(
        GuardrailError,
      );
    });

    it("rejects SQL-injection-shaped names with semicolons", () => {
      expect(() => assertTableAllowed("clinics;DROP TABLE x")).toThrow(
        GuardrailError,
      );
    });

    it("rejects empty string", () => {
      expect(() => assertTableAllowed("")).toThrow(GuardrailError);
    });

    it("rejects schema-qualified clinic tables (no cross-schema bypass)", () => {
      expect(() => assertTableAllowed("public.clinics")).toThrow(GuardrailError);
    });
  });
});

describe("GuardrailError", () => {
  it("is an Error subclass", () => {
    const err = new GuardrailError("schema_allowlist", "test message");
    expect(err).toBeInstanceOf(Error);
  });

  it("exposes the category property", () => {
    const err = new GuardrailError("schema_allowlist", "test");
    expect(err.category).toBe("schema_allowlist");
  });

  it("preserves the message", () => {
    const err = new GuardrailError("schema_allowlist", "hello world");
    expect(err.message).toBe("hello world");
  });
});
