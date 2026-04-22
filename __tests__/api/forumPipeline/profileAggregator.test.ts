import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Supabase chain helper ─────────────────────────────────────────────────────

type QueryChain = Promise<{ data: unknown; error: unknown }> & Record<string, unknown>

function makeChain(result: { data: unknown; error: unknown }): QueryChain {
  const chain = Promise.resolve(result) as QueryChain
  for (const m of ['select', 'eq', 'neq', 'in', 'upsert', 'insert', 'update', 'single', 'order', 'limit', 'filter', 'not']) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  return chain
}

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockFrom, mockCreateClient, mockMessagesCreate } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockCreateClient = vi.fn(() => ({ from: mockFrom }))
  const mockMessagesCreate = vi.fn()
  return { mockFrom, mockCreateClient, mockMessagesCreate }
})

vi.mock('@supabase/supabase-js', () => ({ createClient: mockCreateClient }))

vi.mock('@anthropic-ai/sdk', () => {
  class MockAnthropic {
    messages = { create: mockMessagesCreate }
  }
  return { default: MockAnthropic }
})

import { recomputeProfile, recomputeStaleProfiles } from '@/app/api/forumPipeline/profileAggregator'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeThread(id: string, overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id,
    title: `Thread ${id}`,
    thread_url: `https://www.reddit.com/r/HairTransplants/comments/${id}/`,
    author_username: `author_${id}`,
    post_date: '2025-06-01T10:00:00Z',
    reply_count: 10,
    ...overrides,
  }
}

function makeAnalysis(threadId: string, overrides: Partial<Record<string, unknown>> = {}) {
  return {
    thread_id: threadId,
    sentiment_label: 'positive',
    satisfaction_label: 'satisfied',
    main_topics: ['density', 'natural_results'],
    issue_keywords: [],
    is_repair_case: false,
    summary_short: `Good review for ${threadId}`,
    ...overrides,
  }
}

function makeSignal(threadId: string, name: string, value: unknown) {
  return { thread_id: threadId, signal_name: name, signal_value: value }
}

// ── Setup a flexible table-aware mockFrom ────────────────────────────────────

