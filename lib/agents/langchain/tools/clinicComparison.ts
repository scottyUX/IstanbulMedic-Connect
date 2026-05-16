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
] as const;

type Dimension = (typeof ALL_DIMENSIONS)[number];

const DEFAULT_DIMENSIONS: Dimension[] = ["pricing", "score", "team", "services"];

interface UnresolvedClinic {
  type: "clinic_id" | "clinic_name";
  value: string;
}

interface ComparisonValue {
  clinic_id: string;
  value: unknown;
}

function pickDimensionValue(
  dim: Dimension,
  bundle: ClinicDataBundle,
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
  }
}

export const clinicComparisonTool = new DynamicStructuredTool({
  name: "clinic_comparison",
  description:
    "Compare 2-4 clinics side by side across one or more dimensions (pricing, score, team, services, languages, location, accreditations). Provide clinic_ids (UUIDs), clinic_names (partial matches), or a mix of both — total must be between 2 and 4. If dimensions is omitted, defaults to pricing, score, team, services. Use this when a patient asks to compare clinics, pick between options, or weigh tradeoffs.",
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
        } else if (!r.clinic) {
          unresolved.push(r.request);
        }
      }

      // Fetch data for all resolved clinics in parallel.
      const bundles = await Promise.all(
        resolved.map((c) => fetchClinicData(supabase, c)),
      );

      // Build the per-dimension comparison rows.
      const comparison: Record<Dimension, ComparisonValue[]> = Object.fromEntries(
        dims.map((dim) => [
          dim,
          bundles.map((bundle) => ({
            clinic_id: bundle.clinic.id,
            value: pickDimensionValue(dim, bundle),
          })),
        ]),
      ) as Record<Dimension, ComparisonValue[]>;

      const response: Record<string, unknown> = {
        clinics: resolved.map((c) => ({ id: c.id, display_name: c.display_name })),
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
