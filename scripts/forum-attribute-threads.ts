/**
 * LLM attribution runner — processes unattributed forum threads.
 * Reads forum_thread_index rows WHERE clinic_id IS NULL, runs LLM attribution,
 * updates clinic_id, and marks clinic_forum_profiles as stale.
 *
 * Works for both HRN and Reddit threads. Run after any scrape.
 *
 * Usage:
 *   npx tsx scripts/forum-attribute-threads.ts
 *   npx tsx scripts/forum-attribute-threads.ts --source reddit
 *   npx tsx scripts/forum-attribute-threads.ts --source hrn
 *   npx tsx scripts/forum-attribute-threads.ts --limit 50
 *   npx tsx scripts/forum-attribute-threads.ts --dry-run
 *
 * Pruning (removes threads still unmatched after N days — validate attribution quality first):
 *   npx tsx scripts/forum-attribute-threads.ts --prune
 *   npx tsx scripts/forum-attribute-threads.ts --prune --prune-days 60
 *   npx tsx scripts/forum-attribute-threads.ts --prune --dry-run   (shows count, deletes nothing)
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const REQUIRED_ENV = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'OPENAI_API_KEY'] as const
const missingEnv = REQUIRED_ENV.filter(k => !process.env[k])
if (missingEnv.length > 0) {
  console.error(`Missing required env vars: ${missingEnv.join(', ')}`)
  process.exit(1)
}

import { createClient } from '@supabase/supabase-js'
import { attributeThread, loadClinicNames } from '../app/api/forumPipeline/llmAttributor'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── Parse CLI args ────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const pruneMode = args.includes('--prune')

function getArg(flag: string): string | undefined {
  const i = args.indexOf(flag)
  return i >= 0 ? args[i + 1] : undefined
}

const sourceArg = getArg('--source') as 'reddit' | 'hrn' | undefined
const limitArg = getArg('--limit')
const limit = limitArg ? parseInt(limitArg) : 200
const pruneDays = parseInt(getArg('--prune-days') ?? '90')

// ── Main ──────────────────────────────────────────────────────────────────────

async function pruneUnmatched() {
  const supabase = getSupabaseAdmin()
  const cutoff = new Date(Date.now() - pruneDays * 86400 * 1000).toISOString()

  console.log(`Prune mode: removing threads with clinic_id IS NULL, no doctor attribution, older than ${pruneDays} days`)
  console.log(`  Cutoff date: ${cutoff}`)
  if (sourceArg) console.log(`  Source filter: ${sourceArg}`)

  // Find thread IDs that have a doctor name attributed (even without a clinic match).
  // These are spared — the doctor may be added to the DB later and re-attribution would link them.
  const { data: doctorAttributed } = await supabase
    .from('forum_thread_llm_analysis')
    .select('thread_id')
    .not('attributed_doctor_name', 'is', null)
    .eq('is_current', true)

  const sparedIds = (doctorAttributed ?? []).map(r => r.thread_id)

  // Fetch candidates: unattributed + old enough
  let candidateQuery = supabase
    .from('forum_thread_index')
    .select('id')
    .is('clinic_id', null)
    .lt('first_scraped_at', cutoff)
  if (sourceArg) candidateQuery = candidateQuery.eq('forum_source', sourceArg)

  const { data: candidates, error: candidateError } = await candidateQuery
  if (candidateError) throw candidateError

  const toDelete = (candidates ?? [])
    .map(r => r.id)
    .filter(id => !sparedIds.includes(id))

  console.log(`\nCandidates (unmatched + old):  ${candidates?.length ?? 0}`)
  console.log(`Spared (doctor attributed):    ${sparedIds.filter(id => (candidates ?? []).some(c => c.id === id)).length}`)
  console.log(`To delete:                     ${toDelete.length}`)

  if (toDelete.length === 0) {
    console.log('Nothing to prune.')
    return
  }

  if (dryRun) {
    console.log('[DRY RUN] No rows deleted.')
    return
  }

  // Cascade-delete hub rows — forum_thread_signals, forum_thread_llm_analysis,
  // and reddit/hrn extension rows all have ON DELETE CASCADE on thread_id FK.
  const { error: deleteError } = await supabase
    .from('forum_thread_index')
    .delete()
    .in('id', toDelete)

  if (deleteError) throw deleteError

  console.log(`✓ Pruned ${toDelete.length} thread(s) and their associated signals/analysis rows.`)
}

async function main() {
  console.log('Forum attribution runner')
  console.log('========================')
  if (dryRun) console.log('[DRY RUN] No DB writes.\n')

  if (pruneMode) {
    await pruneUnmatched()
    return
  }

  const supabase = getSupabaseAdmin()

  // Load clinic names + doctor names once
  console.log('Loading clinic names from DB...')
  const clinicNames = await loadClinicNames()
  console.log(`Loaded ${clinicNames.length} clinics (with aliases and doctor names)`)

  // Paginate all queries in 1000-row batches (Supabase server-side max)
  const PAGE_SIZE = 1000

  // Load all already-attempted thread IDs (paginated — may exceed 1000 rows)
  const attemptedIds = new Set<string>()
  let attemptedOffset = 0
  while (true) {
    const { data: page, error: attemptedError } = await supabase
      .from('forum_thread_llm_analysis')
      .select('thread_id')
      .eq('is_current', true)
      .range(attemptedOffset, attemptedOffset + PAGE_SIZE - 1)
    if (attemptedError) throw new Error(`Failed to load attempted thread IDs: ${attemptedError.message}`)
    for (const r of page ?? []) attemptedIds.add(r.thread_id)
    if (!page?.length || page.length < PAGE_SIZE) break
    attemptedOffset += PAGE_SIZE
  }
  console.log(`Already attempted: ${attemptedIds.size} threads (skipping)`)
  const threads: { id: string; title: string | null; forum_source: string; source_id: string | null }[] = []
  let offset = 0

  while (threads.length < limit) {
    let pageQuery = supabase
      .from('forum_thread_index')
      .select('id, title, forum_source, source_id')
      .is('clinic_id', null)
      .order('first_scraped_at', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1)

    if (sourceArg) pageQuery = pageQuery.eq('forum_source', sourceArg)

    const { data: page, error } = await pageQuery
    if (error) throw error
    if (!page?.length) break

    for (const row of page) {
      if (threads.length >= limit) break
      if (!attemptedIds.has(row.id)) threads.push(row)
    }

    if (page.length < PAGE_SIZE) break  // last page
    offset += PAGE_SIZE
  }

  if (!threads.length) {
    console.log('No unattributed threads found.')
    return
  }

  console.log(`Found ${threads.length} unattributed threads. Starting attribution...\n`)

  let attributed = 0
  let skipped = 0
  let failed = 0

  for (const thread of threads) {
    // Fetch the body text from the appropriate extension table
    let body = ''
    if (thread.forum_source === 'reddit') {
      const { data: content } = await supabase
        .from('reddit_thread_content')
        .select('body')
        .eq('thread_id', thread.id)
        .single()
      body = content?.body ?? ''
    } else if (thread.forum_source === 'hrn') {
      const { data: content } = await supabase
        .from('hrn_thread_content')
        .select('op_text, last_author_post_text')
        .eq('thread_id', thread.id)
        .single()
      body = [content?.op_text, content?.last_author_post_text].filter(Boolean).join('\n\n')
    }

    if (!body && !thread.title) {
      console.log(`  ⏭  Skipping ${thread.id} (no text content)`)
      skipped++
      continue
    }

    process.stdout.write(`  Attributing ${thread.id} [${thread.forum_source}]... `)

    if (dryRun) {
      console.log('[DRY RUN — skipped write]')
      continue
    }

    const result = await attributeThread(
      thread.id,
      thread.title ?? '',
      body,
      thread.forum_source,
      clinicNames
    )

    if (result.error) {
      console.log(`✗ Error: ${result.error}`)
      failed++
    } else if (result.attributed) {
      console.log(`✓ → clinic ${result.clinicId}`)
      attributed++
    } else {
      console.log(`— Not matched to any clinic`)
      skipped++
    }

    // Small delay between LLM calls to avoid rate limits
    await new Promise(r => setTimeout(r, 200))
  }

  console.log('\n── Results ──────────────────────────────────────────────────')
  console.log(`Threads processed:  ${threads.length}`)
  console.log(`Attributed:         ${attributed}`)
  console.log(`No match:           ${skipped}`)
  console.log(`Failed:             ${failed}`)

  if (failed > 0) process.exit(1)

  if (!dryRun && attributed > 0) {
    console.log('\nNext step: recompute profiles for newly attributed clinics:')
    console.log(`  npx tsx scripts/forum-recompute-profiles.ts${sourceArg ? ` --source ${sourceArg}` : ''}`)
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
