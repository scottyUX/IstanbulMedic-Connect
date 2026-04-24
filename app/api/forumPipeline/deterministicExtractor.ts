/**
 * Deterministic signal extraction — regex and keyword matching.
 * Upserts to forum_thread_signals with evidence_snippet per signal.
 *
 * Design principle: every signal here is transparent and citable.
 * No LLM involvement — rules only.
 */

import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── Signal definitions ────────────────────────────────────────────────────────

const ISSUE_KEYWORDS: Record<string, string[]> = {
  shock_loss:   ['shock loss', 'shockloss', 'shock hair loss'],
  scarring:     ['scar', 'scarring', 'keloid'],
  infection:    ['infect', 'infection', 'infected'],
  density:      ['density', 'thin', 'sparse', 'patchy'],
  hairline:     ['hairline', 'hair line', 'design', 'asymmetr'],
  repair_topic: ['repair', 'revision', 'fix', 'botched', 'corrective'],
  donor_damage: ['donor damage', 'overharvest', 'over-harvest', 'depleted donor'],
  necrosis:     ['necrosis', 'necrotic'],
}

const REPAIR_KEYWORDS = ['repair', 'revision', 'botched', 'fix', 'corrective', 'rescue']

const GRAFT_REGEX = /\b(\d[\d,]{0,5})\s*grafts?\b/gi
const TIMELINE_REGEX = /\b(\d+)\s*(month|year)s?\b/gi

// ── Core extraction ───────────────────────────────────────────────────────────

interface SignalRow {
  thread_id: string
  signal_name: string
  signal_value: unknown
  evidence_snippet: string | null
  extraction_method: 'regex' | 'keyword' | 'direct'
  extraction_version: string
}

function extractSignals(
  text: string,
  threadId: string,
  directSignals: Record<string, unknown> = {}
): SignalRow[] {
  const rows: SignalRow[] = []
  const lowerText = text.toLowerCase()

  // ── Graft count (regex) ──────────────────────────────────────────────────
  const graftMatches = [...text.matchAll(GRAFT_REGEX)]
  if (graftMatches.length > 0) {
    // Use the most specific (largest number mentioned — usually the total)
    const counts = graftMatches.map(m => parseInt(m[1].replace(/,/g, '')))
    const maxCount = Math.max(...counts)
    rows.push({
      thread_id: threadId,
      signal_name: 'graft_count',
      signal_value: maxCount,
      evidence_snippet: graftMatches[0][0],
      extraction_method: 'regex',
      extraction_version: 'v1.0',
    })
  }

  // ── Timeline markers (regex) ─────────────────────────────────────────────
  const timelineMatches = [...text.matchAll(TIMELINE_REGEX)]
  if (timelineMatches.length > 0) {
    const markers = [...new Set(timelineMatches.map(m => `${m[1]} ${m[2]}${parseInt(m[1]) !== 1 ? 's' : ''}`))]
    rows.push({
      thread_id: threadId,
      signal_name: 'timeline_markers',
      signal_value: markers,
      evidence_snippet: timelineMatches[0][0],
      extraction_method: 'regex',
      extraction_version: 'v1.0',
    })
    // Longterm flag — 6+ month marker
    const hasLongterm = timelineMatches.some(m => {
      const n = parseInt(m[1])
      const unit = m[2]
      return (unit === 'month' && n >= 6) || unit === 'year'
    })
    if (hasLongterm) {
      rows.push({
        thread_id: threadId,
        signal_name: 'has_longterm_update',
        signal_value: true,
        evidence_snippet: timelineMatches.find(m => {
          const n = parseInt(m[1]); const unit = m[2]
          return (unit === 'month' && n >= 6) || unit === 'year'
        })?.[0] ?? null,
        extraction_method: 'regex',
        extraction_version: 'v1.0',
      })
    }
  }

  // ── Issue keywords ───────────────────────────────────────────────────────
  const foundIssues: string[] = []
  let issueSnippet: string | null = null
  for (const [issueKey, terms] of Object.entries(ISSUE_KEYWORDS)) {
    const matchedTerm = terms.find(t => lowerText.includes(t))
    if (matchedTerm) {
      foundIssues.push(issueKey)
      if (!issueSnippet) {
        const idx = lowerText.indexOf(matchedTerm)
        issueSnippet = text.slice(Math.max(0, idx - 20), idx + matchedTerm.length + 30)
      }
    }
  }
  if (foundIssues.length > 0) {
    rows.push({
      thread_id: threadId,
      signal_name: 'issue_keywords',
      signal_value: foundIssues,
      evidence_snippet: issueSnippet,
      extraction_method: 'keyword',
      extraction_version: 'v1.0',
    })
  }

  // ── Repair/revision flag ─────────────────────────────────────────────────
  const repairTerm = REPAIR_KEYWORDS.find(k => lowerText.includes(k))
  if (repairTerm) {
    const idx = lowerText.indexOf(repairTerm)
    rows.push({
      thread_id: threadId,
      signal_name: 'is_repair_case',
      signal_value: true,
      evidence_snippet: text.slice(Math.max(0, idx - 20), idx + repairTerm.length + 30),
      extraction_method: 'keyword',
      extraction_version: 'v1.0',
    })
  }

  // ── Direct signals (from scraper metadata) ───────────────────────────────
  for (const [name, value] of Object.entries(directSignals)) {
    if (value !== null && value !== undefined) {
      rows.push({
        thread_id: threadId,
        signal_name: name,
        signal_value: value,
        evidence_snippet: null,
        extraction_method: 'direct',
        extraction_version: 'v1.0',
      })
    }
  }

  return rows
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Extracts signals from thread text and upserts them to forum_thread_signals.
 * Idempotent via UNIQUE (thread_id, signal_name).
 *
 * @param threadId   UUID of the forum_thread_index row
 * @param text       The main text to extract signals from (op_text or body)
 * @param directSignals  Pre-computed signals from the scraper (e.g. has_photos, reply_count)
 */
export async function extractAndStoreSignals(
  threadId: string,
  text: string,
  directSignals: Record<string, unknown> = {}
): Promise<{ inserted: number; errors: number }> {
  const supabase = getSupabaseAdmin()
  const rows = extractSignals(text, threadId, directSignals)

  if (rows.length === 0) return { inserted: 0, errors: 0 }

  const { data, error } = await supabase
    .from('forum_thread_signals')
    .upsert(rows, { onConflict: 'thread_id,signal_name' })
    .select('id')

  if (error) {
    console.error('[deterministicExtractor] upsert error:', error)
    return { inserted: 0, errors: rows.length }
  }

  return { inserted: data?.length ?? 0, errors: 0 }
}

/** Returns extracted signals without writing to DB — for testing */
export function extractSignalsPreview(
  text: string,
  directSignals: Record<string, unknown> = {}
): ReturnType<typeof extractSignals> {
  return extractSignals(text, 'preview', directSignals)
}
