import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { getHRNSignals } from '@/lib/api/hrn';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';

// ── Mock helpers ──────────────────────────────────────────────────────────────

/**
 * Creates a chainable query builder that resolves to { data, error } when awaited.
 * The `then` property makes it thenable so `await builder` works without a terminal
 * call like `.single()`. `.maybeSingle()` is also supported for the clinics query.
 */
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

type ThreadRow = {
  id: string;
  title: string | null;
  thread_url: string;
  post_date: string | null;
};
type AnalysisRow = {
  thread_id: string;
  sentiment_label: string;
  summary_short: string | null;
  main_topics: string[] | null;
  is_repair_case: boolean | null;
};
type ContentRow = {
  thread_id: string;
  has_photos: boolean | null;
  image_urls: string[] | null;
};
type SignalRow = { thread_id: string; signal_value: unknown };

const createMockSupabase = (config: {
  threads?: ThreadRow[] | null;
  threadsError?: unknown;
  analyses?: AnalysisRow[];
  analysesError?: unknown;
  contents?: ContentRow[];
  contentsError?: unknown;
  signals?: SignalRow[];
  signalsError?: unknown;
  clinic?: { display_name: string } | null;
}) => ({
  from: vi.fn().mockImplementation((table: string) => {
    switch (table) {
      case 'forum_thread_index':
        return mockQueryBuilder(config.threads ?? [], config.threadsError ?? null);
      case 'forum_thread_llm_analysis':
        return mockQueryBuilder(config.analyses ?? [], config.analysesError ?? null);
      case 'hrn_thread_content':
        return mockQueryBuilder(config.contents ?? [], config.contentsError ?? null);
      case 'forum_thread_signals':
        return mockQueryBuilder(config.signals ?? [], config.signalsError ?? null);
      case 'clinics':
        return mockQueryBuilder(config.clinic ?? null);
      default:
        throw new Error(`Unexpected table in HRN test: ${table}`);
    }
  }),
});

// Minimal fixtures so individual tests only specify what they care about
const thread = (id: string, overrides: Partial<ThreadRow> = {}): ThreadRow => ({
  id,
  title: `Thread ${id}`,
  thread_url: `https://www.hairrestorationnetwork.com/topic/${id}`,
  post_date: '2026-01-01T00:00:00Z',
  ...overrides,
});

