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
import { getClinicRegistryData } from '@/lib/api/registry'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Missing clinic id' }, { status: 400 })
  }

  try {
    const data = await getClinicRegistryData(id)
    return NextResponse.json(data)
  } catch (err) {
    console.error('[registry] error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
