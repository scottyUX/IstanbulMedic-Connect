/**
 * Profile recompute runner — recomputes stale clinic_forum_profiles rows.
 * Run after attribution to update aggregated signals for newly matched clinics.
 *
 * Usage:
 *   npx tsx scripts/forum-recompute-profiles.ts
 *   npx tsx scripts/forum-recompute-profiles.ts --source reddit
 *   npx tsx scripts/forum-recompute-profiles.ts --source hrn
 *   npx tsx scripts/forum-recompute-profiles.ts --all   (recomputes even non-stale rows)
 *   npx tsx scripts/forum-recompute-profiles.ts --clinic-id <uuid>
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
import { recomputeProfile, recomputeStaleProfiles } from '../app/api/forumPipeline/profileAggregator'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── Parse CLI args ────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const recomputeAll = args.includes('--all')

function getArg(flag: string): string | undefined {
  const i = args.indexOf(flag)
  return i >= 0 ? args[i + 1] : undefined
}

const sourceArg = getArg('--source') as 'reddit' | 'hrn' | undefined
const clinicIdArg = getArg('--clinic-id')

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Forum profile recompute runner')
  console.log('==============================')

  if (clinicIdArg) {
    // Single clinic mode
    const source = sourceArg ?? 'reddit'
    console.log(`Recomputing ${source} profile for clinic ${clinicIdArg}...`)
    await recomputeProfile(clinicIdArg, source)
    console.log('Done.')
    return
  }

  if (recomputeAll) {
    // Recompute everything — mark all as stale first
    const supabase = getSupabaseAdmin()
    const sources: ('reddit' | 'hrn')[] = sourceArg ? [sourceArg] : ['reddit', 'hrn']

    for (const source of sources) {
      console.log(`Marking all ${source} profiles as stale...`)
      await supabase
        .from('clinic_forum_profiles')
        .update({ is_stale: true })
        .eq('forum_source', source)

      const count = await recomputeStaleProfiles(source)
      console.log(`Recomputed ${count} ${source} profiles`)
    }
    return
  }

  // Default: recompute stale profiles only
  const sources: ('reddit' | 'hrn')[] = sourceArg ? [sourceArg] : ['reddit', 'hrn']

  let total = 0
  for (const source of sources) {
    console.log(`Recomputing stale ${source} profiles...`)
    const count = await recomputeStaleProfiles(source)
    total += count
    console.log(`  ${count} ${source} profiles recomputed`)
  }

  if (total === 0) {
    console.log('No stale profiles found.')
  } else {
    console.log(`\nTotal profiles recomputed: ${total}`)
    console.log('\nTo enable the Reddit card in the UI, set profileRedditSignals: true in lib/filterConfig.ts')
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
