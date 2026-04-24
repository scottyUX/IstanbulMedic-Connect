/**
 * Reddit pipeline orchestrator.
 * Scrape-only — no clinic attribution at this stage.
 * Attribution runs separately via scripts/forum-attribute-threads.ts
 *
 * Flow:
 *   1. For each subreddit: paginate fetchSubredditPosts() until lookback cutoff
 *   2. For each post: INSERT forum_thread_index (clinic_id = NULL) + INSERT reddit_thread_content
 *   3. Run deterministicExtractor on each new thread
 */

import { createClient } from '@supabase/supabase-js'
import { REDDIT_CONFIG, type RawRedditPost } from './redditConfig'
import { fetchSubredditPosts, fetchPostComments } from './redditService'
import { extractAndStoreSignals } from '../forumPipeline/deterministicExtractor'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PipelineOptions {
  subreddits?: string[]
  maxPostsPerSubreddit?: number
  lookbackDays?: number
  includeComments?: boolean
  commentScoreThreshold?: number // Only fetch comments for posts above this score
  dryRun?: boolean
}

export interface PipelineResult {
  subredditsProcessed: string[]
  postsFound: number
  newThreadsInserted: number
  signalRowsInserted: number
  errors: string[]
}

// ── Upsert helpers ────────────────────────────────────────────────────────────

async function upsertThread(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  post: RawRedditPost,
  sourceId: string | null,
  postType: 'post' | 'comment' = 'post'
): Promise<{ threadId: string | null; isNew: boolean }> {
  const threadUrl = `https://www.reddit.com${post.permalink}`

  // ignoreDuplicates: false — on conflict, UPDATE last_scraped_at/reply_count and always
  // return the id. Eliminates the race condition in the old check-then-select pattern.
  const { data: hub, error: hubError } = await supabase
    .from('forum_thread_index')
    .upsert(
      {
        forum_source: 'reddit',
        thread_url: threadUrl,
        title: post.title || null,
        author_username: post.author,
        post_date: new Date(post.created_utc * 1000).toISOString(),
        reply_count: post.num_comments,
        source_id: sourceId,
        last_scraped_at: new Date().toISOString(),
      },
      { onConflict: 'thread_url', ignoreDuplicates: false }
    )
    .select('id')
    .single()

  if (hubError || !hub) return { threadId: null, isNew: false }

  // ignoreDuplicates: true on the extension row — data returned = newly inserted, null = duplicate.
  const { data: newContent } = await supabase
    .from('reddit_thread_content')
    .upsert(
      {
        thread_id: hub.id,
        reddit_post_id: `t3_${post.id}`,
        subreddit: post.subreddit,
        post_type: postType,
        body: post.selftext || null,
        score: post.score,
        comment_count: post.num_comments,
        is_firsthand: false, // set by LLM later
      },
      { onConflict: 'reddit_post_id', ignoreDuplicates: true }
    )
    .select('thread_id')
    .single()

  return { threadId: hub.id, isNew: newContent !== null }
}

// ── Pipeline ──────────────────────────────────────────────────────────────────

export async function runRedditPipeline(options: PipelineOptions = {}): Promise<PipelineResult> {
  const subreddits = options.subreddits ?? REDDIT_CONFIG.subreddits
  const maxPosts = options.maxPostsPerSubreddit ?? REDDIT_CONFIG.postsPerSubreddit
  const lookbackDays = options.lookbackDays ?? REDDIT_CONFIG.lookbackDays
  const includeComments = options.includeComments ?? false
  const commentScoreThreshold = options.commentScoreThreshold ?? 10
  const dryRun = options.dryRun ?? false

  // Defer DB client creation — env vars may not be set during dry-run
  // The definite-assignment assertion (!) is safe: supabase is only used after
  // `if (dryRun) { continue }` guards in the loop below.
  let supabase!: ReturnType<typeof getSupabaseAdmin>
  if (!dryRun) supabase = getSupabaseAdmin()

  const result: PipelineResult = {
    subredditsProcessed: [],
    postsFound: 0,
    newThreadsInserted: 0,
    signalRowsInserted: 0,
    errors: [],
  }

  // Upsert a shared source row for Reddit
  let sourceId: string | null = null
  if (!dryRun) {
    const { data: source } = await supabase
      .from('sources')
      .upsert(
        {
          source_type: 'social_media',
          source_name: 'Reddit',
          url: 'https://www.reddit.com',
          content_hash: 'reddit_scrape',
          captured_at: new Date().toISOString(),
        },
        { onConflict: 'content_hash' }
      )
      .select('id')
      .single()
    sourceId = source?.id ?? null
  }

  for (const subreddit of subreddits) {
    console.info(`[redditPipeline] Scraping r/${subreddit}...`)

    let posts: RawRedditPost[]
    try {
      posts = await fetchSubredditPosts(subreddit, { maxPosts, lookbackDays })
    } catch (err) {
      const msg = `Failed to fetch r/${subreddit}: ${err instanceof Error ? err.message : err}`
      console.error(`[redditPipeline] ${msg}`)
      result.errors.push(msg)
      continue
    }

    result.postsFound += posts.length
    result.subredditsProcessed.push(subreddit)

    if (dryRun) {
      console.info(`[redditPipeline] [DRY RUN] r/${subreddit}: ${posts.length} posts (not written)`)
      for (const p of posts.slice(0, 3)) {
        console.info(`  - ${p.title.slice(0, 80)} [score: ${p.score}]`)
      }
      continue
    }

    for (const post of posts) {
      const { threadId, isNew } = await upsertThread(supabase, post, sourceId)
      if (!threadId) continue

      if (isNew) {
        result.newThreadsInserted++

        // Run deterministic extraction on the post text
        const text = [post.title, post.selftext].filter(Boolean).join('\n\n')
        const { inserted } = await extractAndStoreSignals(threadId, text)
        result.signalRowsInserted += inserted
      }

      // Optionally fetch and store comments for high-score posts
      if (includeComments && post.score >= commentScoreThreshold) {
        const comments = await fetchPostComments(subreddit, post.id, 50)
        for (const comment of comments) {
          const commentPost: RawRedditPost = {
            id: comment.id,
            subreddit: comment.subreddit,
            title: '',
            selftext: comment.body,
            author: comment.author,
            score: comment.score,
            num_comments: 0,
            created_utc: comment.created_utc,
            permalink: comment.permalink.replace('https://www.reddit.com', ''),
            url: comment.permalink,
          }
          const { threadId: cThreadId, isNew: cIsNew } = await upsertThread(
            supabase, commentPost, sourceId, 'comment'
          )
          if (cThreadId && cIsNew) {
            result.newThreadsInserted++
            const { inserted } = await extractAndStoreSignals(cThreadId, comment.body)
            result.signalRowsInserted += inserted
          }
        }
      }
    }

    console.info(`[redditPipeline] r/${subreddit}: ${posts.length} posts → ${result.newThreadsInserted} new threads`)
  }

  return result
}
