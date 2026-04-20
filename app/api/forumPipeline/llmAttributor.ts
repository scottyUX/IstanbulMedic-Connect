/**
 * LLM attribution and analysis for forum threads.
 * Processes unattributed threads (clinic_id IS NULL) and:
 *   1. Determines which clinic/doctor the thread is about
 *   2. Extracts sentiment, topics, issues, summary
 *   3. Writes to forum_thread_llm_analysis
 *   4. Updates forum_thread_index.clinic_id when attribution succeeds
 *   5. Marks clinic_forum_profiles as stale
 *
 * Uses claude-haiku-4-5-20251001 (~$0.0003/thread).
 * Stored separate from deterministic signals because all fields come from one
 * prompt call and need versioning together (is_current flag).
 */

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const PROMPT_VERSION = 'v1.0'
const MODEL_NAME = process.env.FORUM_LLM_MODEL ?? 'claude-haiku-4-5-20251001'
const MAX_TEXT_CHARS = 2500 // truncate long posts before sending to LLM

const VALID_TOPICS = [
  'density', 'hairline', 'donor_area', 'healing', 'communication',
  'value', 'doctor_involvement', 'technician_quality', 'aftercare',
  'natural_results', 'other',
] as const

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ClinicNameEntry {
  clinicId: string
  displayName: string
  aliases: string[]      // doctor names, display_name_variants_instagram, etc.
}

interface LlmOutput {
  attributed_clinic_name: string | null
  attributed_doctor_name: string | null
  sentiment: 'positive' | 'mixed' | 'negative'
  satisfaction: 'satisfied' | 'mixed' | 'regretful'
  main_topics: string[]
  issue_keywords: string[]
  is_repair_case: boolean
  secondary_clinic_mentions: {
    clinic_name: string
    doctor_name: string | null
    role: 'mentioned' | 'compared' | 'repair_source'
    evidence: string
  }[]
  evidence_snippets: Record<string, string>
  summary: string
}

// ── Clinic name normalisation ─────────────────────────────────────────────────

const STRIP_SUFFIXES = [
  'hair transplant', 'hair clinic', 'hair center', 'hair centre',
  'transplant', 'clinic', 'center', 'centre', 'hospital',
  'istanbul', 'turkey', 'türkiye',
]

