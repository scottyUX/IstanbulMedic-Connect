// RUN THE TEST WITH THIS COMMAND
// npx vitest run tests/import-google-places.test.ts --pool=vmThreads

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// ─── Mock fetch (for uploadPhotoToStorage) ────────────────────────────────────
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  ok: true,
  arrayBuffer: async () => new ArrayBuffer(8),
}))

// ─── Mock Supabase ────────────────────────────────────────────────────────────
const mockSingle = vi.fn()
const mockSelect = vi.fn(() => ({ 
  single: mockSingle,
  eq: vi.fn().mockReturnValue({ single: mockSingle }),
  order: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ single: mockSingle }) }),
}))
const mockInsert = vi.fn(() => ({ select: mockSelect }))
const mockUpdate = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }))
const mockDelete = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({}) }))
const mockUpsert = vi.fn(() => ({ select: mockSelect }))
const mockFrom   = vi.fn(() => ({
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
  upsert: mockUpsert,
  select: mockSelect,
}))

const mockUpload = vi.fn().mockResolvedValue({ error: null })

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: mockFrom,
    storage: {
      from: vi.fn().mockReturnValue({
        upload: mockUpload,
      }),
    },
  }),
}))

// ─── Helpers (duplicated from route.ts for unit testing) ─────────────────────
function extractLocationDetails(addressComponents: any[], claimsLocation?: any) {
  let city = claimsLocation?.city || ''
  let state = claimsLocation?.state || ''
  let country = claimsLocation?.country || ''
  let postal_code = claimsLocation?.postal_code || ''

  for (const component of addressComponents || []) {
    if (component.types.includes('locality') && !city) city = component.long_name
    if (component.types.includes('administrative_area_level_1') && !state) state = component.long_name
    if (component.types.includes('country') && !country) country = component.long_name
    if (component.types.includes('postal_code') && !postal_code) postal_code = component.long_name
  }

  return {
    city: city || state || 'Unknown',
    country: country || 'Unknown',
    postal_code,
  }
}

function mapServiceType(serviceType: string) {
  const lower = serviceType.toLowerCase()
  if (lower.includes('hair') || lower.includes('transplant')) return { category: 'Medical Tourism', name: 'Hair Transplant' }
  if (lower.includes('nose') || lower.includes('rhino'))       return { category: 'Cosmetic',        name: 'Rhinoplasty' }
  if (lower.includes('dental') || lower.includes('teeth'))     return { category: 'Dental',          name: 'Other' }
  return { category: 'Other', name: 'Other' }
}

