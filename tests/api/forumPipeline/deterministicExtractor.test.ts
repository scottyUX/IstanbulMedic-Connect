import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Supabase chain helper ─────────────────────────────────────────────────────
// Creates a thenable query-builder mock. The intersection with Record<string, unknown>
// is a valid narrowing of Promise<X> (the intersection is a subtype), so no TS 2352.

type QueryChain = Promise<{ data: unknown; error: unknown }> & Record<string, unknown>

function makeChain(result: { data: unknown; error: unknown }): QueryChain {
  const chain = Promise.resolve(result) as QueryChain
  for (const m of ['select', 'eq', 'neq', 'in', 'upsert', 'insert', 'update', 'single', 'order', 'limit']) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  return chain
}

// ── Supabase mock ─────────────────────────────────────────────────────────────

const { mockFrom, mockCreateClient } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockCreateClient = vi.fn(() => ({ from: mockFrom }))
  return { mockFrom, mockCreateClient }
})

vi.mock('@supabase/supabase-js', () => ({ createClient: mockCreateClient }))

import {
  extractSignalsPreview,
  extractAndStoreSignals,
} from '@/app/api/forumPipeline/deterministicExtractor'

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('extractSignalsPreview (pure — no DB)', () => {
  describe('graft_count', () => {
    it('extracts a simple graft count', () => {
      const signals = extractSignalsPreview('I had 3000 grafts done last year.')
      const s = signals.find(r => r.signal_name === 'graft_count')
      expect(s).toBeDefined()
      expect(s?.signal_value).toBe(3000)
      expect(s?.extraction_method).toBe('regex')
      expect(s?.evidence_snippet).toContain('3000 grafts')
    })

    it('picks the largest count when multiple are mentioned', () => {
      const signals = extractSignalsPreview('Started with 500 grafts, then added 2500 grafts for a total of 3000 grafts.')
      const s = signals.find(r => r.signal_name === 'graft_count')
      expect(s?.signal_value).toBe(3000)
    })

    it('handles comma-formatted counts (e.g. 3,500 grafts)', () => {
      const signals = extractSignalsPreview('Got 3,500 grafts from Dr. X.')
      const s = signals.find(r => r.signal_name === 'graft_count')
      expect(s?.signal_value).toBe(3500)
    })

    it('does not produce graft_count for text without grafts', () => {
      const signals = extractSignalsPreview('Great results overall!')
      expect(signals.find(r => r.signal_name === 'graft_count')).toBeUndefined()
    })
  })

  describe('timeline_markers', () => {
    it('extracts month markers', () => {
      const signals = extractSignalsPreview('At 3 months post-op the shedding stopped.')
      const s = signals.find(r => r.signal_name === 'timeline_markers')
      expect(s).toBeDefined()
      expect(s?.signal_value).toContain('3 months')
      expect(s?.extraction_method).toBe('regex')
    })

    it('extracts year markers', () => {
      const signals = extractSignalsPreview('1 year update: very happy with the results.')
      const s = signals.find(r => r.signal_name === 'timeline_markers')
      expect(s?.signal_value).toContain('1 year')
    })

    it('deduplicates identical markers', () => {
      const signals = extractSignalsPreview('At 6 months and 6 months later it looked great.')
      const s = signals.find(r => r.signal_name === 'timeline_markers')
      const markers = s?.signal_value as string[]
      expect(markers.filter(m => m === '6 months')).toHaveLength(1)
    })

    it('sets has_longterm_update for 6+ month markers', () => {
      const signals = extractSignalsPreview('My 6 month update is here.')
      expect(signals.find(r => r.signal_name === 'has_longterm_update')?.signal_value).toBe(true)
    })

    it('sets has_longterm_update for year markers', () => {
      const signals = extractSignalsPreview('This is my 1 year result.')
      expect(signals.find(r => r.signal_name === 'has_longterm_update')?.signal_value).toBe(true)
    })

    it('does NOT set has_longterm_update for short timelines (< 6 months)', () => {
      const signals = extractSignalsPreview('At 3 months the density is improving.')
      expect(signals.find(r => r.signal_name === 'has_longterm_update')).toBeUndefined()
    })
  })

  describe('issue_keywords', () => {
    it('detects shock_loss', () => {
      const signals = extractSignalsPreview('I experienced shock loss after the procedure.')
      const s = signals.find(r => r.signal_name === 'issue_keywords')
      expect((s?.signal_value as string[]).includes('shock_loss')).toBe(true)
      expect(s?.extraction_method).toBe('keyword')
      expect(s?.evidence_snippet).toBeTruthy()
    })

    it('detects scarring', () => {
      const signals = extractSignalsPreview('There is some scarring on the donor area.')
      const issues = signals.find(r => r.signal_name === 'issue_keywords')?.signal_value as string[]
      expect(issues).toContain('scarring')
    })

    it('detects infection', () => {
      const signals = extractSignalsPreview('I got an infected follicle at week 2.')
      const issues = signals.find(r => r.signal_name === 'issue_keywords')?.signal_value as string[]
      expect(issues).toContain('infection')
    })

    it('detects density concern', () => {
      const signals = extractSignalsPreview('The density looks thin compared to expectations.')
      const issues = signals.find(r => r.signal_name === 'issue_keywords')?.signal_value as string[]
      expect(issues).toContain('density')
    })

    it('detects multiple issues in one post', () => {
      const signals = extractSignalsPreview('Shock loss was bad and the scarring is visible.')
      const issues = signals.find(r => r.signal_name === 'issue_keywords')?.signal_value as string[]
      expect(issues).toContain('shock_loss')
      expect(issues).toContain('scarring')
    })

    it('does not produce issue_keywords for clean posts', () => {
      const signals = extractSignalsPreview('Amazing result, highly recommend the clinic!')
      expect(signals.find(r => r.signal_name === 'issue_keywords')).toBeUndefined()
    })
  })

  describe('is_repair_case', () => {
    it('detects botched repair case', () => {
      const signals = extractSignalsPreview('Looking for clinics to fix a botched procedure from 2 years ago.')
      const s = signals.find(r => r.signal_name === 'is_repair_case')
      expect(s?.signal_value).toBe(true)
      expect(s?.evidence_snippet).toContain('botched')
    })

    it('detects revision keyword', () => {
      const signals = extractSignalsPreview('I need a revision to correct the hairline.')
      expect(signals.find(r => r.signal_name === 'is_repair_case')?.signal_value).toBe(true)
    })

    it('does not flag normal posts as repair cases', () => {
      const signals = extractSignalsPreview('Great experience at IHM, 3000 grafts, very happy!')
      expect(signals.find(r => r.signal_name === 'is_repair_case')).toBeUndefined()
    })
  })

  describe('direct signals (passthrough)', () => {
    it('includes direct signals with method: direct', () => {
      const signals = extractSignalsPreview('Some text', { has_photos: true, reply_count: 42 })
      const photos = signals.find(r => r.signal_name === 'has_photos')
      expect(photos?.signal_value).toBe(true)
      expect(photos?.extraction_method).toBe('direct')
      expect(photos?.evidence_snippet).toBeNull()

      const replies = signals.find(r => r.signal_name === 'reply_count')
      expect(replies?.signal_value).toBe(42)
    })

    it('skips null/undefined direct signals', () => {
      const signals = extractSignalsPreview('text', { has_photos: null, reply_count: undefined })
      expect(signals.find(r => r.signal_name === 'has_photos')).toBeUndefined()
      expect(signals.find(r => r.signal_name === 'reply_count')).toBeUndefined()
    })

    it('includes falsy-but-valid direct signals (e.g. 0)', () => {
      const signals = extractSignalsPreview('text', { reply_count: 0 })
      expect(signals.find(r => r.signal_name === 'reply_count')?.signal_value).toBe(0)
    })
  })

  describe('empty / trivial input', () => {
    it('returns empty array for empty text with no direct signals', () => {
      expect(extractSignalsPreview('')).toHaveLength(0)
    })

    it('uses thread_id: "preview" for all rows', () => {
      const signals = extractSignalsPreview('3000 grafts.')
      expect(signals.every(s => s.thread_id === 'preview')).toBe(true)
    })

    it('sets extraction_version: "v1.0" for all rows', () => {
      const signals = extractSignalsPreview('3000 grafts. Shock loss noticed at 3 months.')
      expect(signals.every(s => s.extraction_version === 'v1.0')).toBe(true)
    })
  })
})

// ── extractAndStoreSignals (DB) ───────────────────────────────────────────────

describe('extractAndStoreSignals', () => {
  const THREAD_ID = 'test-thread-uuid'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns { inserted: 0, errors: 0 } for text with no signals', async () => {
    const result = await extractAndStoreSignals(THREAD_ID, 'Great results overall, very happy!')
    expect(result).toEqual({ inserted: 0, errors: 0 })
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('calls upsert with extracted signal rows', async () => {
    const chain = makeChain({ data: [{ id: 'row-1' }, { id: 'row-2' }], error: null })
    mockFrom.mockReturnValue(chain)

    const result = await extractAndStoreSignals(THREAD_ID, 'I had 3000 grafts and shock loss at 6 months.')

    expect(mockFrom).toHaveBeenCalledWith('forum_thread_signals')
    const upsertCall = chain.upsert as ReturnType<typeof vi.fn>
    expect(upsertCall).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ thread_id: THREAD_ID, signal_name: 'graft_count', signal_value: 3000 }),
        expect.objectContaining({ thread_id: THREAD_ID, signal_name: 'issue_keywords' }),
        expect.objectContaining({ thread_id: THREAD_ID, signal_name: 'timeline_markers' }),
        expect.objectContaining({ thread_id: THREAD_ID, signal_name: 'has_longterm_update', signal_value: true }),
      ]),
      { onConflict: 'thread_id,signal_name' }
    )
    expect(result.inserted).toBe(2)
    expect(result.errors).toBe(0)
  })

  it('returns { inserted: 0, errors: N } when upsert fails', async () => {
    const chain = makeChain({ data: null, error: { message: 'DB error' } })
    mockFrom.mockReturnValue(chain)

    const result = await extractAndStoreSignals(THREAD_ID, '3000 grafts from Dr. X.')
    expect(result.inserted).toBe(0)
    expect(result.errors).toBeGreaterThan(0)
  })

  it('passes direct signals through to the upsert', async () => {
    const chain = makeChain({ data: [{ id: 'r1' }], error: null })
    mockFrom.mockReturnValue(chain)

    await extractAndStoreSignals(THREAD_ID, 'no special text', { has_photos: true })

    const upsertCall = chain.upsert as ReturnType<typeof vi.fn>
    const rows = upsertCall.mock.calls[0][0] as { signal_name: string }[]
    expect(rows.some(r => r.signal_name === 'has_photos')).toBe(true)
  })
})
