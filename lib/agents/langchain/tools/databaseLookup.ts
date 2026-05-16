import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { assertTableAllowed } from "@/lib/agents/langchain/guardrails/schema-allowlist";
import { GuardrailError } from "@/lib/agents/langchain/guardrails/errors";

// Columns to search with ilike per table
const SEARCHABLE_COLUMNS: Record<string, string[]> = {
  clinics: ["display_name", "description", "primary_city", "primary_country"],
  clinic_locations: ["location_name", "city", "country", "address_line"],
  clinic_pricing: ["service_name", "notes"],
  clinic_packages: ["package_name"],
  clinic_reviews: ["review_text"],
  clinic_services: [],
  clinic_team: ["name", "credentials"],
  clinic_scores: [],
  clinic_credentials: ["credential_name", "issuing_body"],
  clinic_languages: [],
  clinic_mentions: ["mention_text"],
  clinic_facts: ["fact_key"],
  clinic_media: ["alt_text", "caption"],
  clinic_google_places: [],
};

export const databaseLookupTool = new DynamicStructuredTool({
  name: "database_lookup",
  description:
    "Look up information from the database. Available tables: clinics (name, city, status, contact info), clinic_locations (addresses, coordinates), clinic_pricing (service prices), clinic_packages (treatment packages with inclusions), clinic_reviews (patient reviews and ratings), clinic_services (offered procedures), clinic_team (doctors and staff), clinic_scores (quality scores and bands), clinic_credentials (accreditations and licenses), clinic_languages (language support), clinic_mentions (source mentions and sentiment), clinic_facts (computed facts about clinics), clinic_media (photos and images), clinic_google_places (Google reviews and ratings). Most tables have a clinic_id column for filtering by clinic.",
  schema: z.object({
    table: z
      .string()
      .describe("The database table to query"),
    query: z
      .string()
      .optional()
      .describe(
        "Optional text to search for across relevant columns (uses partial matching)"
      ),
    filters: z
      .record(z.string())
      .optional()
      .describe(
        "Optional exact-match filters as key-value pairs, e.g. { status: 'active' }"
      ),
    select: z
      .string()
      .optional()
      .describe("Columns to select, defaults to all columns (*)"),
    limit: z
      .number()
      .optional()
      .describe("Maximum number of results to return, defaults to 10"),
  }),
  func: async ({ table, query, filters, select, limit }) => {
    const startTime = Date.now();

    try {
      assertTableAllowed(table);
      const supabase = await createClient();
      let queryBuilder = supabase.from(table).select(select ?? "*");

      // Apply exact-match filters
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          queryBuilder = queryBuilder.eq(key, value);
        }
      }

      // Apply text search across searchable columns
      if (query) {
        const columns = SEARCHABLE_COLUMNS[table];
        if (columns && columns.length > 0) {
          const orFilter = columns
            .map((col) => `${col}.ilike.%${query}%`)
            .join(",");
          queryBuilder = queryBuilder.or(orFilter);
        }
      }

      queryBuilder = queryBuilder.limit(limit ?? 10);

      const { data, error } = await queryBuilder;

      if (error) {
        return JSON.stringify({
          error: error.message,
          metadata: { table },
        });
      }

      return JSON.stringify({
        results: data ?? [],
        metadata: {
          table,
          count: data?.length ?? 0,
          tookMs: Date.now() - startTime,
        },
      });
    } catch (error) {
      if (error instanceof GuardrailError) {
        return JSON.stringify({
          error: error.message,
          guardrail: error.category,
          metadata: { table, tookMs: Date.now() - startTime },
        });
      }
      return JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: { table, tookMs: Date.now() - startTime },
      });
    }
  },
});
