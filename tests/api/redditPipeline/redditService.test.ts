import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock redditConfig to eliminate all sleep delays ───────────────────────────

vi.mock('@/app/api/redditPipeline/redditConfig', () => ({
  REDDIT_CONFIG: {
    baseUrl: 'https://www.reddit.com',
    userAgent: 'TestAgent/1.0',
    requestDelayMs: 0,   // no sleep in tests
    maxRetries: 2,
    retryDelayMs: 0,     // no sleep in tests
    subreddits: ['HairTransplants'],
    postsPerSubreddit: 10,
    lookbackDays: 30,
  },
}))

import { fetchSubredditPosts, fetchPostComments } from '@/app/api/redditPipeline/redditService'

// ── Helpers ───────────────────────────────────────────────────────────────────

const NOW_UTC = Math.floor(Date.now() / 1000)

function makePost(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: 'abc123',
    subreddit: 'HairTransplants',
    title: 'My hair transplant experience',
    selftext: 'Great results overall.',
    author: 'user1',
    score: 50,
    num_comments: 10,
    created_utc: NOW_UTC - 86400, // 1 day ago — within lookback
    permalink: '/r/HairTransplants/comments/abc123/my_hair_transplant_experience/',
    ...overrides,
  }
}

function makeSubredditResponse(
  posts: Record<string, unknown>[],
  afterToken: string | null = null
): Record<string, unknown> {
  return {
    data: {
      children: posts.map(p => ({ data: p })),
      after: afterToken,
    },
  }
}

// ── fetchSubredditPosts ───────────────────────────────────────────────────────

