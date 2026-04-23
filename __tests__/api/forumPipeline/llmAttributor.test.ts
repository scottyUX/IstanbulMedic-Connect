import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Supabase chain helper ─────────────────────────────────────────────────────

type QueryChain = Promise<{ data: unknown; error: unknown }> & Record<string, unknown>

function makeChain(result: { data: unknown; error: unknown }): QueryChain {
  const chain = Promise.resolve(result) as QueryChain
  for (const m of ['select', 'eq', 'neq', 'in', 'upsert', 'insert', 'update', 'single', 'order', 'limit', 'filter']) {
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

vi.mock('openai', () => {
  class MockOpenAI {
    chat = { completions: { create: mockMessagesCreate } }
  }
  return { default: MockOpenAI }
})

import {
  substringMatch,
  attributeThread,
  loadClinicNames,
  type ClinicNameEntry,
} from '@/app/api/forumPipeline/llmAttributor'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CLINICS: ClinicNameEntry[] = [
  {
    clinicId: 'clinic-ihm',
    displayName: 'Istanbul Hair Medical',
    aliases: ['Dr. Ahmet Yıldız', 'IHM'],
  },
  {
    clinicId: 'clinic-aek',
    displayName: 'AEK Hair Clinic',
    aliases: ['Dr. Burak Aydın'],
  },
  {
    clinicId: 'clinic-short',
    displayName: 'AB',  // only 2 chars — should be ignored
    aliases: [],
  },
]

// ── substringMatch (pure) ─────────────────────────────────────────────────────

describe('substringMatch', () => {
  it('finds a clinic by display name (case-insensitive)', () => {
    const matches = substringMatch('I went to istanbul hair medical last month.', CLINICS)
    expect(matches).toContain('clinic-ihm')
  })

  it('finds a clinic by alias', () => {
    const matches = substringMatch('Dr. Ahmet Yıldız did my surgery.', CLINICS)
    expect(matches).toContain('clinic-ihm')
  })

  it('finds a clinic by short alias (IHM)', () => {
    const matches = substringMatch('IHM has the best results.', CLINICS)
    expect(matches).toContain('clinic-ihm')
  })

  it('is case-insensitive', () => {
    const matches = substringMatch('AEK HAIR CLINIC is great.', CLINICS)
    expect(matches).toContain('clinic-aek')
  })

  it('ignores names shorter than 3 characters', () => {
    const matches = substringMatch('AB is a short name.', CLINICS)
    expect(matches).not.toContain('clinic-short')
  })

  it('returns empty array when no clinic mentioned', () => {
    const matches = substringMatch('Just a random post about hair loss.', CLINICS)
    expect(matches).toHaveLength(0)
  })

  it('returns unique IDs (no duplicates when name + alias both match)', () => {
    // "istanbul hair medical" matches displayName AND body could contain alias too
    const matches = substringMatch('istanbul hair medical — Dr. Ahmet Yıldız.', CLINICS)
    const ihmMatches = matches.filter(id => id === 'clinic-ihm')
    expect(ihmMatches).toHaveLength(1)
  })

  it('can match multiple different clinics in one text', () => {
    const matches = substringMatch('Comparing istanbul hair medical vs AEK hair clinic.', CLINICS)
    expect(matches).toContain('clinic-ihm')
    expect(matches).toContain('clinic-aek')
  })

  it('handles empty text', () => {
    expect(substringMatch('', CLINICS)).toHaveLength(0)
  })

  it('handles empty clinic list', () => {
    expect(substringMatch('istanbul hair medical', [])).toHaveLength(0)
  })
})

// ── attributeThread ───────────────────────────────────────────────────────────

describe('attributeThread', () => {
  const THREAD_ID = 'thread-uuid-123'

  const DEFAULT_LLM_OUTPUT = {
    attributed_clinic_name: 'Istanbul Hair Medical',
    attributed_doctor_name: 'Dr. Ahmet Yıldız',
    sentiment: 'positive',
    satisfaction: 'satisfied',
    main_topics: ['density', 'natural_results'],
    issue_keywords: [],
    is_repair_case: false,
    secondary_clinic_mentions: [],
    evidence_snippets: { sentiment: 'Amazing result' },
    summary: 'Patient had a great experience at IHM with natural results.',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Default: LLM returns valid JSON
    mockMessagesCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(DEFAULT_LLM_OUTPUT) } }],
    })

    // Default Supabase: all writes succeed
    const chain = makeChain({ data: null, error: null })
    mockFrom.mockReturnValue(chain)
  })

  it('returns attributed: true when LLM resolves the clinic', async () => {
    const result = await attributeThread(
      THREAD_ID,
      'My experience at Istanbul Hair Medical',
      'Great results, very happy!',
      'reddit',
      CLINICS
    )
    expect(result.attributed).toBe(true)
    expect(result.clinicId).toBe('clinic-ihm')
    expect(result.error).toBeUndefined()
  })

  it('prefers substring match over LLM attribution when match is unambiguous', async () => {
    // Text contains only one clinic → substring match wins
    const singleMatchText = 'AEK hair clinic was my choice.'
    const llmOutputWithDifferentClinic = {
      ...DEFAULT_LLM_OUTPUT,
      attributed_clinic_name: 'Istanbul Hair Medical', // LLM says IHM
    }
    mockMessagesCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(llmOutputWithDifferentClinic) } }],
    })

    const result = await attributeThread(
      THREAD_ID, 'Title', singleMatchText, 'reddit', CLINICS
    )
    // Substring match found exactly 1 → fastMatchedId = 'clinic-aek'
    expect(result.clinicId).toBe('clinic-aek')
  })

  it('falls back to LLM when substring match is ambiguous (multiple matches)', async () => {
    // Text mentions both clinics → no single substring winner
    const ambiguousText = 'istanbul hair medical vs AEK hair clinic comparison'
    const result = await attributeThread(
      THREAD_ID, 'Comparison', ambiguousText, 'reddit', CLINICS
    )
    // Falls back to LLM which says Istanbul Hair Medical → clinic-ihm
    expect(result.clinicId).toBe('clinic-ihm')
  })

  it('returns attributed: false when LLM call fails', async () => {
    mockMessagesCreate.mockRejectedValueOnce(new Error('Network error'))

    const result = await attributeThread(
      THREAD_ID, 'Title', 'body text', 'reddit', CLINICS
    )
    expect(result.attributed).toBe(false)
    expect(result.clinicId).toBeNull()
    expect(result.error).toBe('LLM call failed')
  })

  it('returns attributed: false when LLM returns invalid JSON', async () => {
    mockMessagesCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'not json at all' } }],
    })

    const result = await attributeThread(
      THREAD_ID, 'Title', 'body text', 'reddit', CLINICS
    )
    expect(result.attributed).toBe(false)
    expect(result.error).toBe('LLM call failed')
  })

  it('returns attributed: false when attributed_clinic_name does not match any clinic', async () => {
    mockMessagesCreate.mockResolvedValueOnce({
      content: [{
        type: 'text',
        text: JSON.stringify({ ...DEFAULT_LLM_OUTPUT, attributed_clinic_name: 'Unknown Clinic XYZ' }),
      }],
    })

    const result = await attributeThread(
      THREAD_ID, 'Some random post', 'No known clinic here', 'reddit', CLINICS
    )
    expect(result.attributed).toBe(false)
    expect(result.clinicId).toBeNull()
  })

  it('inserts a forum_thread_llm_analysis row', async () => {
    const chain = makeChain({ data: null, error: null })
    mockFrom.mockReturnValue(chain)

    await attributeThread(THREAD_ID, 'Title', 'body', 'reddit', CLINICS)

    const insertCalls = (chain.insert as ReturnType<typeof vi.fn>).mock.calls
    expect(insertCalls.length).toBeGreaterThan(0)
    const inserted = insertCalls[0][0] as Record<string, unknown>
    expect(inserted.thread_id).toBe(THREAD_ID)
    expect(inserted.is_current).toBe(true)
    expect(inserted.sentiment_label).toBe('positive')
  })

  it('filters out invalid main_topics not in the allowed list', async () => {
    mockMessagesCreate.mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            ...DEFAULT_LLM_OUTPUT,
            main_topics: ['density', 'INVALID_TOPIC', 'natural_results'],
          }),
        },
      }],
    })

    const chain = makeChain({ data: null, error: null })
    mockFrom.mockReturnValue(chain)

    await attributeThread(THREAD_ID, 'Title', 'body', 'reddit', CLINICS)

    const insertCalls = (chain.insert as ReturnType<typeof vi.fn>).mock.calls
    const inserted = insertCalls[0][0] as Record<string, unknown>
    expect((inserted.main_topics as string[]).includes('INVALID_TOPIC')).toBe(false)
    expect((inserted.main_topics as string[])).toContain('density')
    expect((inserted.main_topics as string[])).toContain('natural_results')
  })

  it('returns error string when insert to forum_thread_llm_analysis fails', async () => {
    // First call (update is_current=false) succeeds, second (insert) fails
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 2) {
        // insert call
        return makeChain({ data: null, error: { message: 'insert error' } })
      }
      return makeChain({ data: null, error: null })
    })

    const result = await attributeThread(THREAD_ID, 'Title', 'body', 'reddit', CLINICS)
    expect(result.error).toBeDefined()
  })
})

