import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// Types
// ============================================================================

interface ClinicSummary {
  id: string;
  display_name: string;
  status: string;
  description?: string;
  short_description?: string;
  website_url?: string;
  years_in_operation?: number;
  procedures_performed?: number;
  contact?: {
    phone?: string;
    email?: string;
    whatsapp?: string;
  };
  location?: {
    city: string;
    country: string;
    address?: string;
    postal_code?: string;
    opening_hours?: unknown;
    payment_methods?: string[];
  };
  specialties?: {
    service_name: string;
    service_category: string;
    is_primary: boolean;
  }[];
  accreditations?: {
    credential_name: string;
    credential_type: string;
    issuing_body?: string;
    valid_from?: string;
    valid_to?: string;
  }[];
  pricing?: {
    service_name: string;
    price_min?: number;
    price_max?: number;
    currency?: string;
    pricing_type: string;
    is_verified: boolean;
  }[];
  packages?: {
    package_name: string;
    includes: unknown;
    excludes: unknown;
    nights_included?: number;
    transport_included: boolean;
    aftercare_duration_days?: number;
    price_min?: number;
    price_max?: number;
    currency?: string;
  }[];
  score?: {
    overall_score: number;
    band: string;
  };
  languages?: {
    language: string;
    support_type: string;
  }[];
  team?: {
    name?: string;
    role: string;
    credentials: string;
    years_experience?: number;
  }[];
  review_count?: number;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Strip null/undefined values from an object so the summary only contains
 * fields that actually have data in the database.
 */
function stripNulls<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned as Partial<T>;
}

/**
 * Resolve a clinic row by ID or by name search.
 * Returns the first matching active clinic, or null.
 */
async function resolveClinic(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clinicId?: string,
  clinicName?: string
) {
  // Direct ID lookup
  if (clinicId) {
    const { data, error } = await supabase
      .from("clinics")
      .select("*")
      .eq("id", clinicId)
      .limit(1);

    if (error || !data || data.length === 0) return null;
    return data[0];
  }

  // Name search — partial match, prefer active clinics
  if (clinicName) {
    const { data, error } = await supabase
      .from("clinics")
      .select("*")
      .ilike("display_name", `%${clinicName}%`)
      .limit(5);

    if (error || !data || data.length === 0) return null;

    // Prefer active clinics over inactive/under_review
    const active = data.find((c) => c.status === "active");
    return active ?? data[0];
  }

  return null;
}

// ============================================================================
// Tool definition
// ============================================================================

