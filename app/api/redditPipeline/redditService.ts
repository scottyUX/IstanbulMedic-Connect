/**
 * Reddit HTTP service — scrapes subreddit posts and comments via the public JSON API.
 * Ports reddit-auto/src/services/reddit_collector.py with TypeScript-native patterns.
 *
 * Key ported utilities:
 *   _make_request()        → makeRedditRequest()   (rate limiting + exponential backoff + 429)
 *   get_subreddit_users()  → fetchSubredditPosts()  (after-token pagination + lookback cutoff)
 *   get_user_comments()    → fetchPostComments()    (comment thread fetch)
 */

import { REDDIT_CONFIG, type RawRedditPost, type RawRedditComment, type FetchPostsOptions } from './redditConfig'

// ── Helpers ───────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

const FETCH_TIMEOUT_MS = 15_000

// ── Core request function ─────────────────────────────────────────────────────

/**
 * Makes a single request to the Reddit JSON API with rate limiting and exponential backoff.
 * Direct port of reddit_collector.py _make_request().
 */
async function makeRedditRequest(url: string): Promise<unknown | null> {
  const { requestDelayMs, maxRetries, retryDelayMs, userAgent } = REDDIT_CONFIG

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Rate limiting — wait before every request (same as reddit-auto time.sleep)
    await sleep(requestDelayMs)

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': userAgent },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      })

      // Handle rate limiting: exponential backoff (port of python 429 handler)
      if (res.status === 429) {
        const waitMs = retryDelayMs * Math.pow(2, attempt)
        console.warn(`[reddit] Rate limited. Waiting ${waitMs}ms (attempt ${attempt + 1})`)
        await sleep(waitMs)
        continue
      }

      if (!res.ok) {
        console.warn(`[reddit] HTTP ${res.status} for ${url} (attempt ${attempt + 1})`)
        if (attempt < maxRetries - 1) await sleep(retryDelayMs * (attempt + 1))
        continue
      }

      return await res.json()

    } catch (err) {
      console.warn(`[reddit] Request failed (attempt ${attempt + 1}):`, err instanceof Error ? err.message : err)
      if (attempt < maxRetries - 1) await sleep(retryDelayMs * (attempt + 1))
    }
  }

  console.error(`[reddit] Failed to fetch ${url} after ${maxRetries} attempts`)
  return null
}

// ── Post fetching ─────────────────────────────────────────────────────────────

/**
 * Fetches posts from a subreddit using `after` token pagination until maxPosts
 * or lookbackDays cutoff is reached.
 * Port of reddit_collector.py get_subreddit_users() pagination loop.
 */
export async function fetchSubredditPosts(
  subreddit: string,
  options: FetchPostsOptions = {}
): Promise<RawRedditPost[]> {
  const maxPosts = options.maxPosts ?? REDDIT_CONFIG.postsPerSubreddit
  const lookbackDays = options.lookbackDays ?? REDDIT_CONFIG.lookbackDays
  const sortOrder = options.sortOrder ?? 'new'
  const timePeriod = options.timePeriod
  const cutoffUtc = Date.now() / 1000 - lookbackDays * 86400

  const posts: RawRedditPost[] = []
  let after: string | null = null
  const maxPages = 20 // safety limit (same as reddit-auto max_requests = 20)

  for (let page = 0; page < maxPages && posts.length < maxPosts; page++) {
    let url = `${REDDIT_CONFIG.baseUrl}/r/${subreddit}/${sortOrder}.json?limit=100`
    if (timePeriod && (sortOrder === 'top' || sortOrder === 'controversial')) url += `&t=${timePeriod}`
    if (after) url += `&after=${after}`

    const data = await makeRedditRequest(url) as { data?: { children?: { data: unknown }[]; after?: string | null } } | null

    if (!data?.data?.children?.length) {
      console.info(`[reddit] No more posts in r/${subreddit} (page ${page + 1})`)
      break
    }

    for (const child of data.data.children) {
      if (posts.length >= maxPosts) break

      const p = child.data as Record<string, unknown>

      // Skip posts outside the lookback window (port of time_limit_days check)
      if (typeof p.created_utc === 'number' && p.created_utc < cutoffUtc) {
        console.info(`[reddit] Reached lookback cutoff in r/${subreddit}`)
        return posts // Sorted by new — once we hit the cutoff, remaining posts are older
      }

      if (!p.id || !p.author || p.author === '[deleted]') continue

      posts.push({
        id: String(p.id),
        subreddit: String(p.subreddit ?? subreddit),
        title: String(p.title ?? ''),
        selftext: String(p.selftext ?? ''),
        author: String(p.author),
        score: Number(p.score ?? 0),
        num_comments: Number(p.num_comments ?? 0),
        created_utc: Number(p.created_utc),
        permalink: String(p.permalink ?? ''),
        url: `${REDDIT_CONFIG.baseUrl}${p.permalink}`,
      })
    }

    after = data.data.after ?? null
    if (!after) break

    console.info(`[reddit] r/${subreddit}: ${posts.length} posts collected (page ${page + 1})`)
  }

  return posts
}

// ── Comment fetching ──────────────────────────────────────────────────────────

/**
 * Fetches top-level comments for a Reddit post.
 * Uses /r/{sub}/comments/{postId}.json — public API, no auth required.
 */
export async function fetchPostComments(
  subreddit: string,
  postId: string,
  limit = 50
): Promise<RawRedditComment[]> {
  const url = `${REDDIT_CONFIG.baseUrl}/r/${subreddit}/comments/${postId}.json?limit=${limit}&depth=2`

  const data = await makeRedditRequest(url) as unknown[] | null

  // Reddit returns a 2-element array: [post_data, comments_listing]
  if (!Array.isArray(data) || data.length < 2) return []

  const commentsListing = data[1] as { data?: { children?: { data: unknown }[] } }
  const children = commentsListing?.data?.children ?? []

  return children
    .filter((c) => {
      const d = c.data as Record<string, unknown>
      return d?.kind !== 'more' && d?.body && d?.author !== '[deleted]'
    })
    .map((c) => {
      const d = c.data as Record<string, unknown>
      return {
        id: String(d.id),
        subreddit: String(d.subreddit ?? subreddit),
        body: String(d.body ?? ''),
        author: String(d.author ?? ''),
        score: Number(d.score ?? 0),
        created_utc: Number(d.created_utc ?? 0),
        permalink: `${REDDIT_CONFIG.baseUrl}${d.permalink ?? ''}`,
        link_title: String(d.link_title ?? ''),
        parent_id: String(d.parent_id ?? ''),
      }
    })
}