// ── loadClinicNames ───────────────────────────────────────────────────────────

describe('loadClinicNames', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty array when no clinics found', async () => {
    const chain = makeChain({ data: [], error: null })
    mockFrom.mockReturnValue(chain)

    const result = await loadClinicNames()
    expect(result).toHaveLength(0)
  })

  it('combines display name with doctor aliases', async () => {
    let callIndex = 0
    mockFrom.mockImplementation(() => {
      callIndex++
      if (callIndex === 1) {
        // clinics query
        return makeChain({ data: [{ id: 'c1', display_name: 'IHM Clinic' }], error: null })
      }
      if (callIndex === 2) {
        // clinic_facts query (instagram aliases)
        return makeChain({ data: [], error: null })
      }
      // clinic_team query
      return makeChain({ data: [{ clinic_id: 'c1', name: 'Dr. Smith' }], error: null })
    })

    const result = await loadClinicNames()
    expect(result).toHaveLength(1)
    expect(result[0].clinicId).toBe('c1')
    expect(result[0].displayName).toBe('IHM Clinic')
    expect(result[0].aliases).toContain('Dr. Smith')
  })

  it('parses instagram variant aliases from clinic_facts', async () => {
    let callIndex = 0
    mockFrom.mockImplementation(() => {
      callIndex++
      if (callIndex === 1) {
        return makeChain({ data: [{ id: 'c1', display_name: 'IHM' }], error: null })
      }
      if (callIndex === 2) {
        return makeChain({
          data: [{ clinic_id: 'c1', fact_value: JSON.stringify(['IHM Hair', 'Istanbul Medical']) }],
          error: null,
        })
      }
      return makeChain({ data: [], error: null })
    })

    const result = await loadClinicNames()
    expect(result[0].aliases).toContain('IHM Hair')
    expect(result[0].aliases).toContain('Istanbul Medical')
  })

  it('gracefully skips malformed clinic_facts JSON', async () => {
    let callIndex = 0
    mockFrom.mockImplementation(() => {
      callIndex++
      if (callIndex === 1) return makeChain({ data: [{ id: 'c1', display_name: 'IHM' }], error: null })
      if (callIndex === 2) {
        return makeChain({ data: [{ clinic_id: 'c1', fact_value: 'not-json{{' }], error: null })
      }
      return makeChain({ data: [], error: null })
    })

    const result = await loadClinicNames()
    // Should still return the clinic, just without extra aliases
    expect(result).toHaveLength(1)
    expect(result[0].aliases).toHaveLength(0)
  })
})
