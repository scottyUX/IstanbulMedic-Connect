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
import { REDDIT_CONFIG, type RawRedditPost, type SortSlice } from './redditConfig'
import { fetchSubredditPosts, fetchPostComments } from './redditService'
import { extractAndStoreSignals } from '../forumPipeline/deterministicExtractor'
import { substringMatch, loadClinicNames, type ClinicNameEntry } from '../forumPipeline/llmAttributor'

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
  sortSlices?: SortSlice[]  // defaults to [{ sortOrder: 'new' }]
  includeComments?: boolean
  commentPostThreshold?: number  // Only fetch comments for parent posts above this upvote score
  commentsPerPost?: number       // Max comments to fetch per post
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
  const sortSlices = options.sortSlices ?? [{ sortOrder: 'new' as const }]
  const includeComments = options.includeComments ?? REDDIT_CONFIG.includeComments
  const commentPostThreshold = options.commentPostThreshold ?? REDDIT_CONFIG.commentPostThreshold
  const commentsPerPost = options.commentsPerPost ?? REDDIT_CONFIG.commentsPerPost
  const dryRun = options.dryRun ?? false

  // Defer DB client creation — env vars may not be set during dry-run
  // The definite-assignment assertion (!) is safe: supabase is only used after
  // `if (dryRun) { continue }` guards in the loop below.
  let supabase!: ReturnType<typeof getSupabaseAdmin>
  if (!dryRun) supabase = getSupabaseAdmin()

  // Load clinic names once for substringMatch — only needed when scraping comments
  let clinicNames: ClinicNameEntry[] = []
  if (includeComments && !dryRun) {
    clinicNames = await loadClinicNames()
    console.info(`[redditPipeline] Loaded ${clinicNames.length} clinic names for comment inheritance check`)
  }

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

    // Fetch all sort slices and deduplicate by post id
    const seenIds = new Set<string>()
    const posts: RawRedditPost[] = []
    let fetchFailed = false

    for (const slice of sortSlices) {
      const label = slice.timePeriod ? `${slice.sortOrder}?t=${slice.timePeriod}` : slice.sortOrder
      console.info(`[redditPipeline] r/${subreddit}: fetching /${label}...`)
      try {
        // For non-chronological sorts (top, controversial), lookbackDays filtering
        // skips individual old posts rather than exiting early — but it still silently
        // drops historically high-scoring posts if the caller left lookbackDays at the
        // default. Pass Infinity unless the caller explicitly set a lookback.
        const effectiveLookback = slice.sortOrder === 'new'
          ? lookbackDays
          : (options.lookbackDays !== undefined ? lookbackDays : Infinity)

        const batch = await fetchSubredditPosts(subreddit, {
          maxPosts,
          lookbackDays: effectiveLookback,
          sortOrder: slice.sortOrder,
          timePeriod: slice.timePeriod,
        })
        let newInSlice = 0
        for (const post of batch) {
          if (!seenIds.has(post.id)) {
            seenIds.add(post.id)
            posts.push(post)
            newInSlice++
          }
        }
        console.info(`[redditPipeline] r/${subreddit} /${label}: ${batch.length} fetched, ${newInSlice} unique`)
      } catch (err) {
        const msg = `Failed to fetch r/${subreddit} /${label}: ${err instanceof Error ? err.message : err}`
        console.error(`[redditPipeline] ${msg}`)
        result.errors.push(msg)
        fetchFailed = true
      }
    }

    if (fetchFailed && posts.length === 0) continue

    result.postsFound += posts.length
    result.subredditsProcessed.push(subreddit)

    if (dryRun) {
      const eligibleForComments = posts.filter(p => p.score >= commentPostThreshold).length
      console.info(`[redditPipeline] [DRY RUN] r/${subreddit}: ${posts.length} unique posts across ${sortSlices.length} sort(s) (not written)`)
      if (includeComments) {
        console.info(`  Would fetch comments for ${eligibleForComments}/${posts.length} posts (upvote score >= ${commentPostThreshold})`)
        console.info(`  Estimated max comment API calls: ${eligibleForComments} (up to ${commentsPerPost} each)`)
        console.info(`  Note: inherited comment rows affect mention_count and score (at 0.5 weight)`)
      }
      for (const p of posts.slice(0, 3)) {
        console.info(`  - ${p.title.slice(0, 80)} [upvotes: ${p.score}]`)
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

      // Fetch and store comments for posts above the upvote threshold
      if (includeComments && post.score >= commentPostThreshold) {
        const comments = await fetchPostComments(subreddit, post.id, commentsPerPost)

        // Read parent's clinic_id once for the whole batch — not per comment
        const { data: parentHub } = await supabase
          .from('forum_thread_index')
          .select('clinic_id')
          .eq('id', threadId)
          .single()
        const parentClinicId: string | null = parentHub?.clinic_id ?? null

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
          if (!cThreadId) continue

          // Back-fill parent_thread_id — idempotent via IS NULL guard
          await supabase
            .from('reddit_thread_content')
            .update({ parent_thread_id: threadId })
            .eq('thread_id', cThreadId)
            .is('parent_thread_id', null)

          // Conditionally inherit clinic_id from parent using substringMatch.
          // 0 matches or 1 match same as parent → safe to inherit
          // 1 match different from parent or 2+ matches → skip, let LLM attribute
          if (parentClinicId) {
            const hits = substringMatch(comment.body, clinicNames)
            const safeToInherit = hits.length === 0 || (hits.length === 1 && hits[0] === parentClinicId)
            if (safeToInherit) {
              await supabase
                .from('forum_thread_index')
                .update({
                  clinic_id: parentClinicId,
                  clinic_attribution_method: 'inherited',
                  last_scraped_at: new Date().toISOString(),
                })
                .eq('id', cThreadId)
                .is('clinic_id', null)
            }
          }

          if (cIsNew) {
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
