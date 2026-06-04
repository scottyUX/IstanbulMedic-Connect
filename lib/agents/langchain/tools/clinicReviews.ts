import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

interface Review {
  id: string;
  rating: string;
  review_text: string;
  review_date?: string;
  language?: string;
}

interface Aggregate {
  average_rating: number | null;
  total_count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

function stripNulls<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== null && v !== undefined) cleaned[k] = v;
  }
  return cleaned as Partial<T>;
}

async function resolveClinic(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clinic_id?: string,
  clinic_name?: string,
) {
  if (clinic_id) {
    const { data } = await supabase
      .from("clinics")
      .select("id, display_name, status")
      .eq("id", clinic_id)
      .limit(1);
    return data?.[0] ?? null;
  }
  if (clinic_name) {
    const { data } = await supabase
      .from("clinics")
      .select("id, display_name, status")
      .ilike("display_name", `%${clinic_name}%`)
      .limit(5);
    if (!data || data.length === 0) return null;
    return data.find((c) => c.status === "active") ?? data[0];
  }
  return null;
}

export const clinicReviewsTool = new DynamicStructuredTool({
  name: "clinic_reviews",
  description:
    "Fetch patient reviews for a clinic plus an aggregate (average rating, total count, 1-5 star distribution). Provide either clinic_id (UUID) or clinic_name (partial match). Optional: limit (1-10, default 5) for how many reviews to return for display; min_rating (1-5) to filter. Use this when a patient asks about reviews, ratings, sentiment, or what other patients say.",
  schema: z
    .object({
      clinic_id: z.string().uuid().optional(),
      clinic_name: z.string().optional(),
      limit: z.number().int().min(1).max(10).optional(),
      min_rating: z.number().min(1).max(5).optional(),
    })
    .refine((d) => Boolean(d.clinic_id || d.clinic_name), {
      message: "Provide clinic_id or clinic_name",
    }),
  func: async ({ clinic_id, clinic_name, limit, min_rating }) => {
    const startTime = Date.now();
    const displayLimit = limit ?? 5;

    try {
      const supabase = await createClient();

      const clinic = await resolveClinic(supabase, clinic_id, clinic_name);
      if (!clinic) {
        return JSON.stringify({
          error: "No clinic found matching the given criteria",
          metadata: { tookMs: Date.now() - startTime },
        });
      }

      // Fetch reviews + Google Places data in parallel.
      const [{ data, error, count }, googleResult] = await Promise.all([
        supabase
          .from("clinic_reviews")
          .select(
            "id, rating, review_text, review_date, language",
            { count: "exact" },
          )
          .eq("clinic_id", clinic.id)
          .order("review_date", { ascending: false })
          .limit(200),
        supabase
          .from("clinic_google_places")
          .select("rating, user_ratings_total")
          .eq("clinic_id", clinic.id)
          .maybeSingle(),
      ]);

      if (error) {
        return JSON.stringify({
          error: error.message,
          metadata: { tookMs: Date.now() - startTime },
        });
      }

      const allRows = (data ?? []) as Review[];

      // rating is stored as a string column — parseFloat for any numeric ops.
      const filtered = min_rating != null
        ? allRows.filter((r) => {
            const n = parseFloat(r.rating);
            return Number.isFinite(n) && n >= min_rating;
          })
        : allRows;

      const distribution: Aggregate["distribution"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let sum = 0;
      let scored = 0;
      for (const r of filtered) {
        const n = parseFloat(r.rating);
        if (!Number.isFinite(n)) continue;
        const bucket = Math.round(n) as 1 | 2 | 3 | 4 | 5;
        if (bucket >= 1 && bucket <= 5) {
          distribution[bucket]++;
        }
        sum += n;
        scored++;
      }

      const aggregate: Aggregate = {
        average_rating: scored > 0 ? Number((sum / scored).toFixed(2)) : null,
        total_count: count ?? filtered.length,
        distribution,
      };

      const reviews = filtered.slice(0, displayLimit).map((r) =>
        stripNulls({
          id: r.id,
          rating: r.rating,
          review_text: r.review_text,
          review_date: r.review_date,
          language: r.language,
        }),
      );

      const google = googleResult.data
        ? { rating: googleResult.data.rating, total: googleResult.data.user_ratings_total }
        : null;

      return JSON.stringify({
        clinic: { id: clinic.id, display_name: clinic.display_name },
        aggregate,
        reviews,
        ...(google ? { google } : {}),
        metadata: { tookMs: Date.now() - startTime },
      });
    } catch (error) {
      return JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: { tookMs: Date.now() - startTime },
      });
    }
  },
});
