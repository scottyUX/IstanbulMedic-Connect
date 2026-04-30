import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Supabase mock ──────────────────────────────────────────────────────────────
const mockRegistrySelect = vi.fn()
const mockComplianceSelect = vi.fn()

// Each `from()` call returns a different mock chain depending on the table name
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'clinic_registry_records') {
        return {
          select: mockRegistrySelect,
        }
      }
      return {
        select: mockComplianceSelect,
      }
    }),
  })),
}))

// Stub env vars before the route module is imported
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key')

import { GET } from '@/app/api/clinics/[id]/registry/route'

// ── Helpers ────────────────────────────────────────────────────────────────────
function makeRequest(clinicId: string): Request {
  return new NextRequest(`http://localhost/api/clinics/${clinicId}/registry`)
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

function chainFor(selectMock: ReturnType<typeof vi.fn>, data: unknown, error: unknown = null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data, error }),
  }
  selectMock.mockReturnValue(chain)
  return chain
}

// ── Tests ──────────────────────────────────────────────────────────────────────
describe('GET /api/clinics/[id]/registry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 with empty arrays when no records exist', async () => {
    chainFor(mockRegistrySelect, [])
    chainFor(mockComplianceSelect, [])

    const res = await GET(makeRequest('clinic-1'), makeParams('clinic-1'))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.registryRecords).toEqual([])
    expect(body.complianceHistory).toEqual([])
  })

  it('returns registry records and compliance history', async () => {
    const records = [{ id: 'r1', license_number: 'MOH-1', license_status: 'active' }]
    const events = [{ id: 'e1', event_type: 'inspection_warning', severity: 'low' }]

    chainFor(mockRegistrySelect, records)
    chainFor(mockComplianceSelect, events)

    const res = await GET(makeRequest('clinic-1'), makeParams('clinic-1'))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.registryRecords).toEqual(records)
    expect(body.complianceHistory).toEqual(events)
  })

  it('returns 500 with a generic error message when registry query fails', async () => {
    chainFor(mockRegistrySelect, null, { message: 'DB error' })
    chainFor(mockComplianceSelect, [])

    const res = await GET(makeRequest('clinic-1'), makeParams('clinic-1'))
    expect(res.status).toBe(500)

    const body = await res.json()
    // Raw DB error messages should not leak — clients get a generic message
    expect(body.error).toBe('Internal server error')
    expect(body.error).not.toContain('DB error')
  })

  it('returns 500 with a generic error message when compliance query fails', async () => {
    chainFor(mockRegistrySelect, [])
    chainFor(mockComplianceSelect, null, { message: 'Compliance DB error' })

    const res = await GET(makeRequest('clinic-1'), makeParams('clinic-1'))
    expect(res.status).toBe(500)

    const body = await res.json()
    expect(body.error).toBe('Internal server error')
    expect(body.error).not.toContain('Compliance DB error')
  })

  it('returns 500 when Supabase env vars are missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')

    const res = await GET(makeRequest('clinic-1'), makeParams('clinic-1'))
    expect(res.status).toBe(500)

    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
  })
})
