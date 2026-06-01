import { createClient } from '@/lib/supabase/server';
import { getForumSignals, type ClinicForumProfile } from './forumSignals';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RedditThread {
  threadId: string
  threadUrl: string
  title: string
  summaryShort: string
  sentimentLabel: 'positive' | 'mixed' | 'negative'
  isRepairCase: boolean
  hasPhotos: boolean
  hasLongTermFollowup: boolean
  subreddit: string
  score: number
  commentCount: number
  postDate: string
}

export interface RedditSignalsData extends ClinicForumProfile {
  clinicName: string
  allThreads: RedditThread[]
  repairThreads: RedditThread[]
  photoThreadsList: RedditThread[]
  // Sentiment tallied across posts + comments that have LLM analysis. Comments
  // below the 5-upvote threshold are never sent through the pipeline so they
  // are naturally absent from the inner join result.
  combinedSentimentDistribution: { positive: number; mixed: number; negative: number }
  postCount: number
  qualifiedCommentCount: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

export async function getRedditSignals(clinicId: string): Promise<RedditSignalsData | null> {
  try {
    const supabase = await createClient();

    // 1. All Reddit entries (posts AND comments) attributed to this clinic.
    //    We filter to post-type when building the browseable thread list;
    //    comments are included only for the combined sentiment tally.
    const { data: entries, error: entriesError } = await supabase
      .from('forum_thread_index')
      .select('id, title, thread_url, post_date')
      .eq('clinic_id', clinicId)
      .eq('forum_source', 'reddit')
      .order('post_date', { ascending: false });

    if (entriesError) {
      console.error('Error fetching Reddit entries:', entriesError);
      return null;
    }

    if (!entries || entries.length === 0) {
      const aggregate = await getForumSignals(clinicId, 'reddit');
      if (!aggregate) return null;
      return {
        ...aggregate,
        clinicName: '',
        allThreads: [],
        repairThreads: [],
        photoThreadsList: [],
        combinedSentimentDistribution: { positive: 0, mixed: 0, negative: 0 },
        postCount: 0,
        qualifiedCommentCount: 0,
      };
    }

    const entryIds = entries.map(e => e.id);
    // Chunk IDs to avoid HeadersOverflowError — large .in() arrays push the URL
    // past HTTP/2 header limits (~8 KB). 80 UUIDs ≈ 3 KB per request.
    const idChunks = chunkArray(entryIds, 80);

    // 2. Parallel: LLM analyses, reddit content (gives post_type + metadata),
    //    followup signals, photo signals, clinic name, aggregated profile.
    const [
      analysisChunks,
      contentChunks,
      followupChunks,
      photoChunks,
      { data: clinicRow },
      aggregate,
    ] = await Promise.all([
      Promise.all(idChunks.map(chunk =>
        supabase
          .from('forum_thread_llm_analysis')
          .select('thread_id, sentiment_label, summary_short, is_repair_case')
          .in('thread_id', chunk)
          .eq('is_current', true)
      )),
      Promise.all(idChunks.map(chunk =>
        supabase
          .from('reddit_thread_content')
          .select('thread_id, post_type, subreddit, score, comment_count')
          .in('thread_id', chunk)
      )),
      Promise.all(idChunks.map(chunk =>
        supabase
          .from('forum_thread_signals')
          .select('thread_id, signal_value')
          .in('thread_id', chunk)
          .eq('signal_name', 'has_longterm_update')
      )),
      Promise.all(idChunks.map(chunk =>
        supabase
          .from('forum_thread_signals')
          .select('thread_id, signal_value')
          .in('thread_id', chunk)
          .eq('signal_name', 'has_photos')
      )),
      supabase.from('clinics').select('display_name').eq('id', clinicId).maybeSingle(),
      getForumSignals(clinicId, 'reddit'),
    ]);

    const logErr = (label: string, err: unknown) => {
      const e = err as { message?: string; code?: string; details?: string } | null;
      console.error(`${label}: code=${e?.code} message=${e?.message}`);
    };

    const analysesError  = analysisChunks.find(r => r.error)?.error;
    const contentsError  = contentChunks.find(r => r.error)?.error;
    const followupError  = followupChunks.find(r => r.error)?.error;
    const photoError     = photoChunks.find(r => r.error)?.error;

    // Non-fatal: missing LLM data degrades gracefully (no sentiment/summaries/repair flags).
    if (analysesError) logErr('Reddit LLM analyses error', analysesError);
    // Non-fatal: missing content data means all entries treated as posts.
    if (contentsError) logErr('Reddit thread content error', contentsError);
    // Signal failures are non-fatal — affected booleans default to false.
    if (followupError) logErr('Reddit followup signals error', followupError);
    if (photoError)    logErr('Reddit photo signals error', photoError);

    const analyses        = analysisChunks.flatMap(r => r.data ?? []);
    const contents        = contentChunks.flatMap(r => r.data ?? []);
    const followupSignals = followupChunks.flatMap(r => r.data ?? []);
    const photoSignals    = photoChunks.flatMap(r => r.data ?? []);

    // Build lookup maps
    const analysisMap = new Map<string, NonNullable<typeof analyses>[number]>();
    for (const a of analyses ?? []) analysisMap.set(a.thread_id, a);

    const contentMap = new Map<string, NonNullable<typeof contents>[number]>();
    for (const c of contents ?? []) contentMap.set(c.thread_id, c);

    const followupSet = new Set<string>();
    for (const s of followupSignals ?? []) {
      if (s.signal_value === true) followupSet.add(s.thread_id);
    }

    const photoSet = new Set<string>();
    for (const s of photoSignals ?? []) {
      if (s.signal_value === true) photoSet.add(s.thread_id);
    }

    // Combined sentiment: tally across ALL entries (posts + comments) that have
    // LLM analysis. Count all analyzed entries regardless of label validity;
    // only skip unrecognized labels when tallying the distribution.
    const combinedSentimentDistribution = { positive: 0, mixed: 0, negative: 0 };
    let postCount = 0;
    let qualifiedCommentCount = 0;

    for (const a of analyses ?? []) {
      const postType = contentMap.get(a.thread_id)?.post_type ?? 'post';
      if (postType === 'post') postCount++;
      else qualifiedCommentCount++;

      const label = a.sentiment_label as keyof typeof combinedSentimentDistribution;
      if (label in combinedSentimentDistribution) {
        combinedSentimentDistribution[label]++;
      }
    }

    // Build browseable thread list from post-type entries only
    const allThreads: RedditThread[] = entries
      .filter(e => {
        const content = contentMap.get(e.id);
        return !content || content.post_type === 'post';
      })
      .map(e => {
        const analysis = analysisMap.get(e.id);
        const content = contentMap.get(e.id);
        return {
          threadId: e.id,
          threadUrl: e.thread_url ?? '',
          title: e.title ?? 'Untitled thread',
          summaryShort: analysis?.summary_short ?? '',
          sentimentLabel: (['positive', 'mixed', 'negative'].includes(analysis?.sentiment_label ?? '')
            ? analysis!.sentiment_label
            : 'mixed') as RedditThread['sentimentLabel'],
          isRepairCase: analysis?.is_repair_case ?? false,
          hasPhotos: photoSet.has(e.id),
          hasLongTermFollowup: followupSet.has(e.id),
          subreddit: content?.subreddit ?? '',
          score: content?.score ?? 0,
          commentCount: content?.comment_count ?? 0,
          postDate: e.post_date ?? new Date().toISOString(),
        };
      });

    const repairThreads = allThreads.filter(t => t.isRepairCase);
    const photoThreadsList = allThreads.filter(t => t.hasPhotos);

    // Merge with aggregated profile (summary, pros, score, etc.)
    const postEntries = allThreads;
    const base: ClinicForumProfile = aggregate ?? {
      forumSource: 'reddit',
      threadCount: postEntries.length,
      photoThreadCount: photoThreadsList.length,
      longtermThreadCount: postEntries.filter(t => t.hasLongTermFollowup).length,
      repairMentionCount: repairThreads.length,
      uniqueAuthorsCount: null,
      lastThreadAt: entries[0]?.post_date ?? null,
      sentimentScore: null,
      confidenceScore: null,
      sentimentDistribution: {},
      pros: [],
      commonConcerns: [],
      notableThreads: [],
      summary: null,
      score: null,
      updatedAt: new Date().toISOString(),
    };

    return {
      ...base,
      clinicName: clinicRow?.display_name ?? '',
      allThreads,
      repairThreads,
      photoThreadsList,
      combinedSentimentDistribution,
      postCount,
      qualifiedCommentCount,
    };
  } catch (error) {
    console.error('Error fetching Reddit signals:', error);
    return null;
  }
}
