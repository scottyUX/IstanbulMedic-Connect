/**
 * Aggregates forum thread data into clinic_forum_profiles.
 * Called when a profile row has is_stale = true.
 *
 * Computes:
 *  - thread_count (unique post-type threads), mention_count (total rows incl. comments)
 *  - photo_thread_count, longterm_thread_count, repair_mention_count
 *  - unique_authors_count, last_thread_at
 *  - sentiment_score, sentiment_distribution, confidence_score
 *  - pros (top main_topics from satisfied threads)
 *  - common_concerns (top issue keywords)
 *  - notable_threads (top 5 by score/reply_count)
 *  - summary (LLM — single call on digest of notable threads)
 *  - score (0–10 composite via computeForumScore)
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { computeForumScore, type ForumScorerThread } from '@/lib/scoring/forum'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const MODEL_NAME = process.env.FORUM_LLM_MODEL ?? 'gpt-4o-mini'

// ── Helpers ───────────────────────────────────────────────────────────────────

const SENTIMENT_WEIGHTS: Record<string, number> = {
  positive: 1,
  mixed: 0,
  negative: -1,
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

async function generateSummary(
  clinicName: string,
  notableThreads: { title: string; summary: string; sentiment: string }[]
): Promise<string | null> {
  if (!notableThreads.length) return null

  const client = new OpenAI()
  const digest = notableThreads
    .slice(0, 5)
    .map((t, i) => `${i + 1}. [${t.sentiment}] ${t.title}: ${t.summary}`)
    .join('\n')

  try {
    const response = await client.chat.completions.create({
      model: MODEL_NAME,
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Write a 1-3 sentence neutral summary of what forum users say about "${clinicName}" based on these thread summaries:\n${digest}\n\nBe factual and balanced. Do not editorialize.`,
      }],
    })
    return response.choices[0]?.message?.content?.trim() ?? null
  } catch {
    return null
  }
}

const IN_CHUNK_SIZE = 200

async function inChunks<T>(
  ids: string[],
  fetcher: (chunk: string[]) => Promise<T[]>
): Promise<T[]> {
  const results: T[] = []
  for (let i = 0; i < ids.length; i += IN_CHUNK_SIZE) {
    const rows = await fetcher(ids.slice(i, i + IN_CHUNK_SIZE))
    results.push(...rows)
  }
  return results
}

// ── Main aggregation ──────────────────────────────────────────────────────────

export interface AggregatedProfile {
  thread_count: number
  mention_count: number
  photo_thread_count: number
  longterm_thread_count: number
  repair_mention_count: number
  unique_authors_count: number
  last_thread_at: string | null
  sentiment_score: number
  confidence_score: number
  sentiment_distribution: Record<string, number>
  pros: string[]
  common_concerns: string[]
  notable_threads: {
    title: string
    url: string
    summary: string | null
    sentiment: string | null
    has_photos: boolean
  }[]
  summary: string | null
  score: number | null
}

/**
 * Recomputes a stale clinic_forum_profiles row.
 * Safe to call multiple times — upserts via UNIQUE (clinic_id, forum_source).
 */