function normalizeName(name: string): string {
  let n = name.toLowerCase().trim()
  // Remove diacritics
  n = n.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  // Remove punctuation
  n = n.replace(/[.,\-']/g, ' ')
  // Strip common suffixes iteratively
  let changed = true
  while (changed) {
    changed = false
    for (const suffix of STRIP_SUFFIXES) {
      if (n.endsWith(' ' + suffix)) {
        n = n.slice(0, n.length - suffix.length - 1).trim()
        changed = true
      }
    }
  }
  return n.trim()
}

/** Fast substring match — free, no LLM. Returns matched clinic IDs. */
export function substringMatch(text: string, clinics: ClinicNameEntry[]): string[] {
  const lowerText = text.toLowerCase()
  const matched: string[] = []
  for (const clinic of clinics) {
    const namesToCheck = [clinic.displayName, ...clinic.aliases]
    for (const name of namesToCheck) {
      const norm = normalizeName(name)
      if (norm.length >= 3 && lowerText.includes(norm)) {
        matched.push(clinic.clinicId)
        break
      }
    }
  }
  return [...new Set(matched)]
}

/** Resolve an LLM-attributed name back to a clinic ID */
function resolveClinicName(
  name: string | null,
  clinics: ClinicNameEntry[]
): string | null {
  if (!name) return null
  const norm = normalizeName(name)
  for (const clinic of clinics) {
    const namesToCheck = [clinic.displayName, ...clinic.aliases]
    for (const n of namesToCheck) {
      if (normalizeName(n) === norm || normalizeName(n).includes(norm) || norm.includes(normalizeName(n))) {
        return clinic.clinicId
      }
    }
  }
  return null
}

// ── LLM call ──────────────────────────────────────────────────────────────────

function truncateText(text: string): string {
  if (text.length <= MAX_TEXT_CHARS) return text
  // Try to cut at a paragraph boundary
  const cut = text.slice(0, MAX_TEXT_CHARS)
  const lastPara = cut.lastIndexOf('\n\n')
  if (lastPara > MAX_TEXT_CHARS * 0.7) return cut.slice(0, lastPara) + '\n[truncated]'
  return cut + '... [truncated]'
}

function buildPrompt(title: string, body: string, clinicNames: string[]): string {
  const text = truncateText([title, body].filter(Boolean).join('\n\n'))
  const clinicList = clinicNames.slice(0, 50).join(', ')

  return `You are analyzing a forum post about hair transplants or medical tourism.

Clinic/doctor list (match only to these): ${clinicList}

Post:
"""
${text}
"""

Respond ONLY with valid JSON matching this exact schema (no markdown, no extra text):
{
  "attributed_clinic_name": "<exact name from list, or null>",
  "attributed_doctor_name": "<doctor name mentioned, or null>",
  "sentiment": "positive" | "mixed" | "negative",
  "satisfaction": "satisfied" | "mixed" | "regretful",
  "main_topics": ["<up to 4 from: density, hairline, donor_area, healing, communication, value, doctor_involvement, technician_quality, aftercare, natural_results, other>"],
  "issue_keywords": ["<specific issues mentioned, e.g. shock_loss, scarring, poor_density>"],
  "is_repair_case": true | false,
  "secondary_clinic_mentions": [{"clinic_name": "<str>", "doctor_name": "<str|null>", "role": "mentioned|compared|repair_source", "evidence": "<quote>"}],
  "evidence_snippets": {"sentiment": "<quote>", "is_repair_case": "<quote if true>"},
  "summary": "<1-2 neutral sentences>"
}`
}

async function callLlm(prompt: string): Promise<LlmOutput | null> {
  const client = new Anthropic()
  try {
    const message = await client.messages.create({
      model: MODEL_NAME,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return JSON.parse(text.trim()) as LlmOutput
  } catch (err) {
    console.error('[llmAttributor] LLM call failed:', err instanceof Error ? err.message : err)
    return null
  }
}

// ── Main public function ──────────────────────────────────────────────────────

export interface AttributionResult {
  threadId: string
  attributed: boolean
  clinicId: string | null
  llmOutput: LlmOutput | null
  error?: string
}

/**
 * Runs LLM attribution on a single thread. Writes to forum_thread_llm_analysis,
 * updates forum_thread_index.clinic_id, and marks clinic_forum_profiles stale.
 */
export async function attributeThread(
  threadId: string,
  title: string,
  body: string,
  forumSource: string,
  clinics: ClinicNameEntry[]
): Promise<AttributionResult> {
  const supabase = getSupabaseAdmin()

  // Step 1: Fast substring match first
  const substringHits = substringMatch(`${title} ${body}`, clinics)
  const fastMatchedId = substringHits.length === 1 ? substringHits[0] : null

  // Step 2: LLM analysis (always run for sentiment/topics — not just attribution)
  const clinicNames = clinics.map(c => c.displayName)
  const prompt = buildPrompt(title, body, clinicNames)
  const llmOutput = await callLlm(prompt)

  if (!llmOutput) {
    return { threadId, attributed: false, clinicId: null, llmOutput: null, error: 'LLM call failed' }
  }

  // Step 3: Resolve clinic ID (prefer substring match, fall back to LLM attribution)
  const llmResolvedId = resolveClinicName(llmOutput.attributed_clinic_name, clinics)
  const resolvedClinicId = fastMatchedId ?? llmResolvedId
  const attributionMethod = resolvedClinicId
    ? (fastMatchedId ? 'url' : 'llm') // 'url' repurposed as 'substring' in our context
    : null

  // Step 4: Invalidate previous is_current rows for this thread
  await supabase
    .from('forum_thread_llm_analysis')
    .update({ is_current: false })
    .eq('thread_id', threadId)
    .eq('is_current', true)

  // Step 5: Insert new LLM analysis row
  const { error: insertError } = await supabase
    .from('forum_thread_llm_analysis')
    .insert({
      thread_id: threadId,
      attributed_clinic_name: llmOutput.attributed_clinic_name,
      attributed_doctor_name: llmOutput.attributed_doctor_name,
      attributed_clinic_id: resolvedClinicId,
      sentiment_label: llmOutput.sentiment,
      satisfaction_label: llmOutput.satisfaction,
      summary_short: llmOutput.summary,
      main_topics: llmOutput.main_topics.filter(t => (VALID_TOPICS as readonly string[]).includes(t)),
      issue_keywords: llmOutput.issue_keywords,
      is_repair_case: llmOutput.is_repair_case,
      secondary_clinic_mentions: llmOutput.secondary_clinic_mentions ?? [],
      evidence_snippets: llmOutput.evidence_snippets ?? {},
      model_name: MODEL_NAME,
      prompt_version: PROMPT_VERSION,
      is_current: true,
    })

  if (insertError) {
    console.error('[llmAttributor] Failed to insert analysis:', insertError)
    return { threadId, attributed: false, clinicId: null, llmOutput, error: insertError.message }
  }

  // Step 6: Update forum_thread_index.clinic_id if resolved
  if (resolvedClinicId) {
    await supabase
      .from('forum_thread_index')
      .update({
        clinic_id: resolvedClinicId,
        clinic_attribution_method: attributionMethod,
        last_scraped_at: new Date().toISOString(),
      })
      .eq('id', threadId)

    // Step 7: Mark clinic_forum_profiles as stale
    await supabase
      .from('clinic_forum_profiles')
      .upsert(
        { clinic_id: resolvedClinicId, forum_source: forumSource, is_stale: true },
        { onConflict: 'clinic_id,forum_source' }
      )
  }

  return { threadId, attributed: !!resolvedClinicId, clinicId: resolvedClinicId, llmOutput }
}

// ── Batch runner ──────────────────────────────────────────────────────────────

/**
 * Loads clinic names + doctor names from DB for use in attribution.
 * Call once per pipeline run and pass to attributeThread().
 */
export async function loadClinicNames(): Promise<ClinicNameEntry[]> {
  const supabase = getSupabaseAdmin()

  // Load clinic display names
  const { data: clinics } = await supabase
    .from('clinics')
    .select('id, display_name')
    .eq('status', 'active')

  if (!clinics?.length) return []

  // Load display_name_variants_instagram from clinic_facts as aliases
  const { data: facts } = await supabase
    .from('clinic_facts')
    .select('clinic_id, fact_value')
    .eq('fact_key', 'display_name_variants_instagram')

  const aliasMap: Record<string, string[]> = {}
  for (const f of facts ?? []) {
    try {
      const variants = JSON.parse(String(f.fact_value)) as string[]
      aliasMap[f.clinic_id] = variants
    } catch { /* skip malformed */ }
  }

  // Load doctor names from clinic_team
  const { data: team } = await supabase
    .from('clinic_team')
    .select('clinic_id, name')
    .in('role', ['surgeon', 'medical_director', 'doctor'])

  const doctorMap: Record<string, string[]> = {}
  for (const member of team ?? []) {
    if (!doctorMap[member.clinic_id]) doctorMap[member.clinic_id] = []
    doctorMap[member.clinic_id].push(member.name)
  }

  return clinics.map(c => ({
    clinicId: c.id,
    displayName: c.display_name,
    aliases: [...(aliasMap[c.id] ?? []), ...(doctorMap[c.id] ?? [])],
  }))
}
