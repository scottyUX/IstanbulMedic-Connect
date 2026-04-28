/**
 * Shared registry data query — used by both the server-rendered profile page
 * and the GET /api/clinics/[id]/registry route.
 */

import { createClient } from '@supabase/supabase-js'
import type {
  RegistryRecord,
  ComplianceEvent,
} from '@/components/istanbulmedic-connect/profile/RegistrySection'

export interface ClinicRegistryData {
  registryRecords: RegistryRecord[]
  complianceHistory: ComplianceEvent[]
}

const REGISTRY_COLUMNS = `
  id,
  source,
  license_number,
  license_status,
  licensed_since,
  expires_at,
  authorized_specialties,
  registered_legal_name,
  registered_address,
  registry_url,
  last_verified_at
`

const COMPLIANCE_COLUMNS = `
  id,
  source,
  event_type,
  event_date,
  description,
  resolved_at,
  severity
`

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createClient(url, key)
}

/**
 * Fetches registry records and compliance history for a clinic.
 * Throws on missing env vars or Supabase error — callers decide how to surface it.
 */
export async function getClinicRegistryData(clinicId: string): Promise<ClinicRegistryData> {
  const supabase = getServiceClient()

  const [registryResult, complianceResult] = await Promise.all([
    supabase
      .from('clinic_registry_records')
      .select(REGISTRY_COLUMNS)
      .eq('clinic_id', clinicId)
      .order('last_verified_at', { ascending: false }),
    supabase
      .from('clinic_compliance_history')
      .select(COMPLIANCE_COLUMNS)
      .eq('clinic_id', clinicId)
      .order('event_date', { ascending: false }),
  ])

  if (registryResult.error) throw registryResult.error
  if (complianceResult.error) throw complianceResult.error

  return {
    registryRecords: (registryResult.data ?? []) as RegistryRecord[],
    complianceHistory: (complianceResult.data ?? []) as ComplianceEvent[],
  }
}