describe('fetchSubredditPosts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns posts from a single page response', async () => {
    const post = makePost({ id: 'post1', author: 'alice' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => makeSubredditResponse([post]),
    }))

    const posts = await fetchSubredditPosts('HairTransplants', { maxPosts: 10, lookbackDays: 30 })
    expect(posts).toHaveLength(1)
    expect(posts[0].id).toBe('post1')
    expect(posts[0].author).toBe('alice')
    expect(posts[0].subreddit).toBe('HairTransplants')
  })

  it('paginates using the after token', async () => {
    const page1Post = makePost({ id: 'post1' })
    const page2Post = makePost({ id: 'post2' })

    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => makeSubredditResponse([page1Post], 't3_post1'),
      })
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => makeSubredditResponse([page2Post], null),
      })
    vi.stubGlobal('fetch', mockFetch)

    const posts = await fetchSubredditPosts('HairTransplants', { maxPosts: 10, lookbackDays: 30 })
    expect(posts).toHaveLength(2)
    expect(posts.map(p => p.id)).toEqual(['post1', 'post2'])

    // Second request should include the after token
    const secondUrl = (mockFetch.mock.calls[1][0] as string)
    expect(secondUrl).toContain('after=t3_post1')
  })

  it('stops at maxPosts limit', async () => {
    const posts = Array.from({ length: 5 }, (_, i) => makePost({ id: `post${i}`, author: `user${i}` }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => makeSubredditResponse(posts, 't3_more'),
    }))

    const result = await fetchSubredditPosts('HairTransplants', { maxPosts: 3, lookbackDays: 30 })
    expect(result).toHaveLength(3)
  })

  it('stops when a post falls outside the lookback window (new sort — chronological early exit)', async () => {
    const recentPost = makePost({ id: 'recent', created_utc: NOW_UTC - 86400 })      // 1 day ago
    const oldPost = makePost({ id: 'old', created_utc: NOW_UTC - 100 * 86400 })      // 100 days ago

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => makeSubredditResponse([recentPost, oldPost], 't3_more'),
    }))

    const result = await fetchSubredditPosts('HairTransplants', { maxPosts: 10, lookbackDays: 30, sortOrder: 'new' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('recent')
  })

  it('skips old posts individually for top sort when an explicit lookbackDays is provided', async () => {
    // In normal usage top:all defaults to Infinity lookback (no cutoff).
    // But if a caller explicitly passes lookbackDays, old posts should be skipped
    // individually (continue) not cause an early exit (return) — because top is
    // ordered by score, not time, so an old post anywhere in the list should not
    // abort the entire fetch.
    const oldPost = makePost({ id: 'old', created_utc: NOW_UTC - 500 * 86400, score: 999 })   // 500 days ago, high score
    const recentPost = makePost({ id: 'recent', created_utc: NOW_UTC - 86400, score: 10 })    // 1 day ago, lower score

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => makeSubredditResponse([oldPost, recentPost]),
    }))

    // With sortOrder: 'new' this would early-exit after oldPost and return []
    // With sortOrder: 'top' it should skip oldPost and still return recentPost
    const result = await fetchSubredditPosts('HairTransplants', { maxPosts: 10, lookbackDays: 30, sortOrder: 'top' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('recent')
  })

  it('skips posts with [deleted] author', async () => {
    const deletedPost = makePost({ id: 'deleted', author: '[deleted]' })
    const normalPost = makePost({ id: 'normal', author: 'alice' })

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => makeSubredditResponse([deletedPost, normalPost]),
    }))

    const result = await fetchSubredditPosts('HairTransplants', { maxPosts: 10, lookbackDays: 30 })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('normal')
  })

  it('skips posts with no id', async () => {
    const noId = makePost({ id: '' })
    const withId = makePost({ id: 'ok', author: 'bob' })

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => makeSubredditResponse([noId, withId]),
    }))

    const result = await fetchSubredditPosts('HairTransplants', { maxPosts: 10, lookbackDays: 30 })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('ok')
  })

  it('returns empty array when API responds with no children', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({ data: { children: [], after: null } }),
    }))

    const result = await fetchSubredditPosts('HairTransplants', { maxPosts: 10, lookbackDays: 30 })
    expect(result).toHaveLength(0)
  })

  it('returns empty array when all retries fail (fetch throws)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    const result = await fetchSubredditPosts('HairTransplants', { maxPosts: 10, lookbackDays: 30 })
    expect(result).toHaveLength(0)
  })

  it('retries on non-ok HTTP response then succeeds', async () => {
    const post = makePost({ id: 'ok', author: 'alice' })
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => makeSubredditResponse([post]),
      })
    vi.stubGlobal('fetch', mockFetch)

    const result = await fetchSubredditPosts('HairTransplants', { maxPosts: 10, lookbackDays: 30 })
    expect(result).toHaveLength(1)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('returns empty array after exhausting retries on 429', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({}) }))

    const result = await fetchSubredditPosts('HairTransplants', { maxPosts: 10, lookbackDays: 30 })
    expect(result).toHaveLength(0)
  })

  it('builds the url with the right fields', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({ data: { children: [], after: null } }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await fetchSubredditPosts('HairTransplants', { maxPosts: 10, lookbackDays: 30 })

    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toContain('/r/HairTransplants/new.json')
    expect(calledUrl).toContain('limit=100')
  })

  it('maps raw Reddit fields to RawRedditPost shape', async () => {
    const rawPost = makePost({
      id: 'xyz', subreddit: 'HairTransplants', title: 'My Post',
      selftext: 'Body text', author: 'user1', score: 99,
      num_comments: 5, permalink: '/r/HairTransplants/comments/xyz/my_post/',
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => makeSubredditResponse([rawPost]),
    }))

    const result = await fetchSubredditPosts('HairTransplants', { maxPosts: 10, lookbackDays: 30 })
    expect(result[0]).toMatchObject({
      id: 'xyz',
      subreddit: 'HairTransplants',
      title: 'My Post',
      selftext: 'Body text',
      author: 'user1',
      score: 99,
      num_comments: 5,
    })
    expect(result[0].url).toContain('/r/HairTransplants/comments/xyz')
  })
})

// ── fetchPostComments ─────────────────────────────────────────────────────────

