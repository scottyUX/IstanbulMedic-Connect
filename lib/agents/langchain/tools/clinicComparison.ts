import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  fetchClinicData,
  resolveClinic,
  type ClinicCore,
  type ClinicDataBundle,
} from "./_shared";

const ALL_DIMENSIONS = [
  "pricing",
  "score",
  "team",
  "services",
  "languages",
  "location",
  "accreditations",
  "google",
  "reddit",
  "registry",
  "instagram",
  "hrn",
] as const;

type Dimension = (typeof ALL_DIMENSIONS)[number];

const DEFAULT_DIMENSIONS: Dimension[] = ["pricing", "score", "team", "google", "reddit", "instagram", "hrn", "registry"];

interface UnresolvedClinic {
  type: "clinic_id" | "clinic_name";
  value: string;
}

interface ComparisonValue {
  clinic_id: string;
  value: unknown;
}

interface RedditProfileRow {
  score: unknown;
  thread_count: number | null;
  sentiment_score: unknown;
  summary: string | null;
}

interface RegistryRecordRow {
  source: string;
  license_status: string;
  licensed_since: string | null;
}

interface ReviewRatingRow {
  rating: string | null;
}

interface InstagramSocialRow {
  follower_count: number | null;
  account_handle: string | null;
  verified: boolean | null;
}

interface HRNProfileRow {
  score: unknown;
  thread_count: number | null;
  sentiment_score: unknown;
}

interface ClinicSignals {
  reddit: RedditProfileRow | null;
  registry: RegistryRecordRow[];
  reviews: ReviewRatingRow[];
  instagram: InstagramSocialRow | null;
  instagramScore: number | null;
  hrn: HRNProfileRow | null;
}

function pickDimensionValue(
  dim: Dimension,
  bundle: ClinicDataBundle,
  signals: ClinicSignals,
): unknown {
  switch (dim) {
    case "pricing":
      return bundle.pricing.length > 0 ? bundle.pricing : null;
    case "score":
      return bundle.score ?? null;
    case "team":
      return bundle.team.length > 0 ? bundle.team : null;
    case "services":
      return bundle.services.length > 0 ? bundle.services : null;
    case "languages":
      return bundle.languages.length > 0 ? bundle.languages : null;
    case "location":
      return bundle.location ?? null;
    case "accreditations":
      return bundle.credentials.length > 0 ? bundle.credentials : null;
    case "google": {
      const ratings = signals.reviews
        .map((r) => parseFloat(String(r.rating ?? "")))
        .filter((n) => Number.isFinite(n) && n >= 1 && n <= 5);
      if (ratings.length === 0) return null;
      const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      return { average_rating: Number(avg.toFixed(2)), review_count: ratings.length };
    }
    case "reddit": {
      const r = signals.reddit;
      if (!r) return null;
      return {
        score: r.score != null ? Number(r.score) : null,
        thread_count: r.thread_count ?? 0,
        sentiment_score: r.sentiment_score != null ? Number(r.sentiment_score) : null,
        summary: r.summary ?? null,
      };
    }
    case "registry": {
      if (signals.registry.length === 0) return null;
      return signals.registry;
    }
    case "instagram": {
      const ig = signals.instagram;
      if (!ig && signals.instagramScore == null) return null;
      return {
        follower_count: ig?.follower_count ?? null,
        account_handle: ig?.account_handle ?? null,
        verified: ig?.verified ?? null,
        source_score: signals.instagramScore,
      };
    }
    case "hrn": {
      const h = signals.hrn;
      if (!h) return null;
      return {
        score: h.score != null ? Number(h.score) : null,
        thread_count: h.thread_count ?? 0,
        sentiment_score: h.sentiment_score != null ? Number(h.sentiment_score) : null,
      };
    }
  }
}

