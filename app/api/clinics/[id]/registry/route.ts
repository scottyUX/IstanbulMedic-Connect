/**
 * GET /api/clinics/[id]/registry
 *
 * Returns verified public registry data and compliance history for a clinic.
 * Data is sourced from official registries (Turkish Ministry of Health).
 *
 * Response shape:
 * {
 *   registryRecords: RegistryRecord[]
 *   complianceHistory: ComplianceEvent[]
 * }
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createClient(url, key)
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Missing clinic id' }, { status: 400 })
  }

  try {
    const supabase = getSupabase()

    const [registryResult, complianceResult] = await Promise.all([
      supabase
        .from('clinic_registry_records')
        .select(`
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
        `)
        .eq('clinic_id', id)
        .order('last_verified_at', { ascending: false }),

      supabase
        .from('clinic_compliance_history')
        .select(`
          id,
          source,
          event_type,
          event_date,
          description,
          resolved_at,
          severity
        `)
        .eq('clinic_id', id)
        .order('event_date', { ascending: false }),
    ])

    if (registryResult.error) throw new Error(registryResult.error.message)
    if (complianceResult.error) throw new Error(complianceResult.error.message)

    return NextResponse.json({
      registryRecords: registryResult.data ?? [],
      complianceHistory: complianceResult.data ?? [],
    })
  } catch (err) {
    console.error('[registry] error:', err)
    return NextResponse.json(
      { error: (err as Error).message ?? 'Internal server error' },
      { status: 500 }
    )
  }
}
