/**
 * Registry data ingestion pipeline
 *
 * Fetches public registry data for all clinics in the database from:
 *   - Turkish Ministry of Health (MOH)
 *
 * Usage:
 *   npx tsx scripts/ingest-registry/index.ts
 *   npx tsx scripts/ingest-registry/index.ts --source=moh
 *   npx tsx scripts/ingest-registry/index.ts --source=moh-pdf --file=data/moh-registry.pdf
 *   npx tsx scripts/ingest-registry/index.ts --clinic="Istanbul Hair Masters"
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
config() // fallback to .env
import { createClient } from '@supabase/supabase-js'
import { fetchMOHRecord } from './sources/moh'
import { parseMOHPdf } from './sources/moh-pdf'
import { upsertRegistryData } from './upsert'
import { NormalizedClinicData } from './normalize'

const RATE_LIMIT_MS = 1500  // pause between requests to avoid rate limiting

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseArgs() {
  const args = process.argv.slice(2)
  const source = args.find((a) => a.startsWith('--source='))?.split('=')[1] as 'moh' | 'moh-pdf' | undefined
  const clinic = args.find((a) => a.startsWith('--clinic='))?.split('=')[1]
  const file = args.find((a) => a.startsWith('--file='))?.split('=')[1]
  return { source, clinic, file }
}

async function fetchMOH(legalName: string): Promise<NormalizedClinicData[]> {
  try {
    const record = await fetchMOHRecord(legalName)
    return record ? [record] : []
  } catch (err) {
    console.warn(`  ⚠ MOH fetch failed for "${legalName}":`, (err as Error).message)
    return []
  }
}

async function getAllClinicLegalNames(): Promise<{ id: string; legal_name: string }[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) throw new Error('Missing Supabase env vars')

  const supabase = createClient(url, key)
  const { data, error } = await supabase
    .from('clinics')
    .select('id, legal_name')
    .eq('status', 'active')
    .not('legal_name', 'is', null)

  if (error) throw new Error(`Failed to fetch clinics: ${error.message}`)
  return (data ?? []) as { id: string; legal_name: string }[]
}

async function main() {
  const { source, clinic, file } = parseArgs()

  if (!source) {
    console.error('--source=<moh|moh-pdf> is required')
    console.error('  --source=moh-pdf --file=<path>   parse a downloaded MOH PDF')
    console.error('  --source=moh                     scrape the MOH web portal (NOT YET IMPLEMENTED — selectors are stubs)')
    process.exit(1)
  }

  if (source === 'moh') {
    console.error('--source=moh is not yet implemented — the kuvap.saglik.gov.tr selectors in sources/moh.ts are placeholders.')
    console.error('Use --source=moh-pdf --file=<path> for now.')
    process.exit(1)
  }

  console.log('🏥 IstanbulMedic Registry Ingestion Pipeline')
  console.log(`   Source: ${source}`)
  console.log(`   Clinic filter: ${clinic ?? 'all active clinics'}`)
  if (file) console.log(`   File: ${file}`)
  console.log()

  // PDF mode: parse the file and upsert all rows directly
  if (source === 'moh-pdf') {
    if (!file) {
      console.error('--file=<path> is required for --source=moh-pdf')
      process.exit(1)
    }
    console.log('Parsing MOH PDF...')
    const records = await parseMOHPdf(file)
    console.log(`Upserting ${records.length} records...\n`)
    let ok = 0, err = 0
    for (const record of records) {
      try {
        await upsertRegistryData(record)
        ok++
      } catch (e) {
        console.error(`  ✗`, (e as Error).message)
        err++
      }
    }
    console.log(`\n✓ ${ok}  ✗ ${err}`)
    return
  }

  // Web scrape mode (default)
  let clinicNames: string[]

  if (clinic) {
    clinicNames = [clinic]
  } else {
    console.log('Fetching clinic list from database...')
    const clinics = await getAllClinicLegalNames()
    clinicNames = clinics.map((c) => c.legal_name).filter(Boolean)
    console.log(`Found ${clinicNames.length} active clinics\n`)
  }

  let successCount = 0
  let skipCount = 0
  let errorCount = 0

  for (const legalName of clinicNames) {
    console.log(`Processing: ${legalName}`)

    const records = await fetchMOH(legalName)

    if (records.length === 0) {
      console.log(`  ⚠ No registry records found`)
      skipCount++
      continue
    }

    for (const record of records) {
      try {
        await upsertRegistryData(record)
        successCount++
      } catch (err) {
        console.error(`  ✗ Error:`, (err as Error).message)
        errorCount++
      }
    }

    await sleep(RATE_LIMIT_MS)
  }

  console.log()
  console.log('─────────────────────────────')
  console.log(`✓ Succeeded: ${successCount}`)
  console.log(`⚠ Skipped:   ${skipCount}`)
  console.log(`✗ Errors:    ${errorCount}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