const analysis = (threadId: string, overrides: Partial<AnalysisRow> = {}): AnalysisRow => ({
  thread_id: threadId,
  sentiment_label: 'positive',
  summary_short: 'Good result.',
  main_topics: ['density'],
  is_repair_case: false,
  ...overrides,
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('getHRNSignals', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── Null / error cases ──────────────────────────────────────────────────────

  it('returns null when clinic has no HRN threads', async () => {
    (createClient as Mock).mockResolvedValue(createMockSupabase({ threads: [] }));

    expect(await getHRNSignals('clinic-1')).toBeNull();
  });

  it('returns null when the thread query errors', async () => {
    (createClient as Mock).mockResolvedValue(
      createMockSupabase({ threads: null, threadsError: new Error('DB error') })
    );

    expect(await getHRNSignals('clinic-1')).toBeNull();
  });

  it('returns null when the LLM analysis query errors', async () => {
    (createClient as Mock).mockResolvedValue(
      createMockSupabase({ threads: [thread('t1')], analysesError: new Error('DB error') })
    );

    expect(await getHRNSignals('clinic-1')).toBeNull();
  });

  // ── Sentiment aggregation ───────────────────────────────────────────────────

  it('counts sentiment correctly across threads', async () => {
    (createClient as Mock).mockResolvedValue(
      createMockSupabase({
        threads: [thread('t1'), thread('t2'), thread('t3'), thread('t4')],
        analyses: [
          analysis('t1', { sentiment_label: 'positive' }),
          analysis('t2', { sentiment_label: 'positive' }),
          analysis('t3', { sentiment_label: 'mixed' }),
          analysis('t4', { sentiment_label: 'negative' }),
        ],
        clinic: { display_name: 'Test Clinic' },
      })
    );

    const result = await getHRNSignals('clinic-1');

    expect(result?.totalThreads).toBe(4);
    expect(result?.sentiment).toEqual({ positive: 2, mixed: 1, negative: 1 });
  });

  it('defaults threads with no LLM analysis to mixed sentiment and empty summary', async () => {
    // Scraper ran but LLM hasn't processed this thread yet
    (createClient as Mock).mockResolvedValue(
      createMockSupabase({
        threads: [thread('t1')],
        analyses: [],
        clinic: { display_name: 'Test Clinic' },
      })
    );

    const result = await getHRNSignals('clinic-1');

    expect(result?.allThreads[0].sentimentLabel).toBe('mixed');
    expect(result?.allThreads[0].summaryShort).toBe('');
    expect(result?.sentiment).toEqual({ positive: 0, mixed: 1, negative: 0 });
  });

  // ── Photo threads ───────────────────────────────────────────────────────────

  it('photoThreadsList only includes threads where has_photos is true', async () => {
    (createClient as Mock).mockResolvedValue(
      createMockSupabase({
        threads: [thread('t1'), thread('t2')],
        contents: [
          { thread_id: 't1', has_photos: true, image_urls: ['a.jpg', 'b.jpg', 'c.jpg'] },
          { thread_id: 't2', has_photos: false, image_urls: [] },
        ],
        clinic: { display_name: 'Test Clinic' },
      })
    );

    const result = await getHRNSignals('clinic-1');

    expect(result?.photoThreads).toBe(1);
    expect(result?.photoThreadsList).toHaveLength(1);
    expect(result?.photoThreadsList[0].threadUrl).toContain('t1');
    expect(result?.photoThreadsList[0].photoCount).toBe(3); // image_urls.length
  });

  // ── Long-term follow-ups ────────────────────────────────────────────────────

  it('marks threads with a has_12_month_followup signal as hasLongTermFollowup', async () => {
    (createClient as Mock).mockResolvedValue(
      createMockSupabase({
        threads: [thread('t1'), thread('t2')],
        signals: [{ thread_id: 't1', signal_value: true }], // only t1 has the signal
        clinic: { display_name: 'Test Clinic' },
      })
    );

    const result = await getHRNSignals('clinic-1');

    expect(result?.longTermFollowups).toBe(1);
    expect(result?.allThreads.find(t => t.threadUrl.includes('t1'))?.hasLongTermFollowup).toBe(true);
    expect(result?.allThreads.find(t => t.threadUrl.includes('t2'))?.hasLongTermFollowup).toBe(false);
  });

  // ── Repair cases ────────────────────────────────────────────────────────────

  it('counts repair cases from is_repair_case in LLM analyses', async () => {
    (createClient as Mock).mockResolvedValue(
      createMockSupabase({
        threads: [thread('t1'), thread('t2')],
        analyses: [
          analysis('t1', { is_repair_case: true, sentiment_label: 'negative' }),
          analysis('t2', { is_repair_case: false, sentiment_label: 'positive' }),
        ],
        clinic: { display_name: 'Test Clinic' },
      })
    );

    const result = await getHRNSignals('clinic-1');

    expect(result?.repairCases).toBe(1);
    expect(result?.allThreads.find(t => t.threadUrl.includes('t1'))?.isRepairCase).toBe(true);
    expect(result?.allThreads.find(t => t.threadUrl.includes('t2'))?.isRepairCase).toBe(false);
  });

  // ── Topic aggregation ───────────────────────────────────────────────────────

  it('ranks topTopics by frequency across all thread analyses', async () => {
    (createClient as Mock).mockResolvedValue(
      createMockSupabase({
        threads: [thread('t1'), thread('t2'), thread('t3')],
        analyses: [
          analysis('t1', { main_topics: ['density', 'healing'] }),
          analysis('t2', { main_topics: ['density', 'hairline'] }),
          analysis('t3', { main_topics: ['healing', 'communication'] }),
        ],
        clinic: { display_name: 'Test Clinic' },
      })
    );

    const result = await getHRNSignals('clinic-1');

    // density: 2, healing: 2, hairline: 1, communication: 1
    // The top two must be density and healing (both tied at 2)
    expect(result?.topTopics.slice(0, 2).sort()).toEqual(['density', 'healing']);
    expect(result?.topTopics).toContain('hairline');
    expect(result?.topTopics).toContain('communication');
  });
});