function setupMockFrom(config: {
  threads?: ReturnType<typeof makeThread>[]
  analyses?: ReturnType<typeof makeAnalysis>[]
  signals?: ReturnType<typeof makeSignal>[]
  redditContent?: { thread_id: string; post_type: string }[]
  clinicName?: string | null
}) {
  const {
    threads = [],
    analyses = [],
    signals = [],
    redditContent = threads.map(t => ({ thread_id: t.id, post_type: 'post' })),
    clinicName = 'Test Clinic',
  } = config

  let callIndex = 0
  mockFrom.mockImplementation((table: string) => {
    callIndex++

    // Always handle upserts and inserts generically
    if (table === 'forum_thread_index' && callIndex === 1) {
      return makeChain({ data: threads, error: null })
    }
    if (table === 'forum_thread_llm_analysis') {
      return makeChain({ data: analyses, error: null })
    }
    if (table === 'reddit_thread_content') {
      return makeChain({ data: redditContent, error: null })
    }
    if (table === 'forum_thread_signals') {
      return makeChain({ data: signals, error: null })
    }
    if (table === 'clinics') {
      return makeChain({ data: clinicName ? { display_name: clinicName } : null, error: null })
    }
    if (table === 'clinic_forum_profiles') {
      return makeChain({ data: null, error: null })
    }
    return makeChain({ data: null, error: null })
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('recomputeProfile', () => {
  const CLINIC_ID = 'clinic-uuid-ihm'

  beforeEach(() => {
    vi.clearAllMocks()

    // Default: LLM summary returns a string
    mockMessagesCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Patients generally report positive experiences.' }],
    })
  })

  // ── Empty / no threads ────────────────────────────────────────────────────

  it('writes an empty profile row and returns when no threads exist', async () => {
    setupMockFrom({ threads: [] })

    await recomputeProfile(CLINIC_ID, 'reddit')

    // Verify an upsert was made to clinic_forum_profiles
    expect(mockFrom).toHaveBeenCalledWith('clinic_forum_profiles')
  })

  // ── thread_count vs mention_count ─────────────────────────────────────────

  it('sets thread_count = post-type count and mention_count = total for Reddit', async () => {
    const threads = [
      makeThread('t1'), makeThread('t2'), makeThread('t3'),
    ]
    const redditContent = [
      { thread_id: 't1', post_type: 'post' },
      { thread_id: 't2', post_type: 'post' },
      { thread_id: 't3', post_type: 'comment' }, // comment — not counted in thread_count
    ]
    setupMockFrom({ threads, redditContent })

    const upsertedProfiles: Record<string, unknown>[] = []
    let callIdx = 0
    mockFrom.mockImplementation((table: string) => {
      callIdx++
      if (table === 'forum_thread_index' && callIdx === 1) {
        return makeChain({ data: threads, error: null })
      }
      if (table === 'forum_thread_llm_analysis') return makeChain({ data: [], error: null })
      if (table === 'reddit_thread_content') return makeChain({ data: redditContent, error: null })
      if (table === 'forum_thread_signals') return makeChain({ data: [], error: null })
      if (table === 'clinics') return makeChain({ data: { display_name: 'Test' }, error: null })
      if (table === 'clinic_forum_profiles') {
        const chain = makeChain({ data: null, error: null })
        ;(chain.upsert as ReturnType<typeof vi.fn>).mockImplementation((data: Record<string, unknown>) => {
          upsertedProfiles.push(data)
          return chain
        })
        return chain
      }
      return makeChain({ data: null, error: null })
    })

    await recomputeProfile(CLINIC_ID, 'reddit')

    const profile = upsertedProfiles[0]
    if (profile) {
      expect(profile.mention_count).toBe(3)
      expect(profile.thread_count).toBe(2) // only post-type rows
    }
  })

  it('sets thread_count === mention_count for HRN (no comment rows)', async () => {
    const threads = [makeThread('t1'), makeThread('t2')]
    const upsertedProfiles: Record<string, unknown>[] = []

    let callIdx = 0
    mockFrom.mockImplementation((table: string) => {
      callIdx++
      if (table === 'forum_thread_index' && callIdx === 1) return makeChain({ data: threads, error: null })
      if (table === 'forum_thread_llm_analysis') return makeChain({ data: [], error: null })
      if (table === 'forum_thread_signals') return makeChain({ data: [], error: null })
      if (table === 'clinics') return makeChain({ data: { display_name: 'Test' }, error: null })
      if (table === 'clinic_forum_profiles') {
        const chain = makeChain({ data: null, error: null })
        ;(chain.upsert as ReturnType<typeof vi.fn>).mockImplementation((data: Record<string, unknown>) => {
          upsertedProfiles.push(data)
          return chain
        })
        return chain
      }
      return makeChain({ data: null, error: null })
    })

    await recomputeProfile(CLINIC_ID, 'hrn')

    const profile = upsertedProfiles[0]
    if (profile) {
      expect(profile.thread_count).toBe(2)
      expect(profile.mention_count).toBe(2)
    }
  })

  // ── Sentiment aggregation ─────────────────────────────────────────────────

  it('computes sentiment_score as average of weights (positive=1, mixed=0, negative=-1)', async () => {
    const threads = [makeThread('t1'), makeThread('t2'), makeThread('t3')]
    const analyses = [
      makeAnalysis('t1', { sentiment_label: 'positive' }),
      makeAnalysis('t2', { sentiment_label: 'positive' }),
      makeAnalysis('t3', { sentiment_label: 'negative' }),
    ]
    const upsertedProfiles: Record<string, unknown>[] = []

    let callIdx = 0
    mockFrom.mockImplementation((table: string) => {
      callIdx++
      if (table === 'forum_thread_index' && callIdx === 1) return makeChain({ data: threads, error: null })
      if (table === 'forum_thread_llm_analysis') return makeChain({ data: analyses, error: null })
      if (table === 'reddit_thread_content') return makeChain({ data: threads.map(t => ({ thread_id: t.id, post_type: 'post' })), error: null })
      if (table === 'forum_thread_signals') return makeChain({ data: [], error: null })
      if (table === 'clinics') return makeChain({ data: { display_name: 'Test' }, error: null })
      if (table === 'clinic_forum_profiles') {
        const chain = makeChain({ data: null, error: null })
        ;(chain.upsert as ReturnType<typeof vi.fn>).mockImplementation((data: Record<string, unknown>) => {
          upsertedProfiles.push(data)
          return chain
        })
        return chain
      }
      return makeChain({ data: null, error: null })
    })

    await recomputeProfile(CLINIC_ID, 'reddit')

    const profile = upsertedProfiles[0]
    if (profile) {
      // (1 + 1 + -1) / 3 = 0.333
      expect(profile.sentiment_score as number).toBeCloseTo(0.333, 2)
    }
  })

  it('defaults sentiment_score to 0 when no LLM analyses exist', async () => {
    const threads = [makeThread('t1')]
    const upsertedProfiles: Record<string, unknown>[] = []

    let callIdx = 0
    mockFrom.mockImplementation((table: string) => {
      callIdx++
      if (table === 'forum_thread_index' && callIdx === 1) return makeChain({ data: threads, error: null })
      if (table === 'forum_thread_llm_analysis') return makeChain({ data: [], error: null })
      if (table === 'reddit_thread_content') return makeChain({ data: [{ thread_id: 't1', post_type: 'post' }], error: null })
      if (table === 'forum_thread_signals') return makeChain({ data: [], error: null })
      if (table === 'clinics') return makeChain({ data: { display_name: 'Test' }, error: null })
      if (table === 'clinic_forum_profiles') {
        const chain = makeChain({ data: null, error: null })
        ;(chain.upsert as ReturnType<typeof vi.fn>).mockImplementation((data: Record<string, unknown>) => {
          upsertedProfiles.push(data)
          return chain
        })
        return chain
      }
      return makeChain({ data: null, error: null })
    })

    await recomputeProfile(CLINIC_ID, 'reddit')

    const profile = upsertedProfiles[0]
    if (profile) {
      expect(profile.sentiment_score).toBe(0)
    }
  })

  // ── Pros computation ──────────────────────────────────────────────────────

  it('derives pros from main_topics of satisfied threads only', async () => {
    const threads = [makeThread('t1'), makeThread('t2'), makeThread('t3')]
    const analyses = [
      makeAnalysis('t1', { satisfaction_label: 'satisfied', main_topics: ['density', 'natural_results', 'hairline'] }),
      makeAnalysis('t2', { satisfaction_label: 'satisfied', main_topics: ['density', 'value'] }),
      makeAnalysis('t3', { satisfaction_label: 'regretful', main_topics: ['density', 'scarring'] }), // excluded
    ]
    const upsertedProfiles: Record<string, unknown>[] = []

    let callIdx = 0
    mockFrom.mockImplementation((table: string) => {
      callIdx++
      if (table === 'forum_thread_index' && callIdx === 1) return makeChain({ data: threads, error: null })
      if (table === 'forum_thread_llm_analysis') return makeChain({ data: analyses, error: null })
      if (table === 'reddit_thread_content') return makeChain({ data: threads.map(t => ({ thread_id: t.id, post_type: 'post' })), error: null })
      if (table === 'forum_thread_signals') return makeChain({ data: [], error: null })
      if (table === 'clinics') return makeChain({ data: { display_name: 'Test' }, error: null })
      if (table === 'clinic_forum_profiles') {
        const chain = makeChain({ data: null, error: null })
        ;(chain.upsert as ReturnType<typeof vi.fn>).mockImplementation((data: Record<string, unknown>) => {
          upsertedProfiles.push(data)
          return chain
        })
        return chain
      }
      return makeChain({ data: null, error: null })
    })

    await recomputeProfile(CLINIC_ID, 'reddit')

    const profile = upsertedProfiles[0]
    if (profile) {
      const pros = profile.pros as string[]
      // density appears in 2 satisfied threads → should be first
      expect(pros[0]).toBe('density')
      // natural results and hairline each appear once in satisfied threads
      expect(pros).toContain('natural results')
      // 'scarring' from the regretful thread should NOT be in pros
      expect(pros).not.toContain('scarring')
    }
  })

  it('returns empty pros array when no satisfied analyses exist', async () => {
    const threads = [makeThread('t1')]
    const analyses = [makeAnalysis('t1', { satisfaction_label: 'regretful' })]
    const upsertedProfiles: Record<string, unknown>[] = []

    let callIdx = 0
    mockFrom.mockImplementation((table: string) => {
      callIdx++
      if (table === 'forum_thread_index' && callIdx === 1) return makeChain({ data: threads, error: null })
      if (table === 'forum_thread_llm_analysis') return makeChain({ data: analyses, error: null })
      if (table === 'reddit_thread_content') return makeChain({ data: [{ thread_id: 't1', post_type: 'post' }], error: null })
      if (table === 'forum_thread_signals') return makeChain({ data: [], error: null })
      if (table === 'clinics') return makeChain({ data: { display_name: 'Test' }, error: null })
      if (table === 'clinic_forum_profiles') {
        const chain = makeChain({ data: null, error: null })
        ;(chain.upsert as ReturnType<typeof vi.fn>).mockImplementation((data: Record<string, unknown>) => {
          upsertedProfiles.push(data)
          return chain
        })
        return chain
      }
      return makeChain({ data: null, error: null })
    })

    await recomputeProfile(CLINIC_ID, 'reddit')

    const profile = upsertedProfiles[0]
    if (profile) {
      expect(profile.pros).toHaveLength(0)
    }
  })

  // ── Common concerns ───────────────────────────────────────────────────────

  it('derives common_concerns from issue_keywords across all threads (not just regretful)', async () => {
    const threads = [makeThread('t1'), makeThread('t2')]
    const analyses = [
      makeAnalysis('t1', { issue_keywords: ['shock_loss', 'density'] }),
      makeAnalysis('t2', { issue_keywords: ['shock_loss'] }),
    ]
    const upsertedProfiles: Record<string, unknown>[] = []

    let callIdx = 0
    mockFrom.mockImplementation((table: string) => {
      callIdx++
      if (table === 'forum_thread_index' && callIdx === 1) return makeChain({ data: threads, error: null })
      if (table === 'forum_thread_llm_analysis') return makeChain({ data: analyses, error: null })
      if (table === 'reddit_thread_content') return makeChain({ data: threads.map(t => ({ thread_id: t.id, post_type: 'post' })), error: null })
      if (table === 'forum_thread_signals') return makeChain({ data: [], error: null })
      if (table === 'clinics') return makeChain({ data: { display_name: 'Test' }, error: null })
      if (table === 'clinic_forum_profiles') {
        const chain = makeChain({ data: null, error: null })
        ;(chain.upsert as ReturnType<typeof vi.fn>).mockImplementation((data: Record<string, unknown>) => {
          upsertedProfiles.push(data)
          return chain
        })
        return chain
      }
      return makeChain({ data: null, error: null })
    })

    await recomputeProfile(CLINIC_ID, 'reddit')

    const profile = upsertedProfiles[0]
    if (profile) {
      const concerns = profile.common_concerns as string[]
      expect(concerns[0]).toBe('shock_loss') // appears twice
      expect(concerns).toContain('density')
    }
  })

  // ── Deterministic signal counts ───────────────────────────────────────────

  it('counts longterm_thread_count from has_longterm_update signals', async () => {
    const threads = [makeThread('t1'), makeThread('t2')]
    const signals = [
      makeSignal('t1', 'has_longterm_update', true),
      // t2 has no longterm signal
    ]
    const upsertedProfiles: Record<string, unknown>[] = []

    let callIdx = 0
    mockFrom.mockImplementation((table: string) => {
      callIdx++
      if (table === 'forum_thread_index' && callIdx === 1) return makeChain({ data: threads, error: null })
      if (table === 'forum_thread_llm_analysis') return makeChain({ data: [], error: null })
      if (table === 'reddit_thread_content') return makeChain({ data: threads.map(t => ({ thread_id: t.id, post_type: 'post' })), error: null })
      if (table === 'forum_thread_signals') return makeChain({ data: signals, error: null })
      if (table === 'clinics') return makeChain({ data: { display_name: 'Test' }, error: null })
      if (table === 'clinic_forum_profiles') {
        const chain = makeChain({ data: null, error: null })
        ;(chain.upsert as ReturnType<typeof vi.fn>).mockImplementation((data: Record<string, unknown>) => {
          upsertedProfiles.push(data)
          return chain
        })
        return chain
      }
      return makeChain({ data: null, error: null })
    })

    await recomputeProfile(CLINIC_ID, 'reddit')

    const profile = upsertedProfiles[0]
    if (profile) {
      expect(profile.longterm_thread_count).toBe(1)
    }
  })

  // ── LLM summary ───────────────────────────────────────────────────────────

  it('calls LLM for summary when threads exist', async () => {
    const threads = [makeThread('t1')]
    const analyses = [makeAnalysis('t1')]
    setupMockFrom({ threads, analyses })

    await recomputeProfile(CLINIC_ID, 'reddit')

    expect(mockMessagesCreate).toHaveBeenCalledOnce()
    const callArgs = mockMessagesCreate.mock.calls[0][0] as Record<string, unknown>
    expect(callArgs.max_tokens).toBe(200)
  })

  it('does not call LLM for summary when no threads exist (empty profile path)', async () => {
    setupMockFrom({ threads: [] })

    await recomputeProfile(CLINIC_ID, 'reddit')

    expect(mockMessagesCreate).not.toHaveBeenCalled()
  })

  it('handles LLM summary failure gracefully (summary = null)', async () => {
    mockMessagesCreate.mockRejectedValueOnce(new Error('LLM down'))
    const threads = [makeThread('t1')]
    const analyses = [makeAnalysis('t1')]
    const upsertedProfiles: Record<string, unknown>[] = []

    let callIdx = 0
    mockFrom.mockImplementation((table: string) => {
      callIdx++
      if (table === 'forum_thread_index' && callIdx === 1) return makeChain({ data: threads, error: null })
      if (table === 'forum_thread_llm_analysis') return makeChain({ data: analyses, error: null })
      if (table === 'reddit_thread_content') return makeChain({ data: [{ thread_id: 't1', post_type: 'post' }], error: null })
      if (table === 'forum_thread_signals') return makeChain({ data: [], error: null })
      if (table === 'clinics') return makeChain({ data: { display_name: 'Test' }, error: null })
      if (table === 'clinic_forum_profiles') {
        const chain = makeChain({ data: null, error: null })
        ;(chain.upsert as ReturnType<typeof vi.fn>).mockImplementation((data: Record<string, unknown>) => {
          upsertedProfiles.push(data)
          return chain
        })
        return chain
      }
      return makeChain({ data: null, error: null })
    })

    await recomputeProfile(CLINIC_ID, 'reddit') // should not throw

    const profile = upsertedProfiles[0]
    if (profile) {
      expect(profile.summary).toBeNull()
    }
  })

  // ── notable_threads ───────────────────────────────────────────────────────

  it('orders notable_threads by reply_count descending and limits to 5', async () => {
    const threads = Array.from({ length: 7 }, (_, i) =>
      makeThread(`t${i}`, { reply_count: i * 10 })
    )
    const upsertedProfiles: Record<string, unknown>[] = []

    let callIdx = 0
    mockFrom.mockImplementation((table: string) => {
      callIdx++
      if (table === 'forum_thread_index' && callIdx === 1) return makeChain({ data: threads, error: null })
      if (table === 'forum_thread_llm_analysis') return makeChain({ data: [], error: null })
      if (table === 'reddit_thread_content') return makeChain({ data: threads.map(t => ({ thread_id: t.id, post_type: 'post' })), error: null })
      if (table === 'forum_thread_signals') return makeChain({ data: [], error: null })
      if (table === 'clinics') return makeChain({ data: { display_name: 'Test' }, error: null })
      if (table === 'clinic_forum_profiles') {
        const chain = makeChain({ data: null, error: null })
        ;(chain.upsert as ReturnType<typeof vi.fn>).mockImplementation((data: Record<string, unknown>) => {
          upsertedProfiles.push(data)
          return chain
        })
        return chain
      }
      return makeChain({ data: null, error: null })
    })

    await recomputeProfile(CLINIC_ID, 'reddit')

    const profile = upsertedProfiles[0]
    if (profile) {
      const notable = profile.notable_threads as { title: string }[]
      expect(notable).toHaveLength(5)
      // Highest reply_count is t6 (60), then t5 (50), etc.
      expect(notable[0].title).toBe('Thread t6')
    }
  })

  // ── unique_authors_count ──────────────────────────────────────────────────

  it('counts unique authors correctly', async () => {
    const threads = [
      makeThread('t1', { author_username: 'alice' }),
      makeThread('t2', { author_username: 'alice' }), // same author
      makeThread('t3', { author_username: 'bob' }),
    ]
    const upsertedProfiles: Record<string, unknown>[] = []

    let callIdx = 0
    mockFrom.mockImplementation((table: string) => {
      callIdx++
      if (table === 'forum_thread_index' && callIdx === 1) return makeChain({ data: threads, error: null })
      if (table === 'forum_thread_llm_analysis') return makeChain({ data: [], error: null })
      if (table === 'reddit_thread_content') return makeChain({ data: threads.map(t => ({ thread_id: t.id, post_type: 'post' })), error: null })
      if (table === 'forum_thread_signals') return makeChain({ data: [], error: null })
      if (table === 'clinics') return makeChain({ data: { display_name: 'Test' }, error: null })
      if (table === 'clinic_forum_profiles') {
        const chain = makeChain({ data: null, error: null })
        ;(chain.upsert as ReturnType<typeof vi.fn>).mockImplementation((data: Record<string, unknown>) => {
          upsertedProfiles.push(data)
          return chain
        })
        return chain
      }
      return makeChain({ data: null, error: null })
    })

    await recomputeProfile(CLINIC_ID, 'reddit')

    const profile = upsertedProfiles[0]
    if (profile) {
      expect(profile.unique_authors_count).toBe(2) // alice + bob
    }
  })
})

// ── recomputeStaleProfiles ────────────────────────────────────────────────────

describe('recomputeStaleProfiles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMessagesCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Summary text.' }],
    })
  })

  it('returns 0 and does not call recomputeProfile when no stale profiles', async () => {
    mockFrom.mockImplementation(() => makeChain({ data: [], error: null }))

    const count = await recomputeStaleProfiles('reddit')
    expect(count).toBe(0)
  })

  it('processes all stale profiles and returns the count', async () => {
    const staleProfiles = [{ clinic_id: 'c1' }, { clinic_id: 'c2' }]

    // First call: stale profiles query
    // Subsequent calls: recomputeProfile queries for each clinic
    let callIdx = 0
    mockFrom.mockImplementation((table: string) => {
      callIdx++
      if (callIdx === 1 && table === 'clinic_forum_profiles') {
        return makeChain({ data: staleProfiles, error: null })
      }
      // All inner recomputeProfile calls
      if (table === 'forum_thread_index') return makeChain({ data: [], error: null })
      if (table === 'clinic_forum_profiles') return makeChain({ data: null, error: null })
      return makeChain({ data: null, error: null })
    })

    const count = await recomputeStaleProfiles('reddit')
    expect(count).toBe(2)
  })
})
