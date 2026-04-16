/**
 * Re-processes existing Instagram data to populate new computed facts
 * (engagement_rate, posts_per_month, comments_enabled_ratio)
 *
 * Run with: npx tsx scripts/reseed-instagram-facts.ts
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env' })
dotenv.config({ path: '.env.local', override: true })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function reseedInstagramFacts() {
  console.log('Fetching Instagram source documents...')

  // Get all Instagram source documents
  const { data: docs, error: docsError } = await supabase
    .from('source_documents')
    .select('id, raw_text, title')
    .like('title', 'Instagram Profile Data%')

  if (docsError) {
    console.error('Error fetching documents:', docsError)
    return
  }

  console.log(`Found ${docs?.length || 0} Instagram documents to process`)

  // Build imports array
  const imports = []

  for (const doc of docs || []) {
    try {
      const instagramData = JSON.parse(doc.raw_text)
      const username = instagramData.instagram?.username

      if (!username) {
        console.log(`Skipping doc ${doc.id}: no username found`)
        continue
      }

      // Find the clinic_id from clinic_social_media
      const { data: socialMedia, error: smError } = await supabase
        .from('clinic_social_media')
        .select('clinic_id')
        .eq('platform', 'instagram')
        .eq('account_handle', username)
        .single()

      if (smError || !socialMedia) {
        console.log(`Skipping @${username}: no clinic_id found`)
        continue
      }

      imports.push({
        clinicId: socialMedia.clinic_id,
        instagramData
      })
      console.log(`Queued @${username}`)

    } catch (err) {
      console.error(`Error parsing doc ${doc.id}:`, err)
    }
  }

  console.log(`\nProcessing ${imports.length} imports one at a time...`)

  let success = 0
  let failed = 0
  const errors: any[] = []

  for (const importData of imports) {
    const username = importData.instagramData.instagram?.username || 'unknown'
    try {
      const response = await fetch(`${API_URL}/api/import/instagram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importData)
      })

      if (!response.ok) {
        const error = await response.text()
        console.log(`✗ @${username}: ${error}`)
        errors.push({ username, error })
        failed++
      } else {
        const result = await response.json()
        console.log(`✓ @${username}: ${result.summary?.factsCreated || 0} facts`)
        success++
      }
    } catch (err: any) {
      console.log(`✗ @${username}: ${err.message}`)
      errors.push({ username, error: err.message })
      failed++
    }

    // Small delay between requests
    await new Promise(r => setTimeout(r, 200))
  }

  console.log('\n=== Done ===')
  console.log(`Success: ${success}`)
  console.log(`Failed: ${failed}`)

  if (errors.length) {
    console.log('\nErrors:')
    errors.forEach((e: any) => console.log(`  - @${e.username}: ${e.error}`))
  }
}

reseedInstagramFacts()
