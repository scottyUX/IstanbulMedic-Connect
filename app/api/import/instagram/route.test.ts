// app/api/import/instagram/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

// ── Supabase mock ─────────────────────────────────────────────────────────────
// vi.mock is hoisted before variable declarations, so mocks must be defined
// inside the factory. We retrieve references via vi.mocked() after the fact.

vi.mock('@supabase/supabase-js', () => {
  const mockUpsert = vi.fn()
  const mockInsert = vi.fn()
  const mockUpdate = vi.fn()
  const mockSelect = vi.fn()
  const mockEq     = vi.fn()
  const mockRpc    = vi.fn()

  return {
    createClient: () => ({
      from: vi.fn().mockReturnValue({
        upsert: mockUpsert,
        insert: mockInsert,
        update: mockUpdate,
        select: mockSelect,
        eq:     mockEq,
      }),
      rpc: mockRpc,
    }),
  }
})

// Pull live references to the mocks after the module has been set up
import { createClient } from '@supabase/supabase-js'

const _client    = (createClient as any)()
const mockUpsert = _client.from().upsert  as ReturnType<typeof vi.fn>
const mockInsert = _client.from().insert  as ReturnType<typeof vi.fn>
const mockUpdate = _client.from().update  as ReturnType<typeof vi.fn>
const mockSelect = _client.from().select  as ReturnType<typeof vi.fn>
const mockEq     = _client.from().eq      as ReturnType<typeof vi.fn>
const mockRpc    = _client.rpc            as ReturnType<typeof vi.fn>

// ── Fixtures ──────────────────────────────────────────────────────────────────

const minimalInstagramData = {
  instagram: {
    inputUrl: 'https://www.instagram.com/istanbulmedic',
    id: '7770751797',
    username: 'istanbulmedic',
    fullName: 'IstanbulMedic',
    biography: 'IstanbulMedic is accredited medical travel expert in Turkey.',
    externalUrls: ['https://linktr.ee/istanbulmedic'],
    followersCount: 2140,
    postsCount: 100,
    verified: false,
    isBusinessAccount: true,
    businessCategoryName: 'None,Medical & health',
  },
  extracted_claims: {
    identity:    { display_name_variants: ['IstanbulMedic'] },
    social:      { instagram: { handle: 'istanbulmedic', followers_count: 2140, follows_count: 77, posts_count: 100, highlights_count: 9, is_private: false, is_business: true, business_category: 'None,Medical & health' } },
    contact:     { website_candidates: ['https://linktr.ee/istanbulmedic'], link_aggregator_detected: 'linktr.ee', address_text: 'Caferağa Mahallesi, Moda Caddesi No: 72 Daire:5, Kadıköy' },
    services:    { claimed: ['medical travel'] },
    positioning: { claims: ['accredited'] },
    languages:   { claimed: [] },
    geography:   { claimed: ['Kadıköy'] },
  },
  posts: [],
}

const samplePost = {
  id: '3779405083595773058',
  type: 'Image',
  shortCode: 'DRzJOY-CBSC',
  url: 'https://www.instagram.com/p/DRzJOY-CBSC/',
  caption: 'A natural, confident transformation. #istanbulmedic #medicaltravel #hairtransplant',
  hashtags: ['istanbulmedic', 'medicaltravel', 'hairtransplant'],
  mentions: [],
  likesCount: 10,
  commentsCount: 2,
  firstComment: 'Great results!',
  latestComments: [
    {
      id: 'c1',
      text: 'Great results!',
      ownerUsername: 'user1',
      ownerProfilePicUrl: 'https://example.com/pic.jpg',
      timestamp: '2025-12-04T10:00:00.000Z',
      likesCount: 1,
      repliesCount: 0,
      replies: [],
    },
  ],
  timestamp: '2025-12-03T11:10:16.000Z',
  displayUrl: 'https://example.com/img.jpg',
}

const fullInstagramData = {
  ...minimalInstagramData,
  posts: [samplePost],
}

// Successful Supabase response helpers
const successSource   = { id: 'src-1', source_type: 'social_media' }
const successDocument = { id: 'doc-1', source_id: 'src-1' }
const successSocial   = { id: 'sm-1',  clinic_id: 'clinic-123' }
const successFacts    = [{ id: 'f-1', fact_key: 'instagram_followers_count' }]
const successEvidence = [{ id: 'ev-1' }]
const successPosts    = [{ id: 'p-1' }]