export const clinicComparisonTool = new DynamicStructuredTool({
  name: "clinic_comparison",
  description:
    "Compare 2-4 clinics side by side across one or more dimensions (pricing, score, team, services, languages, location, accreditations, google, reddit, instagram, hrn, registry). Provide clinic_ids (UUIDs), clinic_names (partial matches), or a mix of both — total must be between 2 and 4. Defaults to pricing, score, team, google, reddit, instagram, hrn, registry. Add services or languages when explicitly relevant.",
  schema: z
    .object({
      clinic_ids: z.array(z.string().uuid()).optional(),
      clinic_names: z.array(z.string()).optional(),
      dimensions: z.array(z.enum(ALL_DIMENSIONS)).optional(),
    })
    .refine(
      (d) => (d.clinic_ids?.length ?? 0) + (d.clinic_names?.length ?? 0) >= 2,
      { message: "Provide at least 2 clinics (clinic_ids + clinic_names)" },
    )
    .refine(
      (d) => (d.clinic_ids?.length ?? 0) + (d.clinic_names?.length ?? 0) <= 4,
      { message: "Compare at most 4 clinics" },
    ),
  func: async ({ clinic_ids, clinic_names, dimensions }) => {
    const startTime = Date.now();
    const dims: Dimension[] =
      dimensions && dimensions.length > 0 ? dimensions : DEFAULT_DIMENSIONS;

    try {
      const supabase = await createClient();

      // Resolve each requested clinic in parallel.
      const idRequests = (clinic_ids ?? []).map(async (id) => ({
        request: { type: "clinic_id" as const, value: id },
        clinic: await resolveClinic(supabase, id, undefined),
      }));
      const nameRequests = (clinic_names ?? []).map(async (name) => ({
        request: { type: "clinic_name" as const, value: name },
        clinic: await resolveClinic(supabase, undefined, name),
      }));
      const resolutions = await Promise.all([...idRequests, ...nameRequests]);

      const resolved: ClinicCore[] = [];
      const unresolved: UnresolvedClinic[] = [];
      const seenIds = new Set<string>();
      for (const r of resolutions) {
        if (r.clinic && !seenIds.has(r.clinic.id)) {
          resolved.push(r.clinic);
          seenIds.add(r.clinic.id);
        } else {
          // Covers both "not found" and "duplicate id" — report so the caller knows.
          unresolved.push(r.request);
        }
      }

      // Fetch bundle + signals for each clinic in parallel.
      const bundlesAndSignals = await Promise.all(
        resolved.map(async (c) => {
          const [bundle, redditResult, registryResult, reviewsResult, instagramSocialResult, sourceScoresResult, hrnResult] = await Promise.all([
            fetchClinicData(supabase, c),
            supabase
              .from("clinic_forum_profiles")
              .select("score, thread_count, sentiment_score, summary")
              .eq("clinic_id", c.id)
              .eq("forum_source", "reddit")
              .maybeSingle(),
            supabase
              .from("clinic_registry_records")
              .select("source, license_status, licensed_since")
              .eq("clinic_id", c.id)
              .limit(5),
            supabase
              .from("clinic_reviews")
              .select("rating")
              .eq("clinic_id", c.id)
              .not("rating", "is", null)
              .limit(200),
            supabase
              .from("clinic_social_media")
              .select("follower_count, account_handle, verified")
              .eq("clinic_id", c.id)
              .eq("platform", "instagram")
              .maybeSingle(),
            supabase
              .from("clinic_source_scores")
              .select("source_name, summary_score")
              .eq("clinic_id", c.id)
              .in("source_name", ["instagram", "hrn"]),
            supabase
              .from("clinic_forum_profiles")
              .select("score, thread_count, sentiment_score")
              .eq("clinic_id", c.id)
              .eq("forum_source", "hrn")
              .maybeSingle(),
          ]);

          const scoresBySource = Object.fromEntries(
            (sourceScoresResult.data ?? []).map((r) => [r.source_name, r.summary_score])
          );

          return {
            bundle,
            signals: {
              reddit: (redditResult.data ?? null) as RedditProfileRow | null,
              registry: (registryResult.data ?? []) as RegistryRecordRow[],
              reviews: (reviewsResult.data ?? []) as ReviewRatingRow[],
              instagram: (instagramSocialResult.data ?? null) as InstagramSocialRow | null,
              instagramScore: (scoresBySource["instagram"] ?? null) as number | null,
              hrn: (hrnResult.data ?? null) as HRNProfileRow | null,
            } satisfies ClinicSignals,
          };
        }),
      );

      // Build the per-dimension comparison rows.
      const comparison: Record<Dimension, ComparisonValue[]> = Object.fromEntries(
        dims.map((dim) => [
          dim,
          bundlesAndSignals.map(({ bundle, signals }) => ({
            clinic_id: bundle.clinic.id,
            value: pickDimensionValue(dim, bundle, signals),
          })),
        ]),
      ) as Record<Dimension, ComparisonValue[]>;

      const response: Record<string, unknown> = {
        clinics: resolved.map((c, i) => {
          const media = bundlesAndSignals[i].bundle.media;
          const primary = media.find((m) => m.is_primary) ?? media[0];
          return {
            id: c.id,
            display_name: c.display_name,
            ...(primary ? { image_url: primary.url } : {}),
          };
        }),
        comparison,
        metadata: {
          count: resolved.length,
          dimensions: dims,
          tookMs: Date.now() - startTime,
        },
      };

      if (unresolved.length > 0) {
        response.unresolved = unresolved;
      }

      return JSON.stringify(response);
    } catch (error) {
      return JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: { tookMs: Date.now() - startTime },
      });
    }
  },
});
