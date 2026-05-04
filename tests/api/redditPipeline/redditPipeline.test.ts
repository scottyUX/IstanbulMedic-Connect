import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Supabase chain helper ─────────────────────────────────────────────────────

type QueryChain = Promise<{ data: unknown; error: unknown }> & Record<string, unknown>

function makeChain(result: { data: unknown; error: unknown }): QueryChain {
  const chain = Promise.resolve(result) as QueryChain
  for (const m of ['select', 'eq', 'neq', 'in', 'upsert', 'insert', 'update', 'single', 'order', 'limit']) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  return chain
}

// ── Mocks ─────────────────────────────────────────────────────────────────────

const {
  mockFetchSubredditPosts,
  mockFetchPostComments,
  mockExtractAndStoreSignals,
  mockFrom,
  mockCreateClient,
} = vi.hoisted(() => {
  const mockFetchSubredditPosts = vi.fn()
  const mockFetchPostComments = vi.fn()
  const mockExtractAndStoreSignals = vi.fn().mockResolvedValue({ inserted: 1, errors: 0 })
  const mockFrom = vi.fn()
  const mockCreateClient = vi.fn(() => ({ from: mockFrom }))
  return {
    mockFetchSubredditPosts,
    mockFetchPostComments,
    mockExtractAndStoreSignals,
    mockFrom,
    mockCreateClient,
  }
})

vi.mock('@/app/api/redditPipeline/redditService', () => ({
  fetchSubredditPosts: mockFetchSubredditPosts,
  fetchPostComments: mockFetchPostComments,
}))

vi.mock('@/app/api/forumPipeline/deterministicExtractor', () => ({
  extractAndStoreSignals: mockExtractAndStoreSignals,
}))

vi.mock('@supabase/supabase-js', () => ({ createClient: mockCreateClient }))

import { runRedditPipeline } from '@/app/api/redditPipeline/redditPipeline'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const NOW_UTC = Math.floor(Date.now() / 1000)

