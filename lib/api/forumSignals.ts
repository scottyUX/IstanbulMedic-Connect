/**
 * Forum signals data fetch layer.
 * Queries clinic_forum_profiles by (clinic_id, forum_source).
 * Mirrors lib/api/instagram.ts
 */

import { createClient } from '@/lib/supabase/server'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NotableThread {
  title: string
  url: string
  summary: string | null
  sentiment: string | null
  has_photos: boolean
}

export interface ClinicForumProfile {
  forumSource: 'hrn' | 'reddit'
  threadCount: number
  photoThreadCount: number
  longtermThreadCount: number
  repairMentionCount: number
  uniqueAuthorsCount: number | null
  lastThreadAt: string | null
  sentimentScore: number | null
  confidenceScore: number | null
  sentimentDistribution: Record<string, number>
  pros: string[]
  commonConcerns: string[]
  notableThreads: NotableThread[]
  summary: string | null
  score: number | null
  updatedAt: string
}

// ── Fetch function ────────────────────────────────────────────────────────────

/**
 * Fetches the aggregated forum profile for a clinic + source.
 * Returns null if no data exists yet.
 */
export async function getForumSignals(
  clinicId: string,
  source: 'hrn' | 'reddit'
): Promise<ClinicForumProfile | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clinic_forum_profiles')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('forum_source', source)
    .single()

  if (error || !data) return null

  return {
    forumSource: data.forum_source as 'hrn' | 'reddit',
    threadCount: data.thread_count ?? 0,
    photoThreadCount: data.photo_thread_count ?? 0,
    longtermThreadCount: data.longterm_thread_count ?? 0,
    repairMentionCount: data.repair_mention_count ?? 0,
    uniqueAuthorsCount: data.unique_authors_count ?? null,
    lastThreadAt: data.last_thread_at ?? null,
    sentimentScore: data.sentiment_score != null ? Number(data.sentiment_score) : null,
    confidenceScore: data.confidence_score != null ? Number(data.confidence_score) : null,
    sentimentDistribution: (data.sentiment_distribution as Record<string, number>) ?? {},
    pros: data.pros ?? [],
    commonConcerns: data.common_concerns ?? [],
    notableThreads: (data.notable_threads as unknown as NotableThread[]) ?? [],
    summary: data.summary ?? null,
    score: data.score != null ? Number(data.score) : null,
    updatedAt: data.updated_at,
  }
}
