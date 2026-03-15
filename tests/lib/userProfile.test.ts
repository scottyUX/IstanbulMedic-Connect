/**
 * Tests for lib/api/userProfile.ts
 *
 * All Supabase interactions are mocked via vi.mock so these run without a real
 * database connection. Each test configures `createClient` to return a fake
 * client whose `.from(table)` chain returns the data needed for that scenario.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getQualification,
  getTreatmentProfile,
  getProfileStatus,
  upsertQualification,
  upsertTreatmentProfile,
  getUserPhotos,
  deleteUserPhoto,
} from '@/lib/api/userProfile'

// ─── Mock Supabase server client ──────────────────────────────────────────────

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
import { createClient } from '@/lib/supabase/server'
const mockCreateClient = vi.mocked(createClient)

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns a chainable query-builder mock that resolves with `result`.
 *
 * Made thenable (has `.then`/`.catch`) so that queries awaited directly
 * without a terminal call like `.maybeSingle()` also resolve correctly —
 * matching how the real Supabase query builder works.
 */
function qb(result: { data: unknown; error: unknown } = { data: null, error: null }) {
  const promise = Promise.resolve(result)
  const builder: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    single: vi.fn().mockResolvedValue(result),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    insert: vi.fn().mockResolvedValue({ error: null }),
    delete: vi.fn().mockReturnThis(),
    // Makes `await queryBuilder` work without calling a terminal method
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
    finally: promise.finally.bind(promise),
  }
  return builder
}

/** Builds a fake Supabase client where each table returns the supplied data. */
function makeClient(
  tableData: Record<string, { data: unknown; error: unknown }>,
  authUser: { id: string } | null = { id: 'auth-user-id' }
) {
  const fromMock = vi.fn().mockImplementation((table: string) => {
    const result = tableData[table] ?? { data: null, error: null }
    return qb(result)
  })

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: authUser },
        error: authUser ? null : new Error('No session'),
      }),
    },
    from: fromMock,
  }
}

// ─── getQualification ─────────────────────────────────────────────────────────

describe('getQualification', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws "Unauthenticated" when there is no logged-in user', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCreateClient.mockResolvedValue(makeClient({}, null) as any)
    await expect(getQualification()).rejects.toThrow('Unauthenticated')
  })

  it('throws when the internal user record does not exist yet', async () => {
    mockCreateClient.mockResolvedValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeClient({ users: { data: null, error: null } }) as any
    )
    await expect(getQualification()).rejects.toThrow('User record not found')
  })

  it('returns null fields when qualification row does not exist', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({
        users: { data: { id: 'internal-id', name: 'Jane Doe', email: 'jane@example.com' }, error: null },
        user_qualification: { data: null, error: null },
        user_profiles: { data: null, error: null },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any
    )

    const result = await getQualification()
    expect(result.ageTier).toBeNull()
    expect(result.country).toBeNull()
    expect(result.hairLossPattern).toBeNull()
    expect(result.budgetTier).toBeNull()
    expect(result.timeline).toBeNull()
    expect(result.whatsApp).toBeNull()
    expect(result.termsAccepted).toBe(false)
    expect(result.gender).toBeNull()
    // Name/email come from the users row even without a qualification row
    expect(result.fullName).toBe('Jane Doe')
    expect(result.email).toBe('jane@example.com')
  })

  it('maps all qualification fields correctly', async () => {
    const qualRow = {
      age_tier: '35_44',
      country: 'Germany',
      hair_loss_pattern: 'advanced',
      budget_tier: '5000_8000',
      timeline: '6_12_months',
      whatsapp_number: '+49123456789',
      preferred_language: 'de',
      terms_accepted: true,
    }

    mockCreateClient.mockResolvedValue(
      makeClient({
        users: { data: { id: 'internal-id', name: 'Klaus Müller', email: 'klaus@example.de' }, error: null },
        user_qualification: { data: qualRow, error: null },
        user_profiles: { data: { gender: 'male', preferred_language: 'de' }, error: null },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any
    )

    const result = await getQualification()
    expect(result.ageTier).toBe('35_44')
    expect(result.country).toBe('Germany')
    expect(result.hairLossPattern).toBe('advanced')
    expect(result.budgetTier).toBe('5000_8000')
    expect(result.timeline).toBe('6_12_months')
    expect(result.whatsApp).toBe('+49123456789')
    expect(result.preferredLanguage).toBe('de')
    expect(result.termsAccepted).toBe(true)
    expect(result.fullName).toBe('Klaus Müller')
    expect(result.email).toBe('klaus@example.de')
    expect(result.gender).toBe('male')
  })

  it('prefers qualification row preferred_language over profile row', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({
        users: { data: { id: 'internal-id', name: 'A', email: 'a@b.com' }, error: null },
        user_qualification: { data: { preferred_language: 'fr', terms_accepted: false }, error: null },
        user_profiles: { data: { preferred_language: 'en' }, error: null },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any
    )

    const result = await getQualification()
    expect(result.preferredLanguage).toBe('fr')
  })
})

