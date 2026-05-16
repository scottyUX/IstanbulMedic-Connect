// Shared helpers used across clinic_* tools.
//
// Keep this file focused on data fetching primitives. Output shaping (null
// stripping, summary assembly) stays in each tool so per-tool tests can mock
// fetchClinicData without coupling to a particular response shape.

import type { createClient } from "@/lib/supabase/server";

export type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export interface ClinicCore {
  id: string;
  display_name: string;
  status: string;
  description?: string | null;
  short_description?: string | null;
  website_url?: string | null;
  phone_contact?: string | null;
  email_contact?: string | null;
  whatsapp_contact?: string | null;
  years_in_operation?: number | null;
  procedures_performed?: number | null;
}

export interface ClinicDataBundle {
  clinic: ClinicCore;
  location?: {
    city: string;
    country: string;
    address_line?: string | null;
    postal_code?: string | null;
    opening_hours?: unknown;
    payment_methods?: string[] | null;
  };
  services: {
    service_name: string;
    service_category: string;
    is_primary_service: boolean;
  }[];
  credentials: {
    credential_name: string;
    credential_type: string;
    issuing_body?: string | null;
    valid_from?: string | null;
    valid_to?: string | null;
  }[];
  pricing: {
    service_name: string;
    price_min?: number | null;
    price_max?: number | null;
    currency?: string | null;
    pricing_type: string;
    is_verified: boolean | null;
  }[];
  packages: {
    package_name: string;
    includes: unknown;
    excludes: unknown;
    nights_included?: number | null;
    transport_included: boolean;
    aftercare_duration_days?: number | null;
    price_min?: number | null;
    price_max?: number | null;
    currency?: string | null;
  }[];
  score?: { overall_score: number; band: string };
  languages: { language: string; support_type: string }[];
  team: {
    name: string | null;
    role: string;
    credentials: string;
    years_experience: number | null;
  }[];
  reviewCount: number;
}

/**
 * Resolve a clinic row by ID or by name search.
 * Returns the first matching clinic, preferring `active` status on name search.
 */
export async function resolveClinic(
  supabase: SupabaseClient,
  clinicId?: string,
  clinicName?: string,
): Promise<ClinicCore | null> {
  if (clinicId) {
    const { data, error } = await supabase
      .from("clinics")
      .select("*")
      .eq("id", clinicId)
      .limit(1);
    if (error || !data || data.length === 0) return null;
    return data[0] as ClinicCore;
  }
  if (clinicName) {
    const { data, error } = await supabase
      .from("clinics")
      .select("*")
      .ilike("display_name", `%${clinicName}%`)
      .limit(5);
    if (error || !data || data.length === 0) return null;
    const active = data.find((c) => c.status === "active");
    return (active ?? data[0]) as ClinicCore;
  }
  return null;
}

/**
 * Fetch all clinic-related rows in parallel for a given clinic_id.
 * Both clinic_summary and clinic_comparison rely on this so the
 * underlying Supabase queries stay in lockstep across tools.
 */
export async function fetchClinicData(
  supabase: SupabaseClient,
  clinic: ClinicCore,
): Promise<ClinicDataBundle> {
  const id = clinic.id;

  const [
    locationsResult,
    servicesResult,
    credentialsResult,
    pricingResult,
    packagesResult,
    scoresResult,
    languagesResult,
    teamResult,
    reviewCountResult,
  ] = await Promise.all([
    supabase
      .from("clinic_locations")
      .select(
        "city, country, address_line, postal_code, opening_hours, payment_methods, is_primary",
      )
      .eq("clinic_id", id)
      .eq("is_primary", true)
      .limit(1),
    supabase
      .from("clinic_services")
      .select("service_name, service_category, is_primary_service")
      .eq("clinic_id", id),
    supabase
      .from("clinic_credentials")
      .select(
        "credential_name, credential_type, issuing_body, valid_from, valid_to",
      )
      .eq("clinic_id", id),
    supabase
      .from("clinic_pricing")
      .select(
        "service_name, price_min, price_max, currency, pricing_type, is_verified",
      )
      .eq("clinic_id", id),
    supabase
      .from("clinic_packages")
      .select(
        "package_name, includes, excludes, nights_included, transport_included, aftercare_duration_days, price_min, price_max, currency",
      )
      .eq("clinic_id", id),
    supabase
      .from("clinic_scores")
      .select("overall_score, band")
      .eq("clinic_id", id)
      .limit(1),
    supabase
      .from("clinic_languages")
      .select("language, support_type")
      .eq("clinic_id", id),
    supabase
      .from("clinic_team")
      .select("name, role, credentials, years_experience")
      .eq("clinic_id", id),
    supabase
      .from("clinic_reviews")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", id),
  ]);

  const score = scoresResult.data?.[0];

  return {
    clinic,
    location: locationsResult.data?.[0] ?? undefined,
    services: servicesResult.data ?? [],
    credentials: credentialsResult.data ?? [],
    pricing: pricingResult.data ?? [],
    packages: packagesResult.data ?? [],
    score: score
      ? { overall_score: score.overall_score, band: score.band }
      : undefined,
    languages: languagesResult.data ?? [],
    team: teamResult.data ?? [],
    reviewCount: reviewCountResult.count ?? 0,
  };
}
