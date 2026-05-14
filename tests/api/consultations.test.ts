/**
 * Tests for app/api/consultations/route.ts
 *
 * Covers:
 *   POST — auth gate, body validation, user lookup, email validation,
 *           batch pre-filter (the "skip already-pending" fix), email failure
 *           propagation, insert error, and the happy path.
 *   GET  — auth gate, missing user row (returns empty list, not 404),
 *           happy path with image join, and DB error.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { NextRequest } from 'next/server'

// ─── Mocks must be declared before any imports from the module under test ─────

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/email/sendConsultationRequest', () => ({
  sendConsultationRequest: vi.fn().mockResolvedValue(undefined),
  sendConsultationConfirmation: vi.fn().mockResolvedValue(undefined),
}))

import { createClient } from '@/lib/supabase/server'
import { sendConsultationRequest } from '@/lib/email/sendConsultationRequest'
import { POST, GET } from '@/app/api/consultations/route'

const mockCreateClient = vi.mocked(createClient)
const mockSendEmail = vi.mocked(sendConsultationRequest)

// ─── Chain builder ─────────────────────────────────────────────────────────────
//
// Every Supabase call in this route is a chained query that ends in either:
//   - .maybeSingle()  → returns { data, error }
//   - .single()       → returns { data, error }
//   - a plain await on the last method in the chain (e.g. .eq(), .in(), .order())
//
// This builder returns an object that is both chainable (every method returns
// itself) AND thenable (so `await chain` resolves to { data, error }).

function makeChain(data: unknown, error: unknown = null) {
  const result = { data, error }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj: any = {}

  // Chainable query-builder methods — all return `obj` so chains like
  // .select().eq().in().eq() work without needing real Supabase.
  for (const method of ['select', 'eq', 'in', 'insert', 'order', 'is', 'neq', 'limit']) {
    obj[method] = vi.fn().mockReturnValue(obj)
  }

  // Terminal methods that return a promise
  obj.maybeSingle = vi.fn().mockResolvedValue(result)
  obj.single = vi.fn().mockResolvedValue(result)

  // Make the object itself awaitable so that chains not ending with a
  // terminal method (e.g. `await supabase.from('x').select().eq()`) work.
  const p = Promise.resolve(result)
  obj.then = p.then.bind(p)
  obj.catch = p.catch.bind(p)
  obj.finally = p.finally.bind(p)

  return obj
}

// ─── Supabase client factory ───────────────────────────────────────────────────

interface MakeSupabaseOptions {
  authUser?: { id: string; email: string } | null
  authError?: { message: string } | null
  userRow?: { id: string; name: string; email: string } | null
  clinicRows?: { id: string; display_name: string }[]
  existingPending?: { clinic_id: string }[]
  existingPendingError?: { message: string } | null
  insertResult?: { data: { id: string; clinic_id: string }[] | null; error: { message: string } | null }
}

function makeSupabase({
  authUser = { id: 'auth-uid', email: 'user@test.com' },
  authError = null,
  userRow = { id: 'user-uuid', name: 'Test User', email: 'user@test.com' },
  clinicRows = [{ id: 'clinic-1', display_name: 'Clinic One' }],
  existingPending = [],
  existingPendingError = null,
  insertResult = { data: [{ id: 'consult-1', clinic_id: 'clinic-1' }], error: null },
}: MakeSupabaseOptions = {}) {
  // Track how many times `consultations` table has been accessed so we can
  // distinguish the pre-filter SELECT from the INSERT (both hit the same table).
  let consultationsCallCount = 0

  const fromMock = vi.fn().mockImplementation((table: string) => {
    switch (table) {
      case 'users':
        return makeChain(userRow)

      case 'clinics':
        return makeChain(clinicRows)

      // Passport profile tables — all optional; returning null is fine
      case 'user_qualification':
      case 'user_treatment_profiles':
      case 'user_profiles':
      case 'user_prior_transplants':
      case 'user_prior_surgeries':
      case 'user_photos':
        return makeChain(null)

      case 'consultations': {
        consultationsCallCount++
        if (consultationsCallCount === 1) {
          // First call: pre-filter SELECT — returns existing pending rows
          return makeChain(existingPending, existingPendingError)
        }
        // Second call: INSERT — returns the newly created rows (or error)
        return makeChain(insertResult.data, insertResult.error)
      }

      case 'clinic_media':
        return makeChain([])

      default:
        return makeChain(null)
    }
  })

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue(
        authError
          ? { data: { user: null }, error: authError }
          : { data: { user: authUser }, error: null }
      ),
    },
    from: fromMock,
  }
}

// Wire a supabase stub into the mocked createClient
function mockClient(supabase: ReturnType<typeof makeSupabase>) {
  // The route calls `await createClient()` so we mockResolvedValue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockCreateClient.mockResolvedValue(supabase as any)
}

// Build a minimal NextRequest for POST (only `.json()` is called by the route)
function makePostRequest(body: object): NextRequest {
  return { json: vi.fn().mockResolvedValue(body) } as unknown as NextRequest
}

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/consultations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Auth gate ───────────────────────────────────────────────────────────────

  it('returns 401 when there is no authenticated user', async () => {
    mockClient(makeSupabase({ authError: { message: 'not authed' } }))
    const res = await POST(makePostRequest({ clinicIds: ['clinic-1'] }))
    expect(res.status).toBe(401)
  })

  // ── Body validation ─────────────────────────────────────────────────────────

  it('returns 400 when clinicIds is missing from the body', async () => {
    mockClient(makeSupabase())
    const res = await POST(makePostRequest({}))
    expect(res.status).toBe(400)
  })

  it('returns 400 when clinicIds is an empty array', async () => {
    mockClient(makeSupabase())
    const res = await POST(makePostRequest({ clinicIds: [] }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when clinicIds contains no valid string IDs', async () => {
    mockClient(makeSupabase())
    const res = await POST(makePostRequest({ clinicIds: ['', null, 42] }))
    expect(res.status).toBe(400)
  })

  // ── User record lookup ──────────────────────────────────────────────────────
  //
  // There are two separate failure modes: no auth session (401) and a valid
  // auth session but no matching row in the `users` table (404). We test the
  // 404 path here to make sure they're not conflated.

  it('returns 404 when the auth user has no matching users row', async () => {
    mockClient(makeSupabase({ userRow: null }))
    const res = await POST(makePostRequest({ clinicIds: ['clinic-1'] }))
    expect(res.status).toBe(404)
  })

  // ── Email validation ────────────────────────────────────────────────────────
  //
  // This was a real bug: user_email fell back to '' which satisfied the NOT NULL
  // constraint but inserted bad data. Now the route validates before inserting
  // and returns 500 if no email is available from either source.

  it('returns 500 when neither the users row nor auth.user has an email', async () => {
    mockClient(makeSupabase({
      authUser: { id: 'auth-uid', email: '' },
      userRow: { id: 'user-uuid', name: 'Test User', email: '' },
    }))
    const res = await POST(makePostRequest({ clinicIds: ['clinic-1'] }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/email/i)
  })

  // ── Batch pre-filter ────────────────────────────────────────────────────────
  //
  // The fix for the duplicate-key bug: instead of letting the insert fail when
  // a clinic is already pending, we pre-query and filter them out. These two
  // tests lock in that behaviour.

  it('skips already-pending clinics and only inserts the new ones', async () => {
    // clinic-1 is already pending, clinic-2 is new
    mockClient(makeSupabase({
      clinicRows: [
        { id: 'clinic-1', display_name: 'Clinic One' },
        { id: 'clinic-2', display_name: 'Clinic Two' },
      ],
      existingPending: [{ clinic_id: 'clinic-1' }],
      insertResult: { data: [{ id: 'consult-2', clinic_id: 'clinic-2' }], error: null },
    }))

    const res = await POST(makePostRequest({ clinicIds: ['clinic-1', 'clinic-2'] }))
    expect(res.status).toBe(200)
    const body = await res.json()
    // Only clinic-2 was new — that's the one that should be inserted
    expect(body.created).toBe(1)
    expect(body.skipped).toBe(1)
  })

  it('deduplicates clinicIds before inserting', async () => {
    const supabase = makeSupabase({
      clinicRows: [
        { id: 'clinic-1', display_name: 'Clinic One' },
        { id: 'clinic-2', display_name: 'Clinic Two' },
      ],
      insertResult: {
        data: [
          { id: 'consult-1', clinic_id: 'clinic-1' },
          { id: 'consult-2', clinic_id: 'clinic-2' },
        ],
        error: null,
      },
    })
    mockClient(supabase)

    const res = await POST(makePostRequest({ clinicIds: ['clinic-1', 'clinic-1', 'clinic-2'] }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.created).toBe(2)
    expect(body.skipped).toBe(0)

    const insertChain = supabase.from.mock.results
      .filter((r) => r.value?.insert)
      .at(-1)?.value
    expect(insertChain.insert).toHaveBeenCalledWith([
      expect.objectContaining({ clinic_id: 'clinic-1' }),
      expect.objectContaining({ clinic_id: 'clinic-2' }),
    ])
  })

  it('returns 500 when the existing-pending lookup fails', async () => {
    mockClient(makeSupabase({
      existingPendingError: { message: 'lookup failed' },
    }))

    const res = await POST(makePostRequest({ clinicIds: ['clinic-1'] }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/existing consultations/i)
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('returns created:0 early without inserting when all clinics are already pending', async () => {
    mockClient(makeSupabase({
      existingPending: [{ clinic_id: 'clinic-1' }],
    }))

    const res = await POST(makePostRequest({ clinicIds: ['clinic-1'] }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.created).toBe(0)
    expect(body.skipped).toBe(1)
    // The email should never be attempted when nothing was inserted
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  // ── Insert error ────────────────────────────────────────────────────────────

  it('returns 500 when the DB insert fails', async () => {
    mockClient(makeSupabase({
      insertResult: { data: null, error: { message: 'unique violation' } },
    }))
    const res = await POST(makePostRequest({ clinicIds: ['clinic-1'] }))
    expect(res.status).toBe(500)
  })

  // ── Happy path ──────────────────────────────────────────────────────────────

  it('creates consultation records and returns emailSent:true on success', async () => {
    mockClient(makeSupabase())

    const res = await POST(makePostRequest({ clinicIds: ['clinic-1'] }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.created).toBe(1)
    expect(body.skipped).toBe(0)
    expect(body.emailSent).toBe(true)
    expect(mockSendEmail).toHaveBeenCalledOnce()
  })

  // ── Email failure propagation ───────────────────────────────────────────────
  //
  // The fix from last session: if sendConsultationRequest throws, the records
  // are already saved (we don't roll back) but the response contains
  // emailSent:false so the UI can show the amber warning banner.

  it('saves records and returns emailSent:false when the email sender throws', async () => {
    mockClient(makeSupabase())
    mockSendEmail.mockRejectedValueOnce(new Error('SMTP timeout'))

    const res = await POST(makePostRequest({ clinicIds: ['clinic-1'] }))
    expect(res.status).toBe(200)
    const body = await res.json()
    // Records were still created
    expect(body.created).toBe(1)
    // But email flag is false — this drives the amber banner in the UI
    expect(body.emailSent).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/consultations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Auth gate ───────────────────────────────────────────────────────────────

  it('returns 401 when there is no authenticated user', async () => {
    mockClient(makeSupabase({ authError: { message: 'not authed' } }))
    const res = await GET()
    expect(res.status).toBe(401)
  })

  // ── Missing user row ────────────────────────────────────────────────────────
  //
  // If there's a valid auth session but no users row yet (e.g. mid-onboarding),
  // the route intentionally returns an empty list rather than a 404 — the user
  // just has no consultations yet.

  it('returns an empty consultations list when no users row exists', async () => {
    mockClient(makeSupabase({ userRow: null }))
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.consultations).toEqual([])
  })

  // ── Happy path ──────────────────────────────────────────────────────────────
  //
  // The GET handler joins clinics and clinic_media and shapes the response.
  // We verify the shape here: camelCase keys, clinicLocation composed from
  // primary_city + primary_country, and clinicImage pulled from the media join.

  it('returns shaped consultations with clinic data and image', async () => {
    const consultationData = [
      {
        id: 'consult-1',
        status: 'pending',
        created_at: '2026-05-09T00:00:00Z',
        clinic_id: 'clinic-1',
        clinics: {
          id: 'clinic-1',
          display_name: 'Clinic One',
          primary_city: 'Istanbul',
          primary_country: 'Turkey',
        },
      },
    ]

    // We need the GET-path `from('consultations')` to return consultationData,
    // and `from('clinic_media')` to return the image row.
    // makeSupabase routes these correctly via the consultationRows / mediaRows options.
    // However, the GET handler hits `from('consultations')` only once (SELECT, no INSERT),
    // so we need a custom supabase stub here.
    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'auth-uid', email: 'user@test.com' } },
          error: null,
        }),
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'users') return makeChain({ id: 'user-uuid' })
        if (table === 'consultations') return makeChain(consultationData)
        if (table === 'clinic_media') return makeChain([{ clinic_id: 'clinic-1', url: 'https://cdn.example.com/img.jpg' }])
        return makeChain(null)
      }),
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCreateClient.mockResolvedValue(supabase as any)

    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.consultations).toHaveLength(1)

    const c = body.consultations[0]
    expect(c.id).toBe('consult-1')
    expect(c.status).toBe('pending')
    expect(c.clinicName).toBe('Clinic One')
    expect(c.clinicLocation).toBe('Istanbul, Turkey')
    expect(c.clinicImage).toBe('https://cdn.example.com/img.jpg')
  })

  // ── DB error ────────────────────────────────────────────────────────────────

  it('returns 500 when the consultations query fails', async () => {
    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'auth-uid', email: 'user@test.com' } },
          error: null,
        }),
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'users') return makeChain({ id: 'user-uuid' })
        if (table === 'consultations') return makeChain(null, { message: 'connection refused' })
        return makeChain(null)
      }),
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCreateClient.mockResolvedValue(supabase as any)

    const res = await GET()
    expect(res.status).toBe(500)
  })
})