// ─── getTreatmentProfile ──────────────────────────────────────────────────────

describe('getTreatmentProfile', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws "Unauthenticated" when there is no logged-in user', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCreateClient.mockResolvedValue(makeClient({}, null) as any)
    await expect(getTreatmentProfile()).rejects.toThrow('Unauthenticated')
  })

  it('returns null when no treatment profile row exists', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({
        users: { data: { id: 'internal-id' }, error: null },
        user_treatment_profiles: { data: null, error: null },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any
    )

    const result = await getTreatmentProfile()
    expect(result).toBeNull()
  })

  it('maps all treatment profile fields correctly', async () => {
    const treatmentRow = {
      norwood_scale: 4,
      hair_loss_duration_years: 5,
      donor_area_quality: 'good',
      donor_area_availability: 'adequate',
      desired_density: 'high',
      had_prior_transplant: false,
      allergies: ['Penicillin'],
      medications: ['Finasteride'],
      other_conditions: ['Diabetes'],
    }
    const transplantRows = [{ year: 2019, estimated_grafts: 2500, clinic_country: 'Turkey' }]
    const surgeryRows = [{ surgery_type: 'Appendectomy', year: 2015, notes: null }]

    // getTreatmentProfile calls from() multiple times; each table must respond correctly.
    // Because makeClient uses a single mock, we override it here.
    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === 'users')
        return qb({ data: { id: 'internal-id' }, error: null })
      if (table === 'user_treatment_profiles')
        return qb({ data: treatmentRow, error: null })
      if (table === 'user_prior_transplants')
        return qb({ data: transplantRows, error: null })
      if (table === 'user_prior_surgeries')
        return qb({ data: surgeryRows, error: null })
      return qb()
    })

    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'auth-id' } }, error: null }) },
      from: fromMock,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const result = await getTreatmentProfile()
    expect(result).not.toBeNull()
    expect(result!.norwoodScale).toBe(4)
    expect(result!.durationYears).toBe(5)
    expect(result!.donorAreaQuality).toBe('good')
    expect(result!.donorAreaAvailability).toBe('adequate')
    expect(result!.desiredDensity).toBe('high')
    expect(result!.hadPriorTransplant).toBe(false)
    expect(result!.allergies).toEqual(['Penicillin'])
    expect(result!.medications).toEqual(['Finasteride'])
    expect(result!.otherConditions).toEqual(['Diabetes'])
    // Prior transplants
    expect(result!.priorTransplants).toHaveLength(1)
    expect(result!.priorTransplants[0].year).toBe(2019)
    expect(result!.priorTransplants[0].estimatedGrafts).toBe(2500)
    expect(result!.priorTransplants[0].clinicCountry).toBe('Turkey')
    // Prior surgeries
    expect(result!.priorSurgeries).toHaveLength(1)
    expect(result!.priorSurgeries[0].type).toBe('Appendectomy')
    expect(result!.priorSurgeries[0].year).toBe(2015)
    expect(result!.priorSurgeries[0].notes).toBeUndefined()
  })

  it('returns empty arrays when no transplants or surgeries', async () => {
    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === 'users') return qb({ data: { id: 'internal-id' }, error: null })
      if (table === 'user_treatment_profiles')
        return qb({ data: { norwood_scale: 3, allergies: [], medications: [], other_conditions: [] }, error: null })
      return qb({ data: [], error: null })
    })

    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'auth-id' } }, error: null }) },
      from: fromMock,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const result = await getTreatmentProfile()
    expect(result!.priorTransplants).toEqual([])
    expect(result!.priorSurgeries).toEqual([])
    expect(result!.allergies).toEqual([])
  })
})