export async function recomputeProfile(
  clinicId: string,
  forumSource: 'hrn' | 'reddit'
): Promise<void> {
  const supabase = getSupabaseAdmin()

  // Load all threads for this clinic + source
  const { data: threads, error: threadsError } = await supabase
    .from('forum_thread_index')
    .select('id, title, thread_url, author_username, post_date, reply_count, clinic_attribution_method')
    .eq('clinic_id', clinicId)
    .eq('forum_source', forumSource)

  if (threadsError) throw new Error(`[profileAggregator] Failed to load threads: ${threadsError.message}`)

  if (!threads?.length) {
    // No threads — write empty profile
    const { error: emptyUpsertError } = await supabase
      .from('clinic_forum_profiles')
      .upsert(
        {
          clinic_id: clinicId,
          forum_source: forumSource,
          thread_count: 0,
          is_stale: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'clinic_id,forum_source' }
      )
    if (emptyUpsertError) throw new Error(`[profileAggregator] Failed to upsert empty profile: ${emptyUpsertError.message}`)
    return
  }

  const threadIds = threads.map(t => t.id)

  // Load LLM analysis (current only) — chunked to avoid fetch size limits
  const analyses = await inChunks(threadIds, async chunk => {
    const { data, error } = await supabase
      .from('forum_thread_llm_analysis')
      .select('thread_id, sentiment_label, sentiment_score, satisfaction_label, main_topics, issue_keywords, is_repair_case, secondary_clinic_mentions, summary_short, sentiment_toward_clinic')
      .in('thread_id', chunk)
      .eq('is_current', true)
    if (error) throw new Error(`[profileAggregator] Failed to load LLM analyses: ${error.message}`)
    return data ?? []
  })

  // For Reddit: distinguish post-type rows from comment-type rows for mention_count vs thread_count.
  // Inherited comments (clinic_attribution_method = 'inherited') enter the scorer at 0.5 weight.
  // For HRN: all rows are posts — mention_count === thread_count, no inherited comments.
  let postTypeThreadIds: Set<string> = new Set(threadIds)
  let inheritedCommentThreadIds: Set<string> = new Set()
  if (forumSource === 'reddit') {
    const redditContent = await inChunks(threadIds, async chunk => {
      const { data, error } = await supabase
        .from('reddit_thread_content')
        .select('thread_id, post_type')
        .in('thread_id', chunk)
      if (error) throw new Error(`[profileAggregator] Failed to load reddit_thread_content: ${error.message}`)
      return data ?? []
    })
    postTypeThreadIds = new Set(
      (redditContent ?? []).filter(r => r.post_type === 'post').map(r => r.thread_id)
    )
    inheritedCommentThreadIds = new Set(
      threads
        .filter(t => t.clinic_attribution_method === 'inherited' && !postTypeThreadIds.has(t.id))
        .map(t => t.id)
    )
  }

  // Load signals — chunked to avoid fetch size limits
  const signals = await inChunks(threadIds, async chunk => {
    const { data, error } = await supabase
      .from('forum_thread_signals')
      .select('thread_id, signal_name, signal_value')
      .in('thread_id', chunk)
    if (error) throw new Error(`[profileAggregator] Failed to load signals: ${error.message}`)
    return data ?? []
  })

  // Build lookups
  const analysisMap = Object.fromEntries((analyses ?? []).map(a => [a.thread_id, a]))
  const signalsMap: Record<string, Record<string, unknown>> = {}
  for (const s of signals ?? []) {
    if (!signalsMap[s.thread_id]) signalsMap[s.thread_id] = {}
    signalsMap[s.thread_id][s.signal_name] = s.signal_value
  }

  // ── Compute deterministic counts ───────────────────────────────────────────

  const mentionCount = threads.length
  const threadCount = forumSource === 'reddit' ? postTypeThreadIds.size : threads.length

  const photoThreadCount = threads.filter(t => signalsMap[t.id]?.['has_photos'] === true).length
  const longtermThreadCount = threads.filter(t => signalsMap[t.id]?.['has_longterm_update'] === true).length
  const repairMentionCount = threads.filter(t => analysisMap[t.id]?.is_repair_case === true).length

  const uniqueAuthors = new Set(threads.map(t => t.author_username).filter(Boolean))
  const sortedByDate = [...threads].sort((a, b) =>
    (b.post_date ?? '').localeCompare(a.post_date ?? '')
  )
  const lastThreadAt = sortedByDate[0]?.post_date ?? null

  // ── Sentiment aggregation (LLM-derived) ───────────────────────────────────

  const sentimentWeights: number[] = []
  const sentimentDist: Record<string, number> = { positive: 0, mixed: 0, negative: 0 }

  for (const analysis of analyses ?? []) {
    const isInheritedComment = inheritedCommentThreadIds.has(analysis.thread_id)
    let label: string | null
    if (isInheritedComment && analysis.sentiment_toward_clinic) {
      if (analysis.sentiment_toward_clinic === 'not_applicable') continue
      label = analysis.sentiment_toward_clinic
    } else {
      label = analysis.sentiment_label
    }
    if (label && label in SENTIMENT_WEIGHTS) {
      sentimentWeights.push(SENTIMENT_WEIGHTS[label])
      sentimentDist[label] = (sentimentDist[label] ?? 0) + 1
    }
  }

  const avgSentiment = sentimentWeights.length > 0
    ? sentimentWeights.reduce((a, b) => a + b, 0) / sentimentWeights.length
    : 0

  const consistencyFactor = sentimentWeights.length > 0
    ? 1 - (stddev(sentimentWeights) / 2)
    : 0.5

  const confidenceScore = parseFloat(
    Math.min(1, (threads.length / 20) * consistencyFactor).toFixed(3)
  )
  const sentimentScore = parseFloat(avgSentiment.toFixed(3))

  // ── Pros (top main_topics from satisfied threads) ──────────────────────────

  const topicCounts: Record<string, number> = {}
  for (const analysis of analyses ?? []) {
    if (analysis.satisfaction_label !== 'satisfied') continue
    for (const topic of analysis.main_topics ?? []) {
      topicCounts[topic] = (topicCounts[topic] ?? 0) + 1
    }
  }
  const pros = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic.replace(/_/g, ' '))

  // ── Common concerns ────────────────────────────────────────────────────────

  const issueCounts: Record<string, number> = {}
  for (const analysis of analyses ?? []) {
    for (const kw of analysis.issue_keywords ?? []) {
      issueCounts[kw] = (issueCounts[kw] ?? 0) + 1
    }
  }
  const commonConcerns = Object.entries(issueCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([kw]) => kw)

  // ── Notable threads ────────────────────────────────────────────────────────

  // Sort by reply_count (descending) — proxy for engagement
  const sortedByEngagement = [...threads].sort((a, b) => (b.reply_count ?? 0) - (a.reply_count ?? 0))

  const notableThreads = sortedByEngagement.slice(0, 5).map(t => ({
    title: t.title ?? '',
    url: t.thread_url,
    summary: analysisMap[t.id]?.summary_short ?? null,
    sentiment: analysisMap[t.id]?.sentiment_label ?? null,
    has_photos: signalsMap[t.id]?.['has_photos'] === true,
  }))

  // ── Composite score ────────────────────────────────────────────────────────

  const scorerThreads: ForumScorerThread[] = threads
    .filter(t => postTypeThreadIds.has(t.id) || inheritedCommentThreadIds.has(t.id))
    .filter(t => {
      if (!inheritedCommentThreadIds.has(t.id)) return true
      return analysisMap[t.id]?.sentiment_toward_clinic !== 'not_applicable'
    })
    .map(t => {
      const a = analysisMap[t.id]
      const s = signalsMap[t.id]
      const isComment = inheritedCommentThreadIds.has(t.id)
      const sentimentLabel = isComment && a?.sentiment_toward_clinic && a.sentiment_toward_clinic !== 'not_applicable'
        ? a.sentiment_toward_clinic
        : (a?.sentiment_label ?? null)
      return {
        postDate: t.post_date ?? null,
        sentimentScore: a?.sentiment_score != null ? Number(a.sentiment_score) : null,
        sentimentLabel,
        isRepairCase: a?.is_repair_case === true,
        isRepairPerformer: (a?.secondary_clinic_mentions as { role: string }[] | null)
          ?.some(m => m.role === 'repair_source') ?? false,
        issueKeywords: a?.issue_keywords ?? [],
        hasLongtermUpdate: s?.['has_longterm_update'] === true,
        isComment,
      }
    })

  const forumScore = computeForumScore(scorerThreads)
  console.log(`[score] clinic=${clinicId} postThreads=${scorerThreads.length} effectiveN=${forumScore?.effectiveN?.toFixed(2) ?? 'n/a'} score=${forumScore?.score ?? 'insufficient'}`)

  // ── LLM summary (single call) ──────────────────────────────────────────────

  const { data: clinicRow, error: clinicError } = await supabase
    .from('clinics')
    .select('display_name')
    .eq('id', clinicId)
    .single()

  if (clinicError) throw new Error(`[profileAggregator] Failed to load clinic name: ${clinicError.message}`)

  const summary = clinicRow
    ? await generateSummary(clinicRow.display_name, notableThreads)
    : null

  // ── Upsert profile ─────────────────────────────────────────────────────────

  const { error: upsertError } = await supabase
    .from('clinic_forum_profiles')
    .upsert(
      {
        clinic_id: clinicId,
        forum_source: forumSource,
        thread_count: threadCount,
        mention_count: mentionCount,
        photo_thread_count: photoThreadCount,
        longterm_thread_count: longtermThreadCount,
        repair_mention_count: repairMentionCount,
        unique_authors_count: uniqueAuthors.size,
        last_thread_at: lastThreadAt,
        sentiment_score: sentimentScore,
        confidence_score: confidenceScore,
        sentiment_distribution: sentimentDist,
        pros,
        common_concerns: commonConcerns,
        notable_threads: notableThreads,
        summary,
        score: forumScore?.score ?? null,
        is_stale: false,
        updated_at: new Date().toISOString(),
        captured_at: new Date().toISOString(),
      },
      { onConflict: 'clinic_id,forum_source' }
    )

  if (upsertError) throw new Error(`[profileAggregator] Failed to upsert profile: ${upsertError.message}`)

  console.info(`[profileAggregator] Recomputed ${forumSource} profile for clinic ${clinicId}: ${threads.length} threads`)
}

/**
 * Recomputes all stale profiles for a given forum source.
 * Returns count of profiles recomputed.
 */
export async function recomputeStaleProfiles(
  forumSource: 'hrn' | 'reddit'
): Promise<number> {
  const supabase = getSupabaseAdmin()

  const { data: staleProfiles, error: staleError } = await supabase
    .from('clinic_forum_profiles')
    .select('clinic_id')
    .eq('forum_source', forumSource)
    .eq('is_stale', true)

  if (staleError) throw new Error(`[profileAggregator] Failed to load stale profiles: ${staleError.message}`)

  if (!staleProfiles?.length) {
    console.info(`[profileAggregator] No stale ${forumSource} profiles found`)
    return 0
  }

  for (const { clinic_id } of staleProfiles) {
    await recomputeProfile(clinic_id, forumSource)
  }

  return staleProfiles.length
}