function mockSupabaseSuccess(clinicHasWebsite = false) {
  // sources upsert
  mockUpsert.mockReturnValueOnce({ select: () => ({ single: () => Promise.resolve({ data: successSource, error: null }) }) })
  // source_documents insert
  mockInsert.mockReturnValueOnce({ select: () => ({ single: () => Promise.resolve({ data: successDocument, error: null }) }) })
  // clinic_social_media upsert
  mockUpsert.mockReturnValueOnce({ select: () => ({ single: () => Promise.resolve({ data: successSocial, error: null }) }) })
  // clinic_instagram_posts upsert
  mockUpsert.mockReturnValueOnce({ select: () => Promise.resolve({ data: successPosts, error: null }) })
  // rpc upsert_clinic_facts
  mockRpc.mockResolvedValueOnce({ data: successFacts, error: null })
  // fact_evidence insert
  mockInsert.mockReturnValueOnce({ select: () => Promise.resolve({ data: successEvidence, error: null }) })
  // clinics select (to check existing website)
  mockSelect.mockReturnValueOnce({ eq: () => ({ single: () => Promise.resolve({ data: { website_url: clinicHasWebsite ? 'https://existing.com' : null }, error: null }) }) })
  // clinics update (only called when no existing website)
  if (!clinicHasWebsite) {
    mockUpdate.mockReturnValueOnce({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: { id: 'clinic-123', website_url: 'https://linktr.ee/istanbulmedic' }, error: null }) }) }) })
  }
}

