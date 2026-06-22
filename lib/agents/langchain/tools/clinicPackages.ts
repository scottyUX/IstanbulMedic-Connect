import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

interface Package {
  id: string;
  package_name: string;
  includes?: unknown;
  excludes?: unknown;
  nights_included?: number;
  transport_included?: boolean;
  aftercare_duration_days?: number;
  price_min?: number;
  price_max?: number;
  currency?: string;
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

export const clinicPackagesTool = new DynamicStructuredTool({
  name: "clinic_packages",
  description:
    "Look up treatment packages for a clinic, with their inclusions, nights, transport, aftercare, and price range. Provide clinic_id (UUID) or clinic_name (partial match). Optional: max_price to filter by ceiling, currency (default EUR). Use this when a patient asks about packages, inclusions, or what's covered for a given budget.",
  schema: z
    .object({
      clinic_id: z.string().uuid().optional(),
      clinic_name: z.string().optional(),
      max_price: z.number().positive().optional(),
      currency: z.string().optional(),
    })
    .refine((d) => Boolean(d.clinic_id || d.clinic_name), {
      message: "Provide clinic_id or clinic_name",
    }),
  func: async ({ clinic_id, clinic_name, max_price, currency }) => {
    const startTime = Date.now();
    const currencyFilter = currency ?? "EUR";

    try {
      const supabase = await createClient();

      const clinic = await resolveClinic(supabase, clinic_id, clinic_name);
      if (!clinic) {
        return JSON.stringify({
          error: "No clinic found matching the given criteria",
          metadata: { tookMs: Date.now() - startTime },
        });
      }

      let query = supabase
        .from("clinic_packages")
        .select(
          "id, package_name, includes, excludes, nights_included, transport_included, aftercare_duration_days, price_min, price_max, currency",
        )
        .eq("clinic_id", clinic.id);

      if (max_price != null) {
        query = query.lte("price_max", max_price);
      }

      const { data, error } = await query
        .order("price_min", { ascending: true })
        .limit(20);

      if (error) {
        return JSON.stringify({
          error: error.message,
          metadata: { tookMs: Date.now() - startTime },
        });
      }

      const packages: Package[] = (data ?? []).map((row) =>
        stripNulls({
          id: row.id,
          package_name: row.package_name,
          includes: row.includes,
          excludes: row.excludes,
          nights_included: row.nights_included,
          transport_included: row.transport_included,
          aftercare_duration_days: row.aftercare_duration_days,
          price_min: row.price_min,
          price_max: row.price_max,
          currency: row.currency,
        }) as Package,
      );

      return JSON.stringify({
        clinic: { id: clinic.id, display_name: clinic.display_name },
        packages,
        metadata: {
          count: packages.length,
          currency: currencyFilter,
          tookMs: Date.now() - startTime,
        },
      });
    } catch (error) {
      return JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: { tookMs: Date.now() - startTime },
      });
    }
  },
});
