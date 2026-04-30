import { createClient } from '@/lib/supabase/server';
import type { HRNSignalsData, HRNThread } from '@/components/istanbulmedic-connect/profile/HRNSignalsCard';
import { getMockHRNSignals } from './hrn.mock';
import { computeHRNScore } from '@/lib/scoring/hrn';

const USE_MOCK_HRN = process.env.USE_MOCK_HRN === 'true';

/**
 * Fetches HRN forum signals for a clinic by querying raw tables.
 * Joins forum_thread_index + forum_thread_llm_analysis (is_current=true)
 * + hrn_thread_content + forum_thread_signals in memory.
 *
 * Returns null if no threads are attributed to this clinic.
 */
export async function getHRNSignals(clinicId: string, clinicName = ''): Promise<HRNSignalsData | null> {
  if (USE_MOCK_HRN) return getMockHRNSignals(clinicId, clinicName);

  try {
    const supabase = await createClient();

    // 1. All HRN threads attributed to this clinic
    const { data: threads, error: threadsError } = await supabase
      .from('forum_thread_index')
      .select('id, title, thread_url, post_date')
      .eq('clinic_id', clinicId)
      .eq('forum_source', 'hrn')
      .order('post_date', { ascending: false });

    if (threadsError) {
      console.error('Error fetching HRN threads:', threadsError);
      return null;
    }

    if (!threads || threads.length === 0) return null;

    const threadIds = threads.map(t => t.id);

    // 2–4. Parallel: LLM analysis, photo content, follow-up signals
    const [
      { data: analyses, error: analysesError },
      { data: contents, error: contentsError },
      { data: followupSignals, error: signalsError },
      { data: clinic },
    ] = await Promise.all([
      supabase
        .from('forum_thread_llm_analysis')
        .select('thread_id, sentiment_label, sentiment_score, summary_short, main_topics, issue_keywords, is_repair_case')
        .in('thread_id', threadIds)
        .eq('is_current', true),

      supabase
        .from('hrn_thread_content')
        .select('thread_id, has_photos, image_urls')
        .in('thread_id', threadIds),

      supabase
        .from('forum_thread_signals')
        .select('thread_id, signal_value')
        .in('thread_id', threadIds)
        .eq('signal_name', 'has_12_month_followup'),

      supabase
        .from('clinics')
        .select('display_name')
        .eq('id', clinicId)
        .maybeSingle(),
    ]);

    if (analysesError) {
      console.error('Error fetching HRN LLM analyses:', analysesError);
      return null;
    }
    if (contentsError) {
      console.error('Error fetching HRN thread content:', contentsError);
      return null;
    }
    if (signalsError) {
      console.error('Error fetching HRN thread signals:', signalsError);
      return null;
    }

    // Build lookup maps for O(1) joins
    const analysisMap = new Map<string, NonNullable<typeof analyses>[number]>();
    for (const a of analyses ?? []) {
      analysisMap.set(a.thread_id, a);
    }

    const contentMap = new Map<string, NonNullable<typeof contents>[number]>();
    for (const c of contents ?? []) {
      contentMap.set(c.thread_id, c);
    }

    // A signal value of jsonb true comes back as JS true
    const followupSet = new Set<string>();
    for (const s of followupSignals ?? []) {
      if (s.signal_value === true) followupSet.add(s.thread_id);
    }

    // Build per-thread objects
    const allThreads: HRNThread[] = threads.map(t => {
      const analysis = analysisMap.get(t.id);
      const content = contentMap.get(t.id);
      const imageUrls: string[] = content?.image_urls ?? [];
      const hasPhotos = content?.has_photos ?? false;

      return {
        threadUrl: t.thread_url,
        title: t.title ?? 'Untitled thread',
        summaryShort: analysis?.summary_short ?? '',
        sentimentLabel: (['positive', 'mixed', 'negative'].includes(analysis?.sentiment_label ?? '')
          ? analysis!.sentiment_label
          : 'mixed') as HRNThread['sentimentLabel'],
        isRepairCase: analysis?.is_repair_case ?? false,
        hasPhotos,
        photoCount: imageUrls.length,
        hasLongTermFollowup: followupSet.has(t.id),
        postDate: t.post_date ?? new Date().toISOString(),
      };
    });

    // Aggregate sentiment counts
    const sentiment = { positive: 0, mixed: 0, negative: 0 };
    for (const t of allThreads) {
      sentiment[t.sentimentLabel]++;
    }

    // Flatten main_topics across all analyses and rank by frequency
    const topicCounts = new Map<string, number>();
    for (const a of analyses ?? []) {
      for (const topic of (a.main_topics ?? [])) {
        topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
      }
    }
    const topTopics = [...topicCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);

    const photoThreadsList = allThreads.filter(t => t.hasPhotos);
    const longTermFollowups = allThreads.filter(t => t.hasLongTermFollowup).length;
    const repairCases = allThreads.filter(t => t.isRepairCase).length;

    // Use the most recent thread's post_date as lastUpdated
    const lastUpdated = threads[0]?.post_date ?? new Date().toISOString();

    // Compute HRN score from per-thread signals
    const scoreBreakdown = computeHRNScore(
      threads.map(t => {
        const analysis = analysisMap.get(t.id);
        return {
          postDate: t.post_date ?? new Date().toISOString(),
          sentimentScore: analysis?.sentiment_score ?? null,
          isRepairCase: analysis?.is_repair_case ?? false,
          hasLongTermFollowup: followupSet.has(t.id),
          issueKeywords: analysis?.issue_keywords ?? [],
        };
      })
    );

    return {
      clinicName: clinic?.display_name ?? '',
      totalThreads: allThreads.length,
      lastUpdated,
      photoThreads: photoThreadsList.length,
      longTermFollowups,
      repairCases,
      sentiment,
      topTopics,
      photoThreadsList,
      allThreads,
      hrnScore: scoreBreakdown?.score,
      hrnScoreBreakdown: scoreBreakdown,
    };
  } catch (error) {
    console.error('Error fetching HRN signals:', error);
    return null;
  }
}