describe('fetchPostComments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function makeCommentResponse(
    comments: Record<string, unknown>[]
  ): [unknown, { data: { children: { data: unknown }[] } }] {
    return [
      { data: {} }, // post listing (first element — ignored)
      {
        data: {
          children: comments.map(c => ({ data: c })),
        },
      },
    ]
  }

  function makeComment(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
    return {
      id: 'comment1',
      subreddit: 'HairTransplants',
      body: 'This is my review.',
      author: 'reviewer1',
      score: 10,
      created_utc: NOW_UTC - 3600,
      permalink: '/r/HairTransplants/comments/abc/my_post/comment1/',
      link_title: 'My Post',
      parent_id: 't3_abc123',
      ...overrides,
    }
  }

  it('returns top-level comments', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => makeCommentResponse([makeComment({ id: 'c1', body: 'Great experience' })]),
    }))

    const comments = await fetchPostComments('HairTransplants', 'abc123', 50)
    expect(comments).toHaveLength(1)
    expect(comments[0].id).toBe('c1')
    expect(comments[0].body).toBe('Great experience')
  })

  it('filters out [deleted] authors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => makeCommentResponse([
        makeComment({ id: 'c1', author: '[deleted]', body: 'gone' }),
        makeComment({ id: 'c2', author: 'alice', body: 'real comment' }),
      ]),
    }))

    const comments = await fetchPostComments('HairTransplants', 'abc123', 50)
    expect(comments).toHaveLength(1)
    expect(comments[0].id).toBe('c2')
  })

  it('filters out "more" kind entries', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => makeCommentResponse([
        makeComment({ id: 'c1', body: 'real' }),
        { kind: 'more', id: 'more1', body: undefined, author: 'user' }, // load-more sentinel
      ]),
    }))

    const comments = await fetchPostComments('HairTransplants', 'abc123', 50)
    expect(comments).toHaveLength(1)
  })

  it('filters out comments with empty body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => makeCommentResponse([
        makeComment({ id: 'c1', body: '' }),
        makeComment({ id: 'c2', body: 'has content' }),
      ]),
    }))

    const comments = await fetchPostComments('HairTransplants', 'abc123', 50)
    expect(comments).toHaveLength(1)
    expect(comments[0].id).toBe('c2')
  })

  it('returns empty array when fetch returns non-array response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({ unexpected: 'format' }),
    }))

    const comments = await fetchPostComments('HairTransplants', 'abc123', 50)
    expect(comments).toHaveLength(0)
  })

  it('returns empty array when response array has fewer than 2 elements', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => [{ data: {} }], // only 1 element
    }))

    const comments = await fetchPostComments('HairTransplants', 'abc123', 50)
    expect(comments).toHaveLength(0)
  })

  it('returns empty array when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    const comments = await fetchPostComments('HairTransplants', 'abc123', 50)
    expect(comments).toHaveLength(0)
  })

  it('builds the correct comments URL', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => makeCommentResponse([]),
    })
    vi.stubGlobal('fetch', mockFetch)

    await fetchPostComments('HairTransplants', 'abc123', 25)
    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('/r/HairTransplants/comments/abc123.json')
    expect(url).toContain('limit=25')
    expect(url).toContain('depth=2')
  })

  it('maps comment fields to RawRedditComment shape', async () => {
    const raw = makeComment({
      id: 'cX', subreddit: 'HairTransplants', body: 'Nice post!',
      author: 'bob', score: 42, permalink: '/r/HairTransplants/comments/abc/x/cX/',
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => makeCommentResponse([raw]),
    }))

    const comments = await fetchPostComments('HairTransplants', 'abc', 50)
    expect(comments[0]).toMatchObject({
      id: 'cX',
      subreddit: 'HairTransplants',
      body: 'Nice post!',
      author: 'bob',
      score: 42,
    })
    expect(comments[0].permalink).toContain('/r/HairTransplants')
  })
})