function constructPhotoUrl(photo: any): string {
  if (typeof photo === 'string') return photo
  if (photo.photo_reference) {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}`
  }
  return ''
}

// ─── extractLocationDetails ───────────────────────────────────────────────────
describe('extractLocationDetails', () => {
  const components = [
    { types: ['locality'],                    long_name: 'Istanbul' },
    { types: ['administrative_area_level_1'], long_name: 'Istanbul Province' },
    { types: ['country'],                     long_name: 'Turkey' },
    { types: ['postal_code'],                 long_name: '34000' },
  ]

  it('extracts city, country, and postal_code from address components', () => {
    expect(extractLocationDetails(components)).toEqual({
      city: 'Istanbul',
      country: 'Turkey',
      postal_code: '34000',
    })
  })

  it('prefers claims values over address components', () => {
    const claims = { city: 'Ankara', country: 'Turkey', postal_code: '06000' }
    expect(extractLocationDetails(components, claims)).toEqual({
      city: 'Ankara',
      country: 'Turkey',
      postal_code: '06000',
    })
  })

  it('falls back to state when city is missing', () => {
    const noCity = components.filter(c => !c.types.includes('locality'))
    expect(extractLocationDetails(noCity).city).toBe('Istanbul Province')
  })

  it('returns Unknown when no location data exists', () => {
    expect(extractLocationDetails([])).toEqual({
      city: 'Unknown',
      country: 'Unknown',
      postal_code: '',
    })
  })

  it('handles null address components gracefully', () => {
    expect(extractLocationDetails(null as any)).toEqual({
      city: 'Unknown',
      country: 'Unknown',
      postal_code: '',
    })
  })
})

// ─── mapServiceType ───────────────────────────────────────────────────────────
describe('mapServiceType', () => {
  it.each([
    ['Hair Transplant',   { category: 'Medical Tourism', name: 'Hair Transplant' }],
    ['hair restoration',  { category: 'Medical Tourism', name: 'Hair Transplant' }],
    ['FUE Transplant',    { category: 'Medical Tourism', name: 'Hair Transplant' }],
    ['Rhinoplasty',       { category: 'Cosmetic',        name: 'Rhinoplasty' }],
    ['nose job',          { category: 'Cosmetic',        name: 'Rhinoplasty' }],
    ['Dental Implants',   { category: 'Dental',          name: 'Other' }],
    ['teeth whitening',   { category: 'Dental',          name: 'Other' }],
    ['Laser Eye Surgery', { category: 'Other',           name: 'Other' }],
  ])('maps "%s" correctly', (input, expected) => {
    expect(mapServiceType(input)).toEqual(expected)
  })
})

// ─── constructPhotoUrl ────────────────────────────────────────────────────────
describe('constructPhotoUrl', () => {
  it('returns a string URL unchanged', () => {
    expect(constructPhotoUrl('https://example.com/photo.jpg')).toBe('https://example.com/photo.jpg')
  })

  it('builds a Google Places photo URL from a photo_reference', () => {
    const url = constructPhotoUrl({ photo_reference: 'ABC123' })
    expect(url).toContain('photo_reference=ABC123')
    expect(url).toContain('maxwidth=800')
    expect(url).not.toContain('key=')
  })

  it('returns empty string when photo has no reference', () => {
    expect(constructPhotoUrl({})).toBe('')
  })
})

// ─── POST /api/import/google-places ──────────────────────────────────────────
describe('POST /api/import/google-places', () => {
  const validPayload = {
    clinicId: 'clinic-uuid-123',
    googlePlacesData: {
      google_places: {
        place_id: 'ChIJ46c0kwG3yhQRxYnQckUyqPg',
        display_name: 'Test Hair Clinic',
        formatted_address: 'Test St, Istanbul, Turkey',
        rating: 4.8,
        user_ratings_total: 500,
        website: 'https://testclinic.com',
        phone: '+90 212 000 0000',
        international_phone: '+90 212 000 0000',
        location: { lat: 41.0082, lng: 28.9784 },
        address_components: [
          { types: ['locality'],    long_name: 'Istanbul' },
          { types: ['country'],     long_name: 'Turkey' },
          { types: ['postal_code'], long_name: '34000' },
        ],
        opening_hours: { weekday_text: ['Mon: 9am-6pm'] },
        photos: [{ photo_reference: 'REF1' }, { photo_reference: 'REF2' }],
        reviews: [
          { rating: 5, text: 'Great clinic!', time: 1700000000, language: 'en' },
        ],
        types: ['health', 'establishment'],
      },
      extracted_claims: {
        location: { city: 'Istanbul', country: 'Turkey' },
        contact: {
          website_candidates: ['https://testclinic.com'],
          phone_candidates: ['+90 212 000 0000'],
          email_candidates: [],
          whatsapp_candidates: [],
        },
        services: {
          claimed: ['Hair Transplant'],
          primary_service: 'Hair Transplant',
        },
      },
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockSingle.mockResolvedValue({ data: { id: 'source-uuid' }, error: null })

    const mockOrder = vi.fn().mockReturnValue({
      limit: vi.fn().mockReturnValue({ single: mockSingle })
    })
    const mockEq = vi.fn().mockReturnValue({
      order: mockOrder,
      single: mockSingle,
    })
    mockSelect.mockReturnValue({
      single: mockSingle,
      eq: mockEq,
      order: mockOrder,
    })
    mockInsert.mockReturnValue({ select: mockSelect })
    mockUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    mockDelete.mockReturnValue({ eq: vi.fn().mockResolvedValue({}) })
    mockUpsert.mockReturnValue({ select: mockSelect })

    // Reset fetch mock to default success
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    } as any)

    mockUpload.mockResolvedValue({ error: null })
  })

  async function callRoute(body: any) {
    const { POST } = await import('../app/api/import/google-places/route')
    const req = new NextRequest('http://localhost/api/import/google-places', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
    return POST(req)
  }

  it('returns 400 when clinicId is missing', async () => {
    const res = await callRoute({ googlePlacesData: validPayload.googlePlacesData })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/clinicId/)
  })

  it('returns 400 when googlePlacesData is missing', async () => {
    const res = await callRoute({ clinicId: 'clinic-uuid-123' })
    expect(res.status).toBe(400)
  })

  it('returns 200 and correct shape on success', async () => {
    const res = await callRoute(validPayload)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toMatchObject({
      success: true,
      clinic_id: 'clinic-uuid-123',
      place_id: 'ChIJ46c0kwG3yhQRxYnQckUyqPg',
      display_name: 'Test Hair Clinic',
    })
  })

  it('returns 500 when Supabase source insert fails', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } })
    const res = await callRoute(validPayload)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('DB error')
  })
})