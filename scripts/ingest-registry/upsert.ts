/**
 * Upserts normalized registry data into Supabase.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { NormalizedClinicData } from './normalize'

let cachedClient: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
  }

  cachedClient = createClient(url, key)
  return cachedClient
}

/**
 * Looks up a clinic_id by its legal name.
 * Tries exact match first, then a case-insensitive partial match.
 * Returns null if zero or ambiguous matches.
 */
async function findClinicId(supabase: SupabaseClient, legalName: string): Promise<string | null> {
  const exact = await supabase
    .from('clinics')
    .select('id')
    .eq('legal_name', legalName)
    .limit(2)

  if (exact.error) return null
  if (exact.data && exact.data.length === 1) return exact.data[0].id as string

  // Fallback: case-insensitive substring match. Escape ilike wildcards in the input
  // so a literal '%' or '_' in a clinic name doesn't widen the search.
  const escaped = legalName.replace(/[\\%_]/g, (c) => `\\${c}`)
  const fuzzy = await supabase
    .from('clinics')
    .select('id, legal_name')
    .ilike('legal_name', `%${escaped}%`)
    .limit(2)

  if (fuzzy.error || !fuzzy.data || fuzzy.data.length !== 1) return null
  return fuzzy.data[0].id as string
}

/**
 * Upserts a single registry record and its compliance events for a clinic.
 * Skips silently if the clinic can't be matched by legal name.
 */
export async function upsertRegistryData(data: NormalizedClinicData): Promise<void> {
  const supabase = getSupabaseClient()

  const clinicId = await findClinicId(supabase, data.matchKey)
  if (!clinicId) {
    console.warn(`  ⚠ No unique clinic found for "${data.matchKey}" — skipping`)
    return
  }

  // Upsert the registry record (unique on clinic_id + source + license_number)
  const { error: registryError } = await supabase
    .from('clinic_registry_records')
    .upsert(
      {
        clinic_id: clinicId,
        source: data.registry.source,
        license_number: data.registry.licenseNumber,
        license_status: data.registry.licenseStatus,
        licensed_since: data.registry.licensedSince,
        expires_at: data.registry.expiresAt,
        authorized_specialties: data.registry.authorizedSpecialties,
        registered_legal_name: data.registry.registeredLegalName,
        registered_address: data.registry.registeredAddress,
        registry_url: data.registry.registryUrl,
        raw_data: data.registry.rawData,
        last_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'clinic_id,source,license_number' }
    )

  if (registryError) {
    throw new Error(`Failed to upsert registry record for "${data.matchKey}": ${registryError.message}`)
  }

  // Insert compliance events (append-only — don't upsert to preserve history)
  if (data.complianceEvents.length > 0) {
    const { error: complianceError } = await supabase
      .from('clinic_compliance_history')
      .insert(
        data.complianceEvents.map((event) => ({
          clinic_id: clinicId,
          source: event.source,
          event_type: event.eventType,
          event_date: event.eventDate,
          description: event.description,
          resolved_at: event.resolvedAt,
          severity: event.severity,
          raw_data: event.rawData,
        }))
      )

    if (complianceError) {
      throw new Error(`Failed to insert compliance events for "${data.matchKey}": ${complianceError.message}`)
    }
  }

  console.log(
    `  ✓ ${data.matchKey} — ${data.registry.source} — ${data.registry.licenseStatus} — ${data.complianceEvents.length} compliance event(s)`
  )
}
