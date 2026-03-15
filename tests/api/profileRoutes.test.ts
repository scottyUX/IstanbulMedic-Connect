/**
 * Tests for the profile API route handlers.
 *
 * The route handlers are thin wrappers around userProfile.ts lib functions.
 * We mock the lib functions and verify that each route:
 *  - calls the right lib function
 *  - returns 200 with { success: true, data } on success
 *  - returns 401 when the lib throws 'Unauthenticated'
 *  - returns 500 for unexpected errors
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

// ─── Mock lib functions ────────────────────────────────────────────────────────

vi.mock('@/lib/api/userProfile', () => ({
  getQualification: vi.fn(),
  upsertQualification: vi.fn(),
  getTreatmentProfile: vi.fn(),
  upsertTreatmentProfile: vi.fn(),
  getProfileStatus: vi.fn(),
  getUserPhotos: vi.fn(),
  deleteUserPhoto: vi.fn(),
}))

import {
  getQualification,
  upsertQualification,
  getTreatmentProfile,
  upsertTreatmentProfile,
  getProfileStatus,
  getUserPhotos,
  deleteUserPhoto,
} from '@/lib/api/userProfile'

// Import the route handlers AFTER mocking their dependencies
import { GET as qualificationGET, POST as qualificationPOST } from '@/app/api/profile/qualification/route'
import { GET as treatmentGET, POST as treatmentPOST } from '@/app/api/profile/treatment/route'
import { GET as statusGET } from '@/app/api/profile/status/route'
import { GET as photosGET, DELETE as photosDELETE } from '@/app/api/profile/photos/route'

const mockGetQualification = vi.mocked(getQualification)
const mockUpsertQualification = vi.mocked(upsertQualification)
const mockGetTreatmentProfile = vi.mocked(getTreatmentProfile)
const mockUpsertTreatmentProfile = vi.mocked(upsertTreatmentProfile)
const mockGetProfileStatus = vi.mocked(getProfileStatus)
const mockGetUserPhotos = vi.mocked(getUserPhotos)
const mockDeleteUserPhoto = vi.mocked(deleteUserPhoto)

// ─── Helper ───────────────────────────────────────────────────────────────────

async function jsonBody(response: NextResponse) {
  return response.json()
}

function makeRequest(body: unknown) {
  return { json: async () => body } as Request
}

// ─── /api/profile/qualification ───────────────────────────────────────────────

describe('GET /api/profile/qualification', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with data on success', async () => {
    const mockData = { ageTier: '25_34', country: 'UK', termsAccepted: true }
    mockGetQualification.mockResolvedValue(mockData as never)

    const response = await qualificationGET()
    const body = await jsonBody(response)

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toEqual(mockData)
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetQualification.mockRejectedValue(new Error('Unauthenticated'))

    const response = await qualificationGET()
    const body = await jsonBody(response)

    expect(response.status).toBe(401)
    expect(body.success).toBe(false)
    expect(body.error).toBe('Unauthenticated')
  })

  it('returns 500 for unexpected errors', async () => {
    mockGetQualification.mockRejectedValue(new Error('DB connection failed'))

    const response = await qualificationGET()
    const body = await jsonBody(response)

    expect(response.status).toBe(500)
    expect(body.success).toBe(false)
  })
})

describe('POST /api/profile/qualification', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with userId on success', async () => {
    mockUpsertQualification.mockResolvedValue({ userId: 'user-abc' })

    const payload = { ageTier: '25_34', termsAccepted: true }
    const response = await qualificationPOST(makeRequest(payload))
    const body = await jsonBody(response)

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.userId).toBe('user-abc')
    expect(mockUpsertQualification).toHaveBeenCalledWith(payload)
  })

  it('returns 401 when unauthenticated', async () => {
    mockUpsertQualification.mockRejectedValue(new Error('Unauthenticated'))

    const response = await qualificationPOST(makeRequest({}))
    const body = await jsonBody(response)

    expect(response.status).toBe(401)
    expect(body.success).toBe(false)
  })

  it('returns 500 on unexpected error', async () => {
    mockUpsertQualification.mockRejectedValue(new Error('Constraint violation'))

    const response = await qualificationPOST(makeRequest({}))

    expect(response.status).toBe(500)
  })
})

// ─── /api/profile/treatment ───────────────────────────────────────────────────

describe('GET /api/profile/treatment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with null data when no treatment profile exists', async () => {
    mockGetTreatmentProfile.mockResolvedValue(null)

    const response = await treatmentGET()
    const body = await jsonBody(response)

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toBeNull()
  })

  it('returns 200 with treatment data on success', async () => {
    const mockData = {
      norwoodScale: 3,
      durationYears: 5,
      donorAreaQuality: 'good',
      allergies: ['Penicillin'],
      priorTransplants: [],
      priorSurgeries: [],
    }
    mockGetTreatmentProfile.mockResolvedValue(mockData as never)

    const response = await treatmentGET()
    const body = await jsonBody(response)

    expect(response.status).toBe(200)
    expect(body.data.norwoodScale).toBe(3)
    expect(body.data.allergies).toEqual(['Penicillin'])
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetTreatmentProfile.mockRejectedValue(new Error('Unauthenticated'))

    const response = await treatmentGET()
    expect(response.status).toBe(401)
  })

  it('returns 500 on unexpected error', async () => {
    mockGetTreatmentProfile.mockRejectedValue(new Error('Query failed'))

    const response = await treatmentGET()
    expect(response.status).toBe(500)
  })
})

describe('POST /api/profile/treatment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with userId on success', async () => {
    mockUpsertTreatmentProfile.mockResolvedValue({ userId: 'user-xyz' })

    const payload = { norwoodScale: 4, donorAreaQuality: 'adequate' }
    const response = await treatmentPOST(makeRequest(payload))
    const body = await jsonBody(response)

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.userId).toBe('user-xyz')
    expect(mockUpsertTreatmentProfile).toHaveBeenCalledWith(payload)
  })

  it('returns 401 when unauthenticated', async () => {
    mockUpsertTreatmentProfile.mockRejectedValue(new Error('Unauthenticated'))

    const response = await treatmentPOST(makeRequest({}))
    expect(response.status).toBe(401)
  })
})

// ─── /api/profile/status ──────────────────────────────────────────────────────

describe('GET /api/profile/status', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when getProfileStatus returns null (unauthenticated)', async () => {
    mockGetProfileStatus.mockResolvedValue(null)

    const response = await statusGET()
    const body = await jsonBody(response)

    expect(response.status).toBe(401)
    expect(body.success).toBe(false)
    expect(body.error).toBe('Unauthenticated')
  })

  it('returns both phases as false for a new user with no records', async () => {
    mockGetProfileStatus.mockResolvedValue({
      qualificationComplete: false,
      treatmentComplete: false,
    })

    const response = await statusGET()
    const body = await jsonBody(response)

    expect(body.data.qualificationComplete).toBe(false)
    expect(body.data.treatmentComplete).toBe(false)
  })

  it('returns qualificationComplete true when phase 1 is done', async () => {
    mockGetProfileStatus.mockResolvedValue({
      qualificationComplete: true,
      treatmentComplete: false,
    })

    const response = await statusGET()
    const body = await jsonBody(response)

    expect(body.data.qualificationComplete).toBe(true)
    expect(body.data.treatmentComplete).toBe(false)
  })

  it('returns both true when both sections are complete', async () => {
    mockGetProfileStatus.mockResolvedValue({
      qualificationComplete: true,
      treatmentComplete: true,
    })

    const response = await statusGET()
    const body = await jsonBody(response)

    expect(body.data.qualificationComplete).toBe(true)
    expect(body.data.treatmentComplete).toBe(true)
  })

  it('returns 500 on unexpected errors', async () => {
    mockGetProfileStatus.mockRejectedValue(new Error('DB error'))

    const response = await statusGET()
    expect(response.status).toBe(500)
  })
})

// ─── /api/profile/photos ──────────────────────────────────────────────────────

describe('GET /api/profile/photos', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with empty array when user has no photos', async () => {
    mockGetUserPhotos.mockResolvedValue([])

    const response = await photosGET()
    const body = await jsonBody(response)

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toEqual([])
  })

  it('returns 200 with photo rows', async () => {
    const photoRows = [
      { photo_view: 'front', storage_url: 'https://example.com/front.jpg' },
      { photo_view: 'top',   storage_url: 'https://example.com/top.jpg' },
    ]
    mockGetUserPhotos.mockResolvedValue(photoRows as never)

    const response = await photosGET()
    const body = await jsonBody(response)

    expect(response.status).toBe(200)
    expect(body.data).toHaveLength(2)
    expect(body.data[0].photo_view).toBe('front')
  })

  it('returns 500 on unexpected errors', async () => {
    mockGetUserPhotos.mockRejectedValue(new Error('Storage error'))

    const response = await photosGET()
    const body = await jsonBody(response)

    expect(response.status).toBe(500)
    expect(body.success).toBe(false)
  })
})

describe('DELETE /api/profile/photos', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 when view is missing from the request body', async () => {
    const response = await photosDELETE(makeRequest({}))
    const body = await jsonBody(response)

    expect(response.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe('view is required')
  })

  it('returns 200 on successful deletion', async () => {
    mockDeleteUserPhoto.mockResolvedValue(undefined)

    const response = await photosDELETE(makeRequest({ view: 'front' }))
    const body = await jsonBody(response)

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(mockDeleteUserPhoto).toHaveBeenCalledWith('front')
  })

  it('returns 500 when deletion fails', async () => {
    mockDeleteUserPhoto.mockRejectedValue(new Error('Delete failed'))

    const response = await photosDELETE(makeRequest({ view: 'top' }))
    const body = await jsonBody(response)

    expect(response.status).toBe(500)
    expect(body.success).toBe(false)
  })
})
