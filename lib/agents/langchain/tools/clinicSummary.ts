import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { resolveClinic, fetchClinicData } from "./_shared";

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
  media?: {
    url: string;
    alt_text?: string;
    caption?: string;
    is_primary?: boolean;
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
  instagram?: {
    handle: string | null;
    follower_count: number | null;
    verified: boolean | null;
  };
  reddit?: {
    score: number | null;
    thread_count: number;
    sentiment_score: number | null;
  };
  registry_verified?: boolean;
  google?: { rating: number | null; total: number | null };
}

// ============================================================================
// Helpers
// ============================================================================

function stripNulls<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned as Partial<T>;
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

      const clinic = await resolveClinic(supabase, clinic_id, clinic_name);
      if (!clinic) {
        return JSON.stringify({
          error: "No clinic found matching the given criteria",
          metadata: { clinic_id, clinic_name, tookMs: Date.now() - startTime },
        });
      }

      const [bundle, socialResult, redditResult, registryResult, googleResult] = await Promise.all([
        fetchClinicData(supabase, clinic),
        supabase
          .from("clinic_social_media")
          .select("account_handle, follower_count, verified")
          .eq("clinic_id", clinic.id)
          .eq("platform", "instagram")
          .maybeSingle(),
        supabase
          .from("clinic_forum_profiles")
          .select("score, thread_count, sentiment_score")
          .eq("clinic_id", clinic.id)
          .eq("forum_source", "reddit")
          .maybeSingle(),
        supabase
          .from("clinic_registry_records")
          .select("license_status")
          .eq("clinic_id", clinic.id)
          .limit(5),
        supabase
          .from("clinic_google_places")
          .select("rating, user_ratings_total")
          .eq("clinic_id", clinic.id)
          .maybeSingle(),
      ]);

      const summary: ClinicSummary = {
        id: clinic.id,
        display_name: clinic.display_name,
        status: clinic.status,
      };

      if (clinic.description) summary.description = clinic.description;
      if (clinic.short_description)
        summary.short_description = clinic.short_description;
      if (clinic.website_url) summary.website_url = clinic.website_url;
      if (clinic.years_in_operation != null)
        summary.years_in_operation = clinic.years_in_operation;
      if (clinic.procedures_performed != null)
        summary.procedures_performed = clinic.procedures_performed;

      const contact = stripNulls({
        phone: clinic.phone_contact,
        email: clinic.email_contact,
        whatsapp: clinic.whatsapp_contact,
      });
      if (Object.keys(contact).length > 0) {
        summary.contact = contact as ClinicSummary["contact"];
      }

      const loc = bundle.location;
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

      if (bundle.services.length > 0) {
        summary.specialties = bundle.services.map((s) => ({
          service_name: s.service_name,
          service_category: s.service_category,
          is_primary: s.is_primary_service,
        }));
      }

      if (bundle.credentials.length > 0) {
        summary.accreditations = bundle.credentials.map((c) =>
          stripNulls({
            credential_name: c.credential_name,
            credential_type: c.credential_type,
            issuing_body: c.issuing_body,
            valid_from: c.valid_from,
            valid_to: c.valid_to,
          })
        ) as ClinicSummary["accreditations"];
      }

      if (bundle.pricing.length > 0) {
        summary.pricing = bundle.pricing.map((p) =>
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

      if (bundle.packages.length > 0) {
        summary.packages = bundle.packages.map((pkg) =>
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

      if (bundle.media.length > 0) {
        summary.media = bundle.media.map((m) =>
          stripNulls({
            url: m.url,
            alt_text: m.alt_text,
            caption: m.caption,
            is_primary: m.is_primary,
          })
        ) as ClinicSummary["media"];
      }

      if (bundle.score) {
        summary.score = bundle.score;
      }

      if (bundle.languages.length > 0) {
        summary.languages = bundle.languages.map((l) => ({
          language: l.language,
          support_type: l.support_type,
        }));
      }

      if (bundle.team.length > 0) {
        summary.team = bundle.team.map((t) =>
          stripNulls({
            name: t.name,
            role: t.role,
            credentials: t.credentials,
            years_experience: t.years_experience,
          })
        ) as ClinicSummary["team"];
      }

      if (bundle.reviewCount > 0) {
        summary.review_count = bundle.reviewCount;
      }

      if (socialResult.data) {
        summary.instagram = {
          handle: socialResult.data.account_handle,
          follower_count: socialResult.data.follower_count,
          verified: socialResult.data.verified,
        };
      }

      if (redditResult.data) {
        const r = redditResult.data;
        summary.reddit = {
          score: r.score != null ? Number(r.score) : null,
          thread_count: r.thread_count ?? 0,
          sentiment_score: r.sentiment_score != null ? Number(r.sentiment_score) : null,
        };
      }

      if ((registryResult.data ?? []).some((r) => r.license_status === "active")) {
        summary.registry_verified = true;
      }

      if (googleResult.data) {
        summary.google = {
          rating: googleResult.data.rating,
          total: googleResult.data.user_ratings_total,
        };
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
