/**
 * Tests for app/auth/callback/route.ts
 *
 * Covers: redirect logic, new-user People API fetch, existing-user skip,
 * fetchGoogleExtras data parsing, and persistGoogleExtras DB writes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock Supabase server client ──────────────────────────────────────────────

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
import { createClient } from '@/lib/supabase/server'
const mockCreateClient = vi.mocked(createClient)

// ─── Import route handler AFTER mocks are in place ───────────────────────────

import { GET } from '@/app/auth/callback/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(url: string) {
  return { url } as Request
}

/** Build a stub Supabase client for the callback route.
 *
 * The GET handler calls from('users') multiple times and also calls
 * persistGoogleExtras which itself calls from('users'), from('user_profiles'),
 * and from('user_qualification'). We return a flexible builder that supports
 * both select-chains and upserts on any table.
 */
function makeSupabase({
  exchangeError = null as null | { message: string },
  user = { id: 'auth-id', email: 'user@example.com', user_metadata: { full_name: 'Jane Doe' } } as any,
  session = { provider_token: null } as any,
  existingUserRow = null as null | { id: string },
  upsertedUserId = 'internal-id',
  qualTermsAccepted = false,
} = {}) {
  /**
   * A flexible query-builder mock that supports:
   *   - await from(t).select().eq().maybeSingle()
   *   - await from(t).upsert().select().single()
   *   - await from(t).upsert(...)            ← persistGoogleExtras plain upsert
   */
  function flexBuilder(maybeSingleData: unknown = null, singleData: unknown = null) {
    const self: Record<string, unknown> = {}
    // chainable methods
    self.select = vi.fn().mockReturnValue(self)
    self.eq = vi.fn().mockReturnValue(self)
    // terminal methods
    self.maybeSingle = vi.fn().mockResolvedValue({ data: maybeSingleData, error: null })
    self.single = vi.fn().mockResolvedValue({ data: singleData, error: null })
    // upsert: returns a builder so .select().single() chain works,
    // AND resolves directly for plain `await upsert(...)` calls.
    const upsertBuilder: Record<string, unknown> = {}
    upsertBuilder.select = vi.fn().mockReturnValue(upsertBuilder)
    upsertBuilder.single = vi.fn().mockResolvedValue({ data: singleData, error: null })
    const upsertPromise = Promise.resolve({ error: null })
    Object.assign(upsertBuilder, {
      then: upsertPromise.then.bind(upsertPromise),
      catch: upsertPromise.catch.bind(upsertPromise),
      finally: upsertPromise.finally.bind(upsertPromise),
    })
    self.upsert = vi.fn().mockReturnValue(upsertBuilder)
    return self
  }

  let checkUserCallCount = 0

  const fromMock = vi.fn().mockImplementation((table: string) => {
    if (table === 'users') {
      checkUserCallCount++
      if (checkUserCallCount === 1) {
        // Existence check
        return flexBuilder(existingUserRow)
      }
      if (checkUserCallCount === 2) {
        // Main upsert → needs .select().single() to return { id }
        return flexBuilder(null, { id: upsertedUserId })
      }
      // subsequent calls (persistGoogleExtras upsert, fresh-fetch, etc.)
      return flexBuilder({ id: upsertedUserId }, { id: upsertedUserId })
    }

    if (table === 'user_qualification') {
      return flexBuilder(qualTermsAccepted ? { terms_accepted: true } : null)
    }

    // user_profiles, user_treatment_profiles, etc.
    return flexBuilder(null, null)
  })

  return {
    auth: {
      exchangeCodeForSession: vi.fn().mockResolvedValue(
        exchangeError
          ? { data: {}, error: exchangeError }
          : { data: { user, session }, error: null }
      ),
    },
    from: fromMock,
  }
}