function makeRequest(body: object) {
  return new Request('http://localhost/api/import/instagram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/import/instagram', () => {

  beforeEach(() => {
    // mockReset clears both call history AND mockReturnValueOnce queues,
    // preventing unconsumed mock values from leaking between tests.
    // (vi.clearAllMocks only clears call history, not the once-queues.)
    mockUpsert.mockReset()
    mockInsert.mockReset()
    mockUpdate.mockReset()
    mockSelect.mockReset()
    mockEq.mockReset()
    mockRpc.mockReset()
  })

  // ── Validation ─────────────────────────────────────────────────────────────

  describe('request validation', () => {
    it('returns 400 when body is empty', async () => {
      const res = await POST(makeRequest({}))
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toMatch(/missing required fields/i)
    })

    it('returns 400 when clinicId is missing', async () => {
      const res = await POST(makeRequest({ instagramData: minimalInstagramData }))
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toMatch(/missing required fields/i)
    })

    it('returns 400 when instagramData is missing', async () => {
      const res = await POST(makeRequest({ clinicId: 'clinic-123' }))
      expect(res.status).toBe(400)
    })

    it('returns 400 when both fields are missing', async () => {
      const res = await POST(makeRequest({ unrelated: 'data' }))
      expect(res.status).toBe(400)
    })
  })

  // ── Happy path ─────────────────────────────────────────────────────────────

  describe('successful import', () => {
    it('returns 200 with success flag and summary', async () => {
      mockSupabaseSuccess()
      const res = await POST(makeRequest({ clinicId: 'clinic-123', instagramData: fullInstagramData }))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.summary).toBeDefined()
    })

    it('reports correct summary counts', async () => {
      mockSupabaseSuccess()
      const res = await POST(makeRequest({ clinicId: 'clinic-123', instagramData: fullInstagramData }))
      const { summary } = await res.json()
      expect(summary.sourceCreated).toBe(true)
      expect(summary.documentCreated).toBe(true)
      expect(summary.socialMediaUpdated).toBe(true)
      expect(summary.postsUpserted).toBe(1)
      expect(summary.factsCreated).toBeGreaterThan(0)
      expect(summary.evidenceLinked).toBeGreaterThan(0)
    })

    it('reports postFactsCreated > 0 when posts are present', async () => {
      mockSupabaseSuccess()
      const res = await POST(makeRequest({ clinicId: 'clinic-123', instagramData: fullInstagramData }))
      const { summary } = await res.json()
      expect(summary.postFactsCreated).toBeGreaterThan(0)
    })

    it('reports 0 postsUpserted when no posts provided', async () => {
      mockSupabaseSuccess()
      const res = await POST(makeRequest({ clinicId: 'clinic-123', instagramData: minimalInstagramData }))
      const { summary } = await res.json()
      expect(summary.postsUpserted).toBe(0)
    })

    it('updates clinic website_url when clinic has no existing website', async () => {
      mockSupabaseSuccess(false) // clinicHasWebsite = false
      const res = await POST(makeRequest({ clinicId: 'clinic-123', instagramData: fullInstagramData }))
      const json = await res.json()
      expect(json.results.clinicUpdated).toBeDefined()
    })

    it('does NOT update clinic website_url when one already exists', async () => {
      mockSupabaseSuccess(true) // clinicHasWebsite = true
      const res = await POST(makeRequest({ clinicId: 'clinic-123', instagramData: fullInstagramData }))
      const json = await res.json()
      expect(json.results.clinicUpdated).toBeUndefined()
    })
  })

  // ── Fact generation ────────────────────────────────────────────────────────

  describe('fact generation', () => {
    it('calls rpc with facts containing instagram_followers_count', async () => {
      mockSupabaseSuccess()
      await POST(makeRequest({ clinicId: 'clinic-123', instagramData: fullInstagramData }))
      const [, factsArg] = mockRpc.mock.calls[0]
      const facts: any[] = factsArg.facts_data
      expect(facts.some(f => f.fact_key === 'instagram_followers_count' && f.fact_value === 2140)).toBe(true)
    })

    it('includes instagram_verified fact', async () => {
      mockSupabaseSuccess()
      await POST(makeRequest({ clinicId: 'clinic-123', instagramData: fullInstagramData }))
      const [, { facts_data }] = mockRpc.mock.calls[0]
      expect(facts_data.some((f: any) => f.fact_key === 'instagram_verified' && f.fact_value === false)).toBe(true)
    })

    it('includes address_from_instagram when address present', async () => {
      mockSupabaseSuccess()
      await POST(makeRequest({ clinicId: 'clinic-123', instagramData: fullInstagramData }))
      const [, { facts_data }] = mockRpc.mock.calls[0]
      expect(facts_data.some((f: any) => f.fact_key === 'address_from_instagram')).toBe(true)
    })

    it('includes instagram_positioning_claims', async () => {
      mockSupabaseSuccess()
      await POST(makeRequest({ clinicId: 'clinic-123', instagramData: fullInstagramData }))
      const [, { facts_data }] = mockRpc.mock.calls[0]
      const claim = facts_data.find((f: any) => f.fact_key === 'instagram_positioning_claims')
      expect(claim).toBeDefined()
      expect(JSON.parse(claim.fact_value)).toContain('accredited')
    })

    it('includes instagram_inferred_services derived from hashtags', async () => {
      mockSupabaseSuccess()
      await POST(makeRequest({ clinicId: 'clinic-123', instagramData: fullInstagramData }))
      const [, { facts_data }] = mockRpc.mock.calls[0]
      const svc = facts_data.find((f: any) => f.fact_key === 'instagram_inferred_services')
      expect(svc).toBeDefined()
      const parsed = JSON.parse(svc.fact_value)
      expect(parsed).toContain('hair_transplant')
    })

    it('omits post-derived facts when posts array is empty', async () => {
      mockSupabaseSuccess()
      await POST(makeRequest({ clinicId: 'clinic-123', instagramData: minimalInstagramData }))
      const [, { facts_data }] = mockRpc.mock.calls[0]
      const postDerived = ['instagram_avg_likes_per_post', 'instagram_top_hashtags', 'instagram_inferred_services']
      postDerived.forEach(key => {
        expect(facts_data.some((f: any) => f.fact_key === key)).toBe(false)
      })
    })

    it('all facts have clinic_id, confidence, computed_by fields', async () => {
      mockSupabaseSuccess()
      await POST(makeRequest({ clinicId: 'clinic-123', instagramData: fullInstagramData }))
      const [, { facts_data }] = mockRpc.mock.calls[0]
      for (const fact of facts_data) {
        expect(fact.clinic_id).toBe('clinic-123')
        expect(typeof fact.confidence).toBe('number')
        expect(fact.computed_by).toBe('extractor')
      }
    })
  })

  // ── Comment handling ───────────────────────────────────────────────────────

  describe('comment sanitisation', () => {
    it('strips ownerProfilePicUrl from stored comments', async () => {
      mockSupabaseSuccess()
      await POST(makeRequest({ clinicId: 'clinic-123', instagramData: fullInstagramData }))
      // The post upsert is the third mockUpsert call (sources=0, social_media=1, posts=2)
      const postRows = mockUpsert.mock.calls[2][0]
      const stored = postRows[0].comments_data[0]
      expect(stored.ownerProfilePicUrl).toBeUndefined()
    })

    it('preserves text, ownerUsername, timestamp, likesCount in stored comments', async () => {
      mockSupabaseSuccess()
      await POST(makeRequest({ clinicId: 'clinic-123', instagramData: fullInstagramData }))
      const postRows = mockUpsert.mock.calls[2][0]
      const stored = postRows[0].comments_data[0]
      expect(stored.text).toBe('Great results!')
      expect(stored.ownerUsername).toBe('user1')
      expect(stored.timestamp).toBeDefined()
      expect(stored.likesCount).toBe(1)
    })

    it('stores empty comments_data array when latestComments is empty', async () => {
      const dataWithNoComments = {
        ...fullInstagramData,
        posts: [{ ...samplePost, latestComments: [], commentsCount: 0, firstComment: '' }],
      }
      mockSupabaseSuccess()
      await POST(makeRequest({ clinicId: 'clinic-123', instagramData: dataWithNoComments }))
      const postRows = mockUpsert.mock.calls[2][0]
      expect(postRows[0].comments_data).toEqual([])
    })

    it('stores empty comments_data array when latestComments is undefined', async () => {
      const dataUndefinedComments = {
        ...fullInstagramData,
        posts: [{ ...samplePost, latestComments: undefined, commentsCount: 0 }],
      }
      mockSupabaseSuccess()
      await POST(makeRequest({ clinicId: 'clinic-123', instagramData: dataUndefinedComments }))
      const postRows = mockUpsert.mock.calls[2][0]
      expect(postRows[0].comments_data).toEqual([])
    })

    it('stores empty comments_data array when latestComments is null', async () => {
      const dataWithNullComments = {
        ...fullInstagramData,
        posts: [{ ...samplePost, latestComments: null, commentsCount: 0 }],
      }
      mockSupabaseSuccess()
      await POST(makeRequest({ clinicId: 'clinic-123', instagramData: dataWithNullComments }))
      const postRows = mockUpsert.mock.calls[2][0]
      expect(postRows[0].comments_data).toEqual([])
    })

    it('stores null first_comment_text when firstComment is empty', async () => {
      const dataWithNoFirst = {
        ...fullInstagramData,
        posts: [{ ...samplePost, firstComment: '' }],
      }
      mockSupabaseSuccess()
      await POST(makeRequest({ clinicId: 'clinic-123', instagramData: dataWithNoFirst }))
      const postRows = mockUpsert.mock.calls[2][0]
      expect(postRows[0].first_comment_text).toBeNull()
    })

    it('stores null first_comment_text when firstComment is whitespace only', async () => {
      const dataWithWhitespace = {
        ...fullInstagramData,
        posts: [{ ...samplePost, firstComment: '   ' }],
      }
      mockSupabaseSuccess()
      await POST(makeRequest({ clinicId: 'clinic-123', instagramData: dataWithWhitespace }))
      const postRows = mockUpsert.mock.calls[2][0]
      expect(postRows[0].first_comment_text).toBeNull()
    })

    it('handles a mix of posts with and without comments', async () => {
      const mixedPosts = {
        ...fullInstagramData,
        posts: [
          { ...samplePost, id: 'p1', latestComments: [samplePost.latestComments[0]], commentsCount: 1 },
          { ...samplePost, id: 'p2', latestComments: [], commentsCount: 0, firstComment: '' },
          { ...samplePost, id: 'p3', latestComments: undefined, commentsCount: 0 },
        ],
      }
      mockSupabaseSuccess()
      await POST(makeRequest({ clinicId: 'clinic-123', instagramData: mixedPosts }))
      const postRows = mockUpsert.mock.calls[2][0]
      expect(postRows[0].comments_data).toHaveLength(1)
      expect(postRows[1].comments_data).toEqual([])
      expect(postRows[2].comments_data).toEqual([])
    })

    it('excludes posts without comments from instagram_top_commented_posts_sample fact', async () => {
      const mixedPosts = {
        ...fullInstagramData,
        posts: [
          { ...samplePost, id: 'p1', url: 'https://www.instagram.com/p/p1/', latestComments: [samplePost.latestComments[0]], commentsCount: 5 },
          { ...samplePost, id: 'p2', url: 'https://www.instagram.com/p/p2/', latestComments: [], commentsCount: 0 },
          { ...samplePost, id: 'p3', url: 'https://www.instagram.com/p/p3/', latestComments: undefined, commentsCount: 0 },
        ],
      }
      mockSupabaseSuccess()
      await POST(makeRequest({ clinicId: 'clinic-123', instagramData: mixedPosts }))
      const [, { facts_data }] = mockRpc.mock.calls[0]
      const sampleFact = facts_data.find((f: any) => f.fact_key === 'instagram_top_commented_posts_sample')
      const parsed = JSON.parse(sampleFact.fact_value)
      expect(parsed).toHaveLength(1)
      expect(parsed[0].postUrl).toContain('p1')
    })

    it('omits instagram_top_commented_posts_sample fact when no posts have comments', async () => {
      const noCommentPosts = {
        ...fullInstagramData,
        posts: [
          { ...samplePost, id: 'p1', latestComments: [], commentsCount: 0 },
          { ...samplePost, id: 'p2', latestComments: undefined, commentsCount: 0 },
        ],
      }
      mockSupabaseSuccess()
      await POST(makeRequest({ clinicId: 'clinic-123', instagramData: noCommentPosts }))
      const [, { facts_data }] = mockRpc.mock.calls[0]
      const sampleFact = facts_data.find((f: any) => f.fact_key === 'instagram_top_commented_posts_sample')
      expect(sampleFact).toBeUndefined()
    })
  })

  // ── Post upsert shape ──────────────────────────────────────────────────────

  describe('post upsert payload', () => {
    it('normalises hashtags to lowercase', async () => {
      const dataWithUpperTags = {
        ...fullInstagramData,
        posts: [{ ...samplePost, hashtags: ['IstanbulMedic', 'MedicalTravel'] }],
      }
      mockSupabaseSuccess()
      await POST(makeRequest({ clinicId: 'clinic-123', instagramData: dataWithUpperTags }))
      const postRows = mockUpsert.mock.calls[2][0]
      expect(postRows[0].hashtags).toEqual(['istanbulmedic', 'medicaltravel'])
    })

    it('maps post fields correctly', async () => {
      mockSupabaseSuccess()
      await POST(makeRequest({ clinicId: 'clinic-123', instagramData: fullInstagramData }))
      const postRows = mockUpsert.mock.calls[2][0]
      const row = postRows[0]
      expect(row.clinic_id).toBe('clinic-123')
      expect(row.source_id).toBe('src-1')
      expect(row.instagram_post_id).toBe(samplePost.id)
      expect(row.short_code).toBe(samplePost.shortCode)
      expect(row.post_type).toBe('Image')
      expect(row.likes_count).toBe(10)
      expect(row.comments_count).toBe(2)
    })
  })

  // ── Error handling ─────────────────────────────────────────────────────────

  describe('error handling', () => {
    it('returns 500 when sources upsert fails', async () => {
      mockUpsert.mockReturnValueOnce({
        select: () => ({ single: () => Promise.resolve({ data: null, error: new Error('DB error') }) }),
      })
      const res = await POST(makeRequest({ clinicId: 'clinic-123', instagramData: fullInstagramData }))
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBeDefined()
    })

    it('returns 500 when source_documents insert fails', async () => {
      mockUpsert.mockReturnValueOnce({ select: () => ({ single: () => Promise.resolve({ data: successSource, error: null }) }) })
      mockInsert.mockReturnValueOnce({ select: () => ({ single: () => Promise.resolve({ data: null, error: new Error('doc error') }) }) })
      const res = await POST(makeRequest({ clinicId: 'clinic-123', instagramData: fullInstagramData }))
      expect(res.status).toBe(500)
    })

    it('returns 500 when rpc upsert_clinic_facts fails', async () => {
      // sources
      mockUpsert.mockReturnValueOnce({ select: () => ({ single: () => Promise.resolve({ data: successSource, error: null }) }) })
      // documents
      mockInsert.mockReturnValueOnce({ select: () => ({ single: () => Promise.resolve({ data: successDocument, error: null }) }) })
      // social_media
      mockUpsert.mockReturnValueOnce({ select: () => ({ single: () => Promise.resolve({ data: successSocial, error: null }) }) })
      // posts
      mockUpsert.mockReturnValueOnce({ select: () => Promise.resolve({ data: successPosts, error: null }) })
      // rpc FAILS
      mockRpc.mockResolvedValueOnce({ data: null, error: new Error('rpc error') })

      const res = await POST(makeRequest({ clinicId: 'clinic-123', instagramData: fullInstagramData }))
      expect(res.status).toBe(500)
    })

    it('returns 500 and includes error message in body', async () => {
      mockUpsert.mockReturnValueOnce({
        select: () => ({ single: () => Promise.resolve({ data: null, error: new Error('connection refused') }) }),
      })
      const res = await POST(makeRequest({ clinicId: 'clinic-123', instagramData: fullInstagramData }))
      const json = await res.json()
      expect(json.error).toBe('connection refused')
    })

    it('returns 500 when request body is unparseable JSON', async () => {
      const req = new Request('http://localhost/api/import/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid json',
      })
      const res = await POST(req)
      expect(res.status).toBe(500)
    })
  })

  // ── Edge cases ─────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles instagramData with no externalUrls gracefully', async () => {
      const dataNoUrls = {
        ...fullInstagramData,
        instagram: { ...fullInstagramData.instagram, externalUrls: [] },
      }
      mockSupabaseSuccess()
      // Override clinic select – should NOT be called when no externalUrls
      const res = await POST(makeRequest({ clinicId: 'clinic-123', instagramData: dataNoUrls }))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.results.clinicUpdated).toBeUndefined()
    })

    it('handles missing optional extracted_claims fields', async () => {
      const sparseData = {
        ...fullInstagramData,
        extracted_claims: {
          social: { instagram: {} },
        },
      }
      mockSupabaseSuccess()
      const res = await POST(makeRequest({ clinicId: 'clinic-123', instagramData: sparseData }))
      expect(res.status).toBe(200)
    })

    it('handles posts with no hashtags', async () => {
      const dataNoTags = {
        ...fullInstagramData,
        posts: [{ ...samplePost, hashtags: [] }],
      }
      mockSupabaseSuccess()
      const res = await POST(makeRequest({ clinicId: 'clinic-123', instagramData: dataNoTags }))
      expect(res.status).toBe(200)
    })

    it('handles post with zero likes and comments', async () => {
      const zeroPost = { ...samplePost, likesCount: 0, commentsCount: 0 }
      mockSupabaseSuccess()
      await POST(makeRequest({ clinicId: 'clinic-123', instagramData: { ...fullInstagramData, posts: [zeroPost] } }))
      const postRows = mockUpsert.mock.calls[2][0]
      expect(postRows[0].likes_count).toBe(0)
      expect(postRows[0].comments_count).toBe(0)
    })

    it('correctly calculates avg likes across multiple posts', async () => {
      const multiPost = {
        ...fullInstagramData,
        posts: [
          { ...samplePost, id: 'p1', likesCount: 10 },
          { ...samplePost, id: 'p2', likesCount: 20 },
          { ...samplePost, id: 'p3', likesCount: 30 },
        ],
      }
      mockSupabaseSuccess()
      await POST(makeRequest({ clinicId: 'clinic-123', instagramData: multiPost }))
      const [, { facts_data }] = mockRpc.mock.calls[0]
      const avgFact = facts_data.find((f: any) => f.fact_key === 'instagram_avg_likes_per_post')
      expect(avgFact.fact_value).toBe(20) // (10+20+30)/3
    })
  })
})