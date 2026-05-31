import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { getRedditSignals } from '@/lib/api/reddit';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/api/forumSignals', () => ({
  getForumSignals: vi.fn().mockResolvedValue(null),
}));

import { createClient } from '@/lib/supabase/server';
import { getForumSignals } from '@/lib/api/forumSignals';

// ── Mock helpers ──────────────────────────────────────────────────────────────

const mockQueryBuilder = (data: unknown, error: unknown = null) => {
  const builder: Record<string, unknown> = {};
  for (const method of ['select', 'eq', 'in', 'order']) {
    builder[method] = vi.fn().mockReturnValue(builder);
  }
  builder.maybeSingle = vi.fn().mockResolvedValue({ data, error });
  builder.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve({ data, error }).then(resolve);
  return builder;
};

type ThreadRow = { id: string; title: string | null; thread_url: string; post_date: string | null };
type AnalysisRow = { thread_id: string; sentiment_label: string; summary_short: string | null; is_repair_case: boolean | null };
type ContentRow  = { thread_id: string; post_type: string; subreddit: string; score: number; comment_count: number };
type SignalRow   = { thread_id: string; signal_value: unknown };

const createMockSupabase = (config: {
  threads?:       ThreadRow[]  | null;
  threadsError?:  unknown;
  analyses?:      AnalysisRow[];
  analysesError?: unknown;
  contents?:      ContentRow[];
  contentsError?: unknown;
  signals?:       SignalRow[];
  clinic?:        { display_name: string } | null;
}) => ({
  from: vi.fn().mockImplementation((table: string) => {
    switch (table) {
      case 'forum_thread_index':
        return mockQueryBuilder(config.threads ?? [], config.threadsError ?? null);
      case 'forum_thread_llm_analysis':
        return mockQueryBuilder(config.analyses ?? [], config.analysesError ?? null);
      case 'reddit_thread_content':
        return mockQueryBuilder(config.contents ?? [], config.contentsError ?? null);
      case 'forum_thread_signals':
        return mockQueryBuilder(config.signals ?? [], null);
      case 'clinics':
        return mockQueryBuilder(config.clinic ?? null);
      default:
        throw new Error(`Unexpected table in Reddit test: ${table}`);
    }
  }),
});

// Minimal fixtures
const thread = (id: string, overrides: Partial<ThreadRow> = {}): ThreadRow => ({
  id,
  title: `Thread ${id}`,
  thread_url: `https://reddit.com/r/HairTransplants/comments/${id}`,
  post_date: '2026-01-01T00:00:00Z',
  ...overrides,
});

const analysis = (threadId: string, overrides: Partial<AnalysisRow> = {}): AnalysisRow => ({
  thread_id: threadId,
  sentiment_label: 'positive',
  summary_short: 'Good result.',
  is_repair_case: false,
  ...overrides,
});

const content = (threadId: string, overrides: Partial<ContentRow> = {}): ContentRow => ({
  thread_id: threadId,
  post_type: 'post',
  subreddit: 'HairTransplants',
  score: 10,
  comment_count: 5,
  ...overrides,
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('getRedditSignals', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── Null / empty cases ──────────────────────────────────────────────────────

  it('returns null when clinic has no reddit entries and getForumSignals returns null', async () => {
    (createClient as Mock).mockResolvedValue(createMockSupabase({ threads: [] }));
    (getForumSignals as Mock).mockResolvedValue(null);

    expect(await getRedditSignals('clinic-1')).toBeNull();
  });

  it('returns empty thread arrays when entries are absent but aggregate exists', async () => {
    (createClient as Mock).mockResolvedValue(createMockSupabase({ threads: [] }));
    (getForumSignals as Mock).mockResolvedValue({
      forumSource: 'reddit', threadCount: 0, score: null, pros: [], commonConcerns: [],
      notableThreads: [], summary: null, updatedAt: new Date().toISOString(),
    });

    const result = await getRedditSignals('clinic-1');

    expect(result?.allThreads).toHaveLength(0);
    expect(result?.repairThreads).toHaveLength(0);
  });

  it('returns null when the thread query errors', async () => {
    (createClient as Mock).mockResolvedValue(
      createMockSupabase({ threads: null, threadsError: new Error('DB error') })
    );

    expect(await getRedditSignals('clinic-1')).toBeNull();
  });

  // ── Non-fatal analysis failure ──────────────────────────────────────────────

  it('returns partial data (no sentiment/summaries) when analysis query fails', async () => {
    (createClient as Mock).mockResolvedValue(
      createMockSupabase({
        threads: [thread('t1')],
        analysesError: { message: 'fetch failed', code: 'NETWORK' },
        contents: [content('t1')],
        clinic: { display_name: 'Test Clinic' },
      })
    );

    const result = await getRedditSignals('clinic-1');

    // Should still return a result, not null
    expect(result).not.toBeNull();
    // With no analyses, thread defaults to mixed sentiment and no summary
    expect(result?.allThreads[0].sentimentLabel).toBe('mixed');
    expect(result?.allThreads[0].summaryShort).toBe('');
    expect(result?.combinedSentimentDistribution).toEqual({ positive: 0, mixed: 0, negative: 0 });
  });

  // ── Post/comment separation ─────────────────────────────────────────────────

  it('excludes comment-type entries from allThreads', async () => {
    (createClient as Mock).mockResolvedValue(
      createMockSupabase({
        threads: [thread('p1'), thread('c1')],
        analyses: [
          analysis('p1', { sentiment_label: 'positive' }),
          analysis('c1', { sentiment_label: 'negative' }),
        ],
        contents: [
          content('p1', { post_type: 'post' }),
          content('c1', { post_type: 'comment' }),
        ],
        clinic: { display_name: 'Test Clinic' },
      })
    );

    const result = await getRedditSignals('clinic-1');

    expect(result?.allThreads).toHaveLength(1);
    expect(result?.allThreads[0].threadId).toBe('p1');
  });

  it('includes comment-type entries in combined sentiment distribution', async () => {
    (createClient as Mock).mockResolvedValue(
      createMockSupabase({
        threads: [thread('p1'), thread('c1'), thread('c2')],
        analyses: [
          analysis('p1', { sentiment_label: 'positive' }),
          analysis('c1', { sentiment_label: 'negative' }),
          analysis('c2', { sentiment_label: 'mixed' }),
        ],
        contents: [
          content('p1', { post_type: 'post' }),
          content('c1', { post_type: 'comment' }),
          content('c2', { post_type: 'comment' }),
        ],
        clinic: { display_name: 'Test Clinic' },
      })
    );

    const result = await getRedditSignals('clinic-1');

    expect(result?.combinedSentimentDistribution).toEqual({ positive: 1, mixed: 1, negative: 1 });
    expect(result?.postCount).toBe(1);
    expect(result?.qualifiedCommentCount).toBe(2);
  });

  // ── Long-term follow-up signal ──────────────────────────────────────────────

  it('uses has_longterm_update (not has_12_month_followup) for follow-up detection', async () => {
    (createClient as Mock).mockResolvedValue(
      createMockSupabase({
        threads: [thread('t1'), thread('t2')],
        analyses: [analysis('t1'), analysis('t2')],
        contents: [content('t1'), content('t2')],
        // Signal written by the forum pipeline
        signals: [{ thread_id: 't1', signal_value: true }],
        clinic: { display_name: 'Test Clinic' },
      })
    );

    const result = await getRedditSignals('clinic-1');

    expect(result?.allThreads.find(t => t.threadId === 't1')?.hasLongTermFollowup).toBe(true);
    expect(result?.allThreads.find(t => t.threadId === 't2')?.hasLongTermFollowup).toBe(false);
  });

  it('does not mark threads as hasLongTermFollowup when signal_value is false', async () => {
    (createClient as Mock).mockResolvedValue(
      createMockSupabase({
        threads: [thread('t1')],
        analyses: [analysis('t1')],
        contents: [content('t1')],
        signals: [{ thread_id: 't1', signal_value: false }],
        clinic: { display_name: 'Test Clinic' },
      })
    );

    const result = await getRedditSignals('clinic-1');

    expect(result?.allThreads[0].hasLongTermFollowup).toBe(false);
  });

  // ── Repair threads ──────────────────────────────────────────────────────────

  it('filters repairThreads to is_repair_case = true entries only', async () => {
    (createClient as Mock).mockResolvedValue(
      createMockSupabase({
        threads: [thread('t1'), thread('t2'), thread('t3')],
        analyses: [
          analysis('t1', { is_repair_case: true }),
          analysis('t2', { is_repair_case: false }),
          analysis('t3', { is_repair_case: true }),
        ],
        contents: [content('t1'), content('t2'), content('t3')],
        clinic: { display_name: 'Test Clinic' },
      })
    );

    const result = await getRedditSignals('clinic-1');

    expect(result?.repairThreads).toHaveLength(2);
    expect(result?.repairThreads.map(t => t.threadId)).toEqual(['t1', 't3']);
  });

  // ── Field mapping ───────────────────────────────────────────────────────────

  it('maps thread fields correctly from raw rows', async () => {
    (createClient as Mock).mockResolvedValue(
      createMockSupabase({
        threads: [thread('t1', { title: 'My hair result', thread_url: 'https://reddit.com/r/HT/t1', post_date: '2025-06-01T00:00:00Z' })],
        analyses: [analysis('t1', { sentiment_label: 'positive', summary_short: 'Great result.', is_repair_case: false })],
        contents: [content('t1', { subreddit: 'HairTransplants', score: 42, comment_count: 7 })],
        clinic: { display_name: 'Test Clinic' },
      })
    );

    const result = await getRedditSignals('clinic-1');
    const t = result?.allThreads[0];

    expect(t?.threadId).toBe('t1');
    expect(t?.title).toBe('My hair result');
    expect(t?.threadUrl).toBe('https://reddit.com/r/HT/t1');
    expect(t?.sentimentLabel).toBe('positive');
    expect(t?.summaryShort).toBe('Great result.');
    expect(t?.subreddit).toBe('HairTransplants');
    expect(t?.score).toBe(42);
    expect(t?.commentCount).toBe(7);
    expect(t?.postDate).toBe('2025-06-01T00:00:00Z');
  });
});