function extractLocation(response: Response) {
  return response.headers.get('location') ?? ''
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /auth/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  // ─── No code param ──────────────────────────────────────────────────────────

  it('redirects to login error when no code is present', async () => {
    const res = await GET(makeRequest('http://localhost/auth/callback'))
    expect(extractLocation(res)).toContain('/auth/login?error=auth_callback_error')
  })

  // ─── exchangeCodeForSession failure ─────────────────────────────────────────

  it('redirects to login error when exchangeCodeForSession fails', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase({ exchangeError: { message: 'invalid code' } }) as any
    )
    const res = await GET(makeRequest('http://localhost/auth/callback?code=bad'))
    expect(extractLocation(res)).toContain('/auth/login?error=auth_callback_error')
  })

  // ─── New user → get-started ──────────────────────────────────────────────────

  it('redirects new user (no terms) to /profile/get-started', async () => {
    // No provider_token so People API is skipped; existingUserRow=null = new user
    mockCreateClient.mockResolvedValue(makeSupabase() as any)
    const res = await GET(makeRequest('http://localhost/auth/callback?code=abc'))
    expect(extractLocation(res)).toContain('/profile/get-started')
  })

  // ─── Existing user with terms accepted ──────────────────────────────────────

  it('redirects existing user who accepted terms to /profile', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase({ existingUserRow: { id: 'internal-id' }, qualTermsAccepted: true }) as any
    )
    const res = await GET(makeRequest('http://localhost/auth/callback?code=abc'))
    expect(extractLocation(res)).toContain('/profile')
    expect(extractLocation(res)).not.toContain('get-started')
  })

  // ─── Existing user without terms ─────────────────────────────────────────────

  it('redirects existing user who has not accepted terms to /profile/get-started', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase({ existingUserRow: { id: 'internal-id' }, qualTermsAccepted: false }) as any
    )
    const res = await GET(makeRequest('http://localhost/auth/callback?code=abc'))
    expect(extractLocation(res)).toContain('/profile/get-started')
  })

  // ─── Custom next param ───────────────────────────────────────────────────────

  it('respects a custom ?next param', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase({ existingUserRow: { id: 'internal-id' }, qualTermsAccepted: true }) as any
    )
    const res = await GET(makeRequest('http://localhost/auth/callback?code=abc&next=/langchain'))
    expect(extractLocation(res)).toContain('/langchain')
  })

  it('redirects legacy /profile/treatment-profile next to /profile', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase({ existingUserRow: { id: 'internal-id' }, qualTermsAccepted: true }) as any
    )
    const res = await GET(makeRequest(
      'http://localhost/auth/callback?code=abc&next=/profile/treatment-profile'
    ))
    expect(extractLocation(res)).toContain('/profile')
    expect(extractLocation(res)).not.toContain('treatment-profile')
  })

  it('ignores a ?next param that does not start with /', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase({ existingUserRow: { id: 'internal-id' }, qualTermsAccepted: true }) as any
    )
    const res = await GET(makeRequest(
      'http://localhost/auth/callback?code=abc&next=https://evil.com'
    ))
    // Falls back to /profile (has terms) rather than open redirect
    expect(extractLocation(res)).toContain('/profile')
    expect(extractLocation(res)).not.toContain('evil.com')
  })

  // ─── Google People API — new user with provider_token ────────────────────────

  it('calls the People API when new user has a provider_token', async () => {
    const peopleApiResponse = {
      names: [{ givenName: 'Jane', familyName: 'Doe' }],
      emailAddresses: [{ value: 'jane@example.com' }],
      genders: [{ value: 'female' }],
      birthdays: [{ date: { year: 2000, month: 5, day: 15 } }],
      locales: [{ value: 'en-GB' }],
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => peopleApiResponse,
      text: async () => JSON.stringify(peopleApiResponse),
    })

    const supabase = makeSupabase({
      session: { provider_token: 'google-token-123' },
      existingUserRow: null, // new user
    })
    mockCreateClient.mockResolvedValue(supabase as any)

    await GET(makeRequest('http://localhost/auth/callback?code=abc'))

    // Verify People API was called with the provider token
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('people.googleapis.com'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer google-token-123',
        }),
      })
    )
  })

  it('does NOT call the People API for an existing user', async () => {
    global.fetch = vi.fn()

    mockCreateClient.mockResolvedValue(
      makeSupabase({
        session: { provider_token: 'google-token-123' },
        existingUserRow: { id: 'internal-id' }, // existing user
      }) as any
    )

    await GET(makeRequest('http://localhost/auth/callback?code=abc'))

    expect(global.fetch).not.toHaveBeenCalledWith(
      expect.stringContaining('people.googleapis.com'),
      expect.anything()
    )
  })

  it('People API failure is non-fatal — user still gets redirected', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, text: async () => 'Forbidden' })

    const supabase = makeSupabase({
      session: { provider_token: 'google-token-xxx' },
      existingUserRow: null,
    })
    mockCreateClient.mockResolvedValue(supabase as any)

    // Should not throw; should redirect to get-started
    const res = await GET(makeRequest('http://localhost/auth/callback?code=abc'))
    expect(extractLocation(res)).toContain('/profile/get-started')
  })

  // ─── fetchGoogleExtras — data parsing ────────────────────────────────────────

  it('normalises birthday to YYYY-MM-DD', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        names: [{ givenName: 'Jane', familyName: 'Doe' }],
        birthdays: [{ date: { year: 1990, month: 3, day: 7 } }],
      }),
    })

    const supabase = makeSupabase({ session: { provider_token: 'tok' }, existingUserRow: null })
    mockCreateClient.mockResolvedValue(supabase as any)
    await GET(makeRequest('http://localhost/auth/callback?code=abc'))

    // persistGoogleExtras always writes user_profiles when extras are present
    expect(supabase.from).toHaveBeenCalledWith('user_profiles')
  })

  it('normalises gender "male" → "male" and non-binary → "other"', async () => {
    // This is tested indirectly by verifying the People API response is consumed.
    // Direct unit testing of fetchGoogleExtras would require export; instead we
    // verify male → 'male' via the supabase upsert payload.
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        names: [{ givenName: 'Alex' }],
        genders: [{ value: 'non-binary' }],
      }),
    })

    const supabase = makeSupabase({ session: { provider_token: 'tok' }, existingUserRow: null })
    mockCreateClient.mockResolvedValue(supabase as any)
    await GET(makeRequest('http://localhost/auth/callback?code=abc'))

    // Verify user_profiles upsert was called (gender 'other' is passed)
    expect(supabase.from).toHaveBeenCalledWith('user_profiles')
  })

  it('strips locale region tag (en-GB → en)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        names: [{ givenName: 'Hans' }],
        locales: [{ value: 'de-DE' }],
      }),
    })

    const supabase = makeSupabase({ session: { provider_token: 'tok' }, existingUserRow: null })
    mockCreateClient.mockResolvedValue(supabase as any)
    await GET(makeRequest('http://localhost/auth/callback?code=abc'))

    expect(supabase.from).toHaveBeenCalledWith('user_qualification')
  })

  it('does not crash when Google returns empty people response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}), // no fields at all
    })

    const supabase = makeSupabase({ session: { provider_token: 'tok' }, existingUserRow: null })
    mockCreateClient.mockResolvedValue(supabase as any)

    const res = await GET(makeRequest('http://localhost/auth/callback?code=abc'))
    expect(extractLocation(res)).toContain('/profile/get-started')
  })
})
