import { GuardrailError } from "./errors";

/**
 * Closed-by-default allowlist of Supabase tables that database_lookup may read.
 *
 * Anything not in this set is denied — including (but not limited to) user-PII
 * tables (users, user_profiles, patient_profiles), consultation records,
 * uploads, forum/social/HRN pipeline tables, auth.* and storage.* schemas,
 * and data-pipeline metadata like `sources`.
 */
export const ALLOWED_TABLES: ReadonlySet<string> = new Set([
  "clinics",
  "clinic_locations",
  "clinic_services",
  "clinic_credentials",
  "clinic_pricing",
  "clinic_packages",
  "clinic_scores",
  "clinic_languages",
  "clinic_team",
  "clinic_reviews",
  "clinic_google_places",
  "clinic_mentions",
  "clinic_facts",
  "clinic_media",
]);

/**
 * Throws GuardrailError("schema_allowlist", ...) when the requested table is
 * not in the allowlist. Comparison is case-sensitive and strict — no
 * trimming, no normalization, no schema-qualified lookups.
 */
export function assertTableAllowed(table: string): void {
  if (!ALLOWED_TABLES.has(table)) {
    throw new GuardrailError(
      "schema_allowlist",
      `Table '${table}' is not accessible`,
    );
  }
}