export const clinicSummaryTool = new DynamicStructuredTool({
  name: "clinic_summary",
  description:
    "Get a comprehensive structured summary of a clinic. Provide either a clinic_id (UUID) for exact lookup, or clinic_name for a name search. Returns: name, location, specialties, accreditations, pricing, packages, trust score, languages, team, review count, and contact info. Only fields that exist in the database are included — no fabricated data. Use this when a patient asks for a clinic overview, profile, or comparison.",
  schema: z
    .object({
      clinic_id: z
        .string()
        .uuid()
        .optional()
        .describe("Exact clinic UUID for direct lookup"),
      clinic_name: z
        .string()
        .optional()
        .describe(
          "Clinic name or partial name to search for (e.g. 'Vera Clinic')"
        ),
    })
    .refine((data) => data.clinic_id || data.clinic_name, {
      message: "Either clinic_id or clinic_name must be provided",
    }),
  func: async ({ clinic_id, clinic_name }) => {
    const startTime = Date.now();

    try {
      const supabase = await createClient();

      // Step 1: Resolve the clinic
      const clinic = await resolveClinic(supabase, clinic_id, clinic_name);

      if (!clinic) {
        return JSON.stringify({
          error: "No clinic found matching the given criteria",
          metadata: { clinic_id, clinic_name, tookMs: Date.now() - startTime },
        });
      }

      const id = clinic.id;

      // Step 2: Fetch all related data in parallel
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
            "city, country, address_line, postal_code, opening_hours, payment_methods, is_primary"
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
            "credential_name, credential_type, issuing_body, valid_from, valid_to"
          )
          .eq("clinic_id", id),
        supabase
          .from("clinic_pricing")
          .select(
            "service_name, price_min, price_max, currency, pricing_type, is_verified"
          )
          .eq("clinic_id", id),
        supabase
          .from("clinic_packages")
          .select(
            "package_name, includes, excludes, nights_included, transport_included, aftercare_duration_days, price_min, price_max, currency"
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

      // Step 3: Build structured summary — only include fields with data
      const summary: ClinicSummary = {
        id: clinic.id,
        display_name: clinic.display_name,
        status: clinic.status,
      };

      // Optional clinic-level fields
      if (clinic.description) summary.description = clinic.description;
      if (clinic.short_description)
        summary.short_description = clinic.short_description;
      if (clinic.website_url) summary.website_url = clinic.website_url;
      if (clinic.years_in_operation != null)
        summary.years_in_operation = clinic.years_in_operation;
      if (clinic.procedures_performed != null)
        summary.procedures_performed = clinic.procedures_performed;

      // Contact info — only if at least one channel exists
      const contact = stripNulls({
        phone: clinic.phone_contact,
        email: clinic.email_contact,
        whatsapp: clinic.whatsapp_contact,
      });
      if (Object.keys(contact).length > 0) {
        summary.contact = contact as ClinicSummary["contact"];
      }

      // Primary location
      const loc = locationsResult.data?.[0];
      if (loc) {
        const location: ClinicSummary["location"] = {
          city: loc.city,
          country: loc.country,
        };
        if (loc.address_line) location.address = loc.address_line;
        if (loc.postal_code) location.postal_code = loc.postal_code;
        if (loc.opening_hours) location.opening_hours = loc.opening_hours;
        if (loc.payment_methods && loc.payment_methods.length > 0)
          location.payment_methods = loc.payment_methods;
        summary.location = location;
      }

      // Specialties / services
      if (servicesResult.data && servicesResult.data.length > 0) {
        summary.specialties = servicesResult.data.map((s) => ({
          service_name: s.service_name,
          service_category: s.service_category,
          is_primary: s.is_primary_service,
        }));
      }

      // Accreditations / credentials
      if (credentialsResult.data && credentialsResult.data.length > 0) {
        summary.accreditations = credentialsResult.data.map((c) =>
          stripNulls({
            credential_name: c.credential_name,
            credential_type: c.credential_type,
            issuing_body: c.issuing_body,
            valid_from: c.valid_from,
            valid_to: c.valid_to,
          })
        ) as ClinicSummary["accreditations"];
      }

      // Pricing
      if (pricingResult.data && pricingResult.data.length > 0) {
        summary.pricing = pricingResult.data.map((p) =>
          stripNulls({
            service_name: p.service_name,
            price_min: p.price_min,
            price_max: p.price_max,
            currency: p.currency,
            pricing_type: p.pricing_type,
            is_verified: p.is_verified,
          })
        ) as ClinicSummary["pricing"];
      }

      // Packages
      if (packagesResult.data && packagesResult.data.length > 0) {
        summary.packages = packagesResult.data.map((pkg) =>
          stripNulls({
            package_name: pkg.package_name,
            includes: pkg.includes,
            excludes: pkg.excludes,
            nights_included: pkg.nights_included,
            transport_included: pkg.transport_included,
            aftercare_duration_days: pkg.aftercare_duration_days,
            price_min: pkg.price_min,
            price_max: pkg.price_max,
            currency: pkg.currency,
          })
        ) as ClinicSummary["packages"];
      }

      // Trust score
      const score = scoresResult.data?.[0];
      if (score) {
        summary.score = {
          overall_score: score.overall_score,
          band: score.band,
        };
      }

      // Languages
      if (languagesResult.data && languagesResult.data.length > 0) {
        summary.languages = languagesResult.data.map((l) => ({
          language: l.language,
          support_type: l.support_type,
        }));
      }

      // Team
      if (teamResult.data && teamResult.data.length > 0) {
        summary.team = teamResult.data.map((t) =>
          stripNulls({
            name: t.name,
            role: t.role,
            credentials: t.credentials,
            years_experience: t.years_experience,
          })
        ) as ClinicSummary["team"];
      }

      // Review count
      if (reviewCountResult.count != null && reviewCountResult.count > 0) {
        summary.review_count = reviewCountResult.count;
      }

      return JSON.stringify({
        summary,
        metadata: {
          tookMs: Date.now() - startTime,
        },
      });
    } catch (error) {
      return JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: { clinic_id, clinic_name, tookMs: Date.now() - startTime },
      });
    }
  },
});