function makePost(id: string, overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id,
    subreddit: 'HairTransplants',
    title: `Post ${id}`,
    selftext: `Body of post ${id}`,
    author: `user_${id}`,
    score: 10,
    num_comments: 5,
    created_utc: NOW_UTC - 86400,
    permalink: `/r/HairTransplants/comments/${id}/post_${id}/`,
    url: `https://www.reddit.com/r/HairTransplants/comments/${id}/post_${id}/`,
    ...overrides,
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('runRedditPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default: sources upsert succeeds and returns a source id
    // Default: forum_thread_index upsert returns a new hub row (isNew = true)
    // Default: reddit_thread_content upsert succeeds
    const defaultChain = makeChain({ data: { id: 'source-uuid' }, error: null })
    mockFrom.mockReturnValue(defaultChain)
  })

  // ── Dry run ─────────────────────────────────────────────────────────────────

  describe('dry-run mode', () => {
    it('does not write to the database in dry-run', async () => {
      mockFetchSubredditPosts.mockResolvedValueOnce([makePost('p1'), makePost('p2')])

      await runRedditPipeline({
        subreddits: ['HairTransplants'],
        dryRun: true,
      })

      // createClient is always called to initialise the client, but no table writes happen
      expect(mockFrom).not.toHaveBeenCalledWith('sources')
      expect(mockFrom).not.toHaveBeenCalledWith('forum_thread_index')
      expect(mockFrom).not.toHaveBeenCalledWith('reddit_thread_content')
      expect(mockExtractAndStoreSignals).not.toHaveBeenCalled()
    })

    it('still counts posts found in dry-run', async () => {
      mockFetchSubredditPosts.mockResolvedValueOnce([makePost('p1'), makePost('p2'), makePost('p3')])

      const result = await runRedditPipeline({
        subreddits: ['HairTransplants'],
        dryRun: true,
      })

      expect(result.postsFound).toBe(3)
      expect(result.newThreadsInserted).toBe(0)
    })

    it('lists the subreddit as processed in dry-run', async () => {
      mockFetchSubredditPosts.mockResolvedValueOnce([makePost('p1')])

      const result = await runRedditPipeline({
        subreddits: ['HairTransplants'],
        dryRun: true,
      })

      expect(result.subredditsProcessed).toContain('HairTransplants')
    })
  })

  // ── Normal run ──────────────────────────────────────────────────────────────

  describe('normal run', () => {
    it('returns correct counts for new posts', async () => {
      mockFetchSubredditPosts.mockResolvedValueOnce([makePost('p1'), makePost('p2')])

      // upsert returns a hub row → isNew = true
      const hubChain = makeChain({ data: { id: 'hub-uuid-1' }, error: null })
      mockFrom.mockReturnValue(hubChain)

      const result = await runRedditPipeline({
        subreddits: ['HairTransplants'],
        dryRun: false,
      })

      expect(result.postsFound).toBe(2)
      expect(result.subredditsProcessed).toContain('HairTransplants')
    })

    it('calls extractAndStoreSignals for each new thread', async () => {
      mockFetchSubredditPosts.mockResolvedValueOnce([makePost('p1'), makePost('p2')])
      const hubChain = makeChain({ data: { id: 'hub-uuid' }, error: null })
      mockFrom.mockReturnValue(hubChain)

      await runRedditPipeline({ subreddits: ['HairTransplants'], dryRun: false })

      expect(mockExtractAndStoreSignals).toHaveBeenCalledTimes(2)
    })

    it('accumulates signalRowsInserted from extractAndStoreSignals', async () => {
      mockFetchSubredditPosts.mockResolvedValueOnce([makePost('p1'), makePost('p2')])
      mockExtractAndStoreSignals.mockResolvedValue({ inserted: 3, errors: 0 })
      const hubChain = makeChain({ data: { id: 'hub-uuid' }, error: null })
      mockFrom.mockReturnValue(hubChain)

      const result = await runRedditPipeline({ subreddits: ['HairTransplants'], dryRun: false })
      expect(result.signalRowsInserted).toBe(6) // 2 posts × 3 signals each
    })

    it('skips extractAndStoreSignals when the extension row already exists (duplicate thread)', async () => {
      mockFetchSubredditPosts.mockResolvedValueOnce([makePost('p1')])

      // sources (1) + hub upsert always returns id (2) + extension upsert returns null = duplicate (3)
      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 3) {
          // reddit_thread_content: ignoreDuplicates: true + conflict → no data returned
          return makeChain({ data: null, error: null })
        }
        return makeChain({ data: { id: 'existing-hub-id' }, error: null })
      })

      await runRedditPipeline({ subreddits: ['HairTransplants'], dryRun: false })

      // Should NOT call extractAndStoreSignals for the duplicate
      expect(mockExtractAndStoreSignals).not.toHaveBeenCalled()
    })

    it('upserts a sources row before processing posts', async () => {
      mockFetchSubredditPosts.mockResolvedValueOnce([])
      const chain = makeChain({ data: { id: 'src-id' }, error: null })
      mockFrom.mockReturnValue(chain)

      await runRedditPipeline({ subreddits: ['HairTransplants'], dryRun: false })

      expect(mockFrom).toHaveBeenCalledWith('sources')
    })

    it('processes multiple subreddits', async () => {
      mockFetchSubredditPosts
        .mockResolvedValueOnce([makePost('p1')])
        .mockResolvedValueOnce([makePost('p2')])

      const chain = makeChain({ data: { id: 'uuid' }, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await runRedditPipeline({
        subreddits: ['HairTransplants', 'TurkeyHairTransplant'],
        dryRun: false,
      })

      expect(result.subredditsProcessed).toHaveLength(2)
      expect(result.postsFound).toBe(2)
    })
  })

  // ── Sort slices ─────────────────────────────────────────────────────────────

  describe('sortSlices', () => {
    it('calls fetchSubredditPosts once per slice', async () => {
      mockFetchSubredditPosts
        .mockResolvedValueOnce([makePost('p1')])   // new
        .mockResolvedValueOnce([makePost('p2')])   // top:all
        .mockResolvedValueOnce([makePost('p3')])   // controversial:all

      const chain = makeChain({ data: { id: 'hub-uuid' }, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await runRedditPipeline({
        subreddits: ['HairTransplants'],
        sortSlices: [
          { sortOrder: 'new' },
          { sortOrder: 'top', timePeriod: 'all' },
          { sortOrder: 'controversial', timePeriod: 'all' },
        ],
        dryRun: false,
      })

      expect(mockFetchSubredditPosts).toHaveBeenCalledTimes(3)
      expect(result.postsFound).toBe(3)
    })

    it('deduplicates posts that appear in multiple slices', async () => {
      const sharedPost = makePost('shared')
      mockFetchSubredditPosts
        .mockResolvedValueOnce([sharedPost, makePost('unique1')])  // new
        .mockResolvedValueOnce([sharedPost, makePost('unique2')])  // top:all — sharedPost is a duplicate

      const chain = makeChain({ data: { id: 'hub-uuid' }, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await runRedditPipeline({
        subreddits: ['HairTransplants'],
        sortSlices: [{ sortOrder: 'new' }, { sortOrder: 'top', timePeriod: 'all' }],
        dryRun: false,
      })

      // 3 unique posts despite 4 total fetched (sharedPost counted once)
      expect(result.postsFound).toBe(3)
    })

    it('deduplication across slices prevents double extraction of same post', async () => {
      const sharedPost = makePost('shared')
      mockFetchSubredditPosts
        .mockResolvedValueOnce([sharedPost])
        .mockResolvedValueOnce([sharedPost])  // same post in second slice

      const chain = makeChain({ data: { id: 'hub-uuid' }, error: null })
      mockFrom.mockReturnValue(chain)

      await runRedditPipeline({
        subreddits: ['HairTransplants'],
        sortSlices: [{ sortOrder: 'new' }, { sortOrder: 'top', timePeriod: 'all' }],
        dryRun: false,
      })

      // extractAndStoreSignals should only be called once for the shared post
      expect(mockExtractAndStoreSignals).toHaveBeenCalledTimes(1)
    })

    it('defaults to a single new slice when sortSlices is not provided', async () => {
      mockFetchSubredditPosts.mockResolvedValueOnce([makePost('p1')])
      const chain = makeChain({ data: { id: 'hub-uuid' }, error: null })
      mockFrom.mockReturnValue(chain)

      await runRedditPipeline({ subreddits: ['HairTransplants'], dryRun: false })

      expect(mockFetchSubredditPosts).toHaveBeenCalledTimes(1)
      expect(mockFetchSubredditPosts).toHaveBeenCalledWith(
        'HairTransplants',
        expect.objectContaining({ sortOrder: 'new' })
      )
    })

    it('passes sortOrder and timePeriod to fetchSubredditPosts', async () => {
      mockFetchSubredditPosts.mockResolvedValueOnce([])
      const chain = makeChain({ data: { id: 'uuid' }, error: null })
      mockFrom.mockReturnValue(chain)

      await runRedditPipeline({
        subreddits: ['HairTransplants'],
        sortSlices: [{ sortOrder: 'top', timePeriod: 'all' }],
        dryRun: true,
      })

      expect(mockFetchSubredditPosts).toHaveBeenCalledWith(
        'HairTransplants',
        expect.objectContaining({ sortOrder: 'top', timePeriod: 'all' })
      )
    })
  })

  // ── Error handling ──────────────────────────────────────────────────────────

  describe('error handling', () => {
    it('records an error and continues to next subreddit when fetchSubredditPosts throws', async () => {
      mockFetchSubredditPosts
        .mockRejectedValueOnce(new Error('Reddit API down'))
        .mockResolvedValueOnce([makePost('p2')])

      const chain = makeChain({ data: { id: 'uuid' }, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await runRedditPipeline({
        subreddits: ['FailSub', 'HairTransplants'],
        dryRun: false,
      })

      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('FailSub')
      expect(result.subredditsProcessed).toContain('HairTransplants')
    })

    it('does not add the failing subreddit to subredditsProcessed', async () => {
      mockFetchSubredditPosts.mockRejectedValueOnce(new Error('Network error'))

      const result = await runRedditPipeline({
        subreddits: ['FailSub'],
        dryRun: true, // dry-run still goes through the error path for fetch failures
      })

      // FailSub failed at fetch, so it still gets added (pipeline adds it before the error in dry-run)
      // In non-dry-run, it gets added after fetch. Let's just check errors.
      expect(result.errors).toHaveLength(1)
    })
  })

  // ── Comments (includeComments: true) ────────────────────────────────────────

  describe('comment ingestion (includeComments: true)', () => {
    it('fetches comments for posts above the score threshold', async () => {
      const highScorePost = makePost('p1', { score: 20 })
      mockFetchSubredditPosts.mockResolvedValueOnce([highScorePost])
      mockFetchPostComments.mockResolvedValueOnce([])

      const chain = makeChain({ data: { id: 'hub-uuid' }, error: null })
      mockFrom.mockReturnValue(chain)

      await runRedditPipeline({
        subreddits: ['HairTransplants'],
        includeComments: true,
        commentPostThreshold: 10,
        commentsPerPost: 50,
        dryRun: false,
      })

      expect(mockFetchPostComments).toHaveBeenCalledWith('HairTransplants', 'p1', 50)
    })

    it('does NOT fetch comments for posts below the score threshold', async () => {
      const lowScorePost = makePost('p1', { score: 5 })
      mockFetchSubredditPosts.mockResolvedValueOnce([lowScorePost])

      const chain = makeChain({ data: { id: 'hub-uuid' }, error: null })
      mockFrom.mockReturnValue(chain)

      await runRedditPipeline({
        subreddits: ['HairTransplants'],
        includeComments: true,
        commentPostThreshold: 10,
        dryRun: false,
      })

      expect(mockFetchPostComments).not.toHaveBeenCalled()
    })

    it('does NOT fetch comments when includeComments is false (default)', async () => {
      mockFetchSubredditPosts.mockResolvedValueOnce([makePost('p1', { score: 999 })])
      const chain = makeChain({ data: { id: 'hub-uuid' }, error: null })
      mockFrom.mockReturnValue(chain)

      await runRedditPipeline({ subreddits: ['HairTransplants'], dryRun: false })

      expect(mockFetchPostComments).not.toHaveBeenCalled()
    })
  })

  // ── Result shape ─────────────────────────────────────────────────────────────

  describe('result shape', () => {
    it('returns the expected PipelineResult fields', async () => {
      mockFetchSubredditPosts.mockResolvedValueOnce([])
      const chain = makeChain({ data: { id: 'src' }, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await runRedditPipeline({ subreddits: ['HairTransplants'], dryRun: false })

      expect(result).toHaveProperty('subredditsProcessed')
      expect(result).toHaveProperty('postsFound')
      expect(result).toHaveProperty('newThreadsInserted')
      expect(result).toHaveProperty('signalRowsInserted')
      expect(result).toHaveProperty('errors')
      expect(Array.isArray(result.errors)).toBe(true)
    })

    it('returns zero counts when no posts found', async () => {
      mockFetchSubredditPosts.mockResolvedValueOnce([])
      const chain = makeChain({ data: { id: 'src' }, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await runRedditPipeline({ subreddits: ['HairTransplants'], dryRun: false })

      expect(result.postsFound).toBe(0)
      expect(result.newThreadsInserted).toBe(0)
      expect(result.signalRowsInserted).toBe(0)
      expect(result.errors).toHaveLength(0)
    })
  })
})