// ─── getProfileStatus ─────────────────────────────────────────────────────────

describe('getProfileStatus', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when there is no logged-in user', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({}, null) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    )

    const result = await getProfileStatus()
    expect(result).toBeNull()
  })

  it('returns both false when the users row does not exist yet', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({ users: { data: null, error: null } }) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    )

    const result = await getProfileStatus()
    expect(result).toEqual({ qualificationComplete: false, treatmentComplete: false })
  })

  it('returns qualificationComplete true when row exists', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({
        users: { data: { id: 'internal-id' }, error: null },
        user_qualification: { data: { id: 'qual-id' }, error: null },
        user_treatment_profiles: { data: null, error: null },
      }) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    )

    const result = await getProfileStatus()
    expect(result!.qualificationComplete).toBe(true)
    expect(result!.treatmentComplete).toBe(false)
  })

  it('returns both true when both rows exist', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({
        users: { data: { id: 'internal-id' }, error: null },
        user_qualification: { data: { id: 'qual-id' }, error: null },
        user_treatment_profiles: { data: { id: 'treat-id' }, error: null },
      }) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    )

    const result = await getProfileStatus()
    expect(result!.qualificationComplete).toBe(true)
    expect(result!.treatmentComplete).toBe(true)
  })
})

// ─── upsertQualification ──────────────────────────────────────────────────────

describe('upsertQualification', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws "Unauthenticated" when not logged in', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({}, null) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    )

    await expect(
      upsertQualification({ termsAccepted: true })
    ).rejects.toThrow('Unauthenticated')
  })

  it('returns userId on success', async () => {
    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === 'users') {
        const b = {
          upsert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: 'new-user-id' }, error: null }),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'new-user-id' }, error: null }),
        }
        return b
      }
      return qb()
    })

    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'auth-id' } }, error: null }) },
      from: fromMock,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const result = await upsertQualification({
      fullName: 'Alice Smith',
      email: 'alice@example.com',
      ageTier: '25_34',
      country: 'UK',
      termsAccepted: true,
    })
    expect(result.userId).toBe('new-user-id')
  })

  it('throws when the users upsert fails', async () => {
    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          upsert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'unique constraint violation' } }),
        }
      }
      return qb()
    })

    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'auth-id' } }, error: null }) },
      from: fromMock,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    await expect(
      upsertQualification({ termsAccepted: true, fullName: 'Bob', email: 'bob@example.com' })
    ).rejects.toMatchObject({ message: 'unique constraint violation' })
  })

  it('throws when the user_profiles upsert fails', async () => {
    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          upsert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: 'user-id' }, error: null }),
        }
      }
      if (table === 'user_profiles') {
        return {
          upsert: vi.fn().mockResolvedValue({ error: { message: 'gender check constraint failed' } }),
        }
      }
      return qb()
    })

    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'auth-id' } }, error: null }) },
      from: fromMock,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    await expect(
      upsertQualification({ termsAccepted: true, gender: 'invalid-value' as never })
    ).rejects.toMatchObject({ message: 'gender check constraint failed' })
  })
})

// ─── upsertTreatmentProfile ───────────────────────────────────────────────────

describe('upsertTreatmentProfile', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws "Unauthenticated" when not logged in', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({}, null) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    )

    await expect(upsertTreatmentProfile({})).rejects.toThrow('Unauthenticated')
  })

  it('returns userId on success with no transplants or surgeries', async () => {
    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === 'users') return qb({ data: { id: 'internal-id' }, error: null })
      // upsert on treatment profiles, delete on transplants/surgeries all succeed
      return qb({ data: null, error: null })
    })

    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'auth-id' } }, error: null }) },
      from: fromMock,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const result = await upsertTreatmentProfile({
      norwoodScale: 3,
      donorAreaQuality: 'good',
      allergies: [],
      medications: [],
      otherConditions: [],
    })
    expect(result.userId).toBe('internal-id')
  })

  it('throws when the treatment profile upsert fails', async () => {
    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === 'users') return qb({ data: { id: 'internal-id' }, error: null })
      if (table === 'user_treatment_profiles') {
        return {
          upsert: vi.fn().mockResolvedValue({ error: { message: 'norwood_check constraint failed' } }),
        }
      }
      return qb()
    })

    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'auth-id' } }, error: null }) },
      from: fromMock,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    await expect(
      upsertTreatmentProfile({ norwoodScale: 99 })
    ).rejects.toMatchObject({ message: 'norwood_check constraint failed' })
  })

  it('inserts prior transplants when hadPriorTransplant is true', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    const deleteMock = vi.fn().mockReturnThis()

    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === 'users') return qb({ data: { id: 'internal-id' }, error: null })
      if (table === 'user_treatment_profiles') return { upsert: vi.fn().mockResolvedValue({ error: null }) }
      if (table === 'user_prior_transplants') return { delete: deleteMock, eq: vi.fn().mockReturnThis(), insert: insertMock }
      if (table === 'user_prior_surgeries') return { delete: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() }
      return qb()
    })

    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'auth-id' } }, error: null }) },
      from: fromMock,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    await upsertTreatmentProfile({
      hadPriorTransplant: true,
      priorTransplants: [{ year: 2020, estimatedGrafts: 3000, clinicCountry: 'Turkey' }],
    })

    expect(insertMock).toHaveBeenCalledWith([
      expect.objectContaining({ year: 2020, estimated_grafts: 3000, clinic_country: 'Turkey' }),
    ])
  })
})

// ─── getUserPhotos ────────────────────────────────────────────────────────────

describe('getUserPhotos', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns empty array when no user is logged in', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({}, null) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    )

    const result = await getUserPhotos()
    expect(result).toEqual([])
  })

  it('returns empty array when user has no internal row', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({ users: { data: null, error: null } }) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    )

    const result = await getUserPhotos()
    expect(result).toEqual([])
  })

  it('returns photo rows from the database', async () => {
    const photoRows = [
      { photo_view: 'front', storage_url: 'https://example.com/front.jpg', file_size_bytes: 102400, mime_type: 'image/jpeg' },
      { photo_view: 'top', storage_url: 'https://example.com/top.jpg', file_size_bytes: 204800, mime_type: 'image/jpeg' },
    ]

    mockCreateClient.mockResolvedValue(
      makeClient({
        users: { data: { id: 'internal-id' }, error: null },
        user_photos: { data: photoRows, error: null },
      }) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    )

    const result = await getUserPhotos()
    expect(result).toHaveLength(2)
    expect(result[0].photo_view).toBe('front')
    expect(result[1].photo_view).toBe('top')
  })

  it('returns empty array when user has no photos', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({
        users: { data: { id: 'internal-id' }, error: null },
        user_photos: { data: [], error: null },
      }) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    )

    const result = await getUserPhotos()
    expect(result).toEqual([])
  })
})

// ─── deleteUserPhoto ──────────────────────────────────────────────────────────

describe('deleteUserPhoto', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws "Unauthenticated" when not logged in', async () => {
    mockCreateClient.mockResolvedValue(
      makeClient({}, null) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    )

    await expect(deleteUserPhoto('front')).rejects.toThrow('Unauthenticated')
  })

  it('calls delete on the correct view for the correct user', async () => {
    const eqViewMock = vi.fn().mockResolvedValue({ error: null })
    const eqUserMock = vi.fn().mockReturnValue({ eq: eqViewMock })
    const deleteMock = vi.fn().mockReturnValue({ eq: eqUserMock })

    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === 'users') return qb({ data: { id: 'internal-id' }, error: null })
      if (table === 'user_photos') return { delete: deleteMock }
      return qb()
    })

    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'auth-id' } }, error: null }) },
      from: fromMock,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    await deleteUserPhoto('front')

    expect(deleteMock).toHaveBeenCalled()
    expect(eqUserMock).toHaveBeenCalledWith('user_id', 'internal-id')
    expect(eqViewMock).toHaveBeenCalledWith('photo_view', 'front')
  })

  it('throws when the delete query fails', async () => {
    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === 'users') return qb({ data: { id: 'internal-id' }, error: null })
      if (table === 'user_photos') {
        return {
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: { message: 'row not found' } }),
            }),
          }),
        }
      }
      return qb()
    })

    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'auth-id' } }, error: null }) },
      from: fromMock,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    await expect(deleteUserPhoto('donor_area')).rejects.toMatchObject({ message: 'row not found' })
  })
})
