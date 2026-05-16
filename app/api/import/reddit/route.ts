// ============================================
// Reddit scrape import endpoint
// app/api/import/reddit/route.ts
// ============================================
// Mirrors app/api/import/instagram/route.ts
//
// Accepts raw Reddit post data, upserts into:
//   forum_thread_index + reddit_thread_content (deduplicated via UNIQUE thread_url / reddit_post_id)
//   forum_thread_signals (deterministic extraction)
//
// No clinicId required — attribution happens separately via scripts/forum-attribute-threads.ts

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { extractAndStoreSignals } from '../../forumPipeline/deterministicExtractor'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface RedditPostImportRow {
  reddit_post_id: string       // e.g. t3_abc123
  subreddit: string
  post_type: 'post' | 'comment'
  thread_url: string
  title?: string
  body?: string
  author_username?: string
  score?: number
  comment_count?: number
  posted_at: string            // ISO 8601
}

interface RedditImportBody {
  posts: RedditPostImportRow[]
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin()
  try {
    const body = await request.json() as RedditImportBody

    if (!body.posts?.length)
      return NextResponse.json(
        { error: 'Missing required field: posts' },
        { status: 400 }
      )

    const now = new Date().toISOString()

    // ── 1. Upsert shared source row ───────────────────────────────────────────
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .upsert(
        {
          source_type: 'social_media',
          source_name: 'Reddit',
          url: 'https://www.reddit.com',
          content_hash: 'reddit_scrape',
          captured_at: now,
        },
        { onConflict: 'content_hash' }
      )
      .select('id')
      .single()

    if (sourceError) throw sourceError

    // ── 2. Upsert each post ───────────────────────────────────────────────────
    let newThreadCount = 0
    let signalRowsInserted = 0

    for (const post of body.posts) {
      // Hub row
      const { data: hub, error: hubError } = await supabase
        .from('forum_thread_index')
        .upsert(
          {
            forum_source: 'reddit',
            thread_url: post.thread_url,
            title: post.title ?? null,
            author_username: post.author_username ?? null,
            post_date: post.posted_at,
            reply_count: post.comment_count ?? 0,
            source_id: source.id,
            last_scraped_at: now,
          },
          { onConflict: 'thread_url', ignoreDuplicates: false }
        )
        .select('id')
        .single()

      if (hubError || !hub) {
        // Already exists — skip signal extraction for existing threads
        continue
      }

      newThreadCount++

      // Extension row
      await supabase
        .from('reddit_thread_content')
        .upsert(
          {
            thread_id: hub.id,
            reddit_post_id: post.reddit_post_id,
            subreddit: post.subreddit,
            post_type: post.post_type,
            body: post.body ?? null,
            score: post.score ?? 0,
            comment_count: post.comment_count ?? 0,
            is_firsthand: false,
          },
          { onConflict: 'reddit_post_id' }
        )

      // Deterministic signal extraction
      const text = [post.title, post.body].filter(Boolean).join('\n\n')
      if (text) {
        const { inserted } = await extractAndStoreSignals(hub.id, text)
        signalRowsInserted += inserted
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Reddit posts imported successfully',
      summary: {
        postsReceived: body.posts.length,
        newThreadsInserted: newThreadCount,
        signalRowsInserted,
        sourceId: source.id,
      },
    })

  } catch (error: unknown) {
    console.error('[import/reddit] Error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
