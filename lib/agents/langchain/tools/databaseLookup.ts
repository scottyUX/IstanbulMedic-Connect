import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Columns to search with ilike per table
const SEARCHABLE_COLUMNS: Record<string, string[]> = {
  clinics: ["name", "location", "specialties"],
  users: ["email", "full_name"],
  consultations: ["status", "notes"],
};

export const databaseLookupTool = new DynamicStructuredTool({
  name: "database_lookup",
  description:
    "Look up information from the database. Use this to find clinics (locations, ratings, specialties), users (profiles, consultation history), or consultations (appointments, status, notes).",
  schema: z.object({
    table: z
      .enum(["clinics", "users", "consultations"])
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
      return JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: { table },
      });
    }
  },
});
