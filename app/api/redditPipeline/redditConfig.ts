// Reddit scraper configuration — loaded from .env.local
// Mirrors reddit-auto/src/config.py

export const REDDIT_CONFIG = {
  baseUrl: 'https://www.reddit.com',
  userAgent: process.env.REDDIT_USER_AGENT ?? 'IstanbulMedicConnect/1.0',
  requestDelayMs: parseInt(process.env.REDDIT_REQUEST_DELAY_MS ?? '1200'),
  maxRetries: parseInt(process.env.REDDIT_MAX_RETRIES ?? '3'),
  retryDelayMs: parseInt(process.env.REDDIT_RETRY_DELAY_MS ?? '65000'),
  subreddits: (process.env.REDDIT_SUBREDDITS ?? 'HairTransplants,HairTransplant,HairRestoration')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean),
  postsPerSubreddit: parseInt(process.env.REDDIT_POSTS_PER_SUBREDDIT ?? '100'),
  lookbackDays: parseInt(process.env.REDDIT_LOOKBACK_DAYS ?? '365'),
} as const

export type RedditConfig = typeof REDDIT_CONFIG

// ── Types ────────────────────────────────────────────────────────────────────

/** Raw post data as returned by the Reddit JSON API */
export interface RawRedditPost {
  id: string              // Reddit's internal ID (without t3_ prefix)
  subreddit: string
  title: string
  selftext: string        // body text
  author: string
  score: number
  num_comments: number
  created_utc: number     // Unix timestamp
  permalink: string       // e.g. /r/HairTransplants/comments/abc123/...
  url: string             // full URL
}

/** Top-level comment data */
export interface RawRedditComment {
  id: string              // Reddit's internal comment ID
  subreddit: string
  body: string
  author: string
  score: number
  created_utc: number
  permalink: string
  link_title: string
  parent_id: string
}

/** Options for fetchSubredditPosts */
export interface FetchPostsOptions {
  maxPosts?: number
  lookbackDays?: number
}
