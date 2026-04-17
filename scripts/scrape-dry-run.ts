
// Dry-run scraper — fetches real data but does NOT write to the database.
// Prints a summary to the console and saves the full payload to a JSON file.
//
// Run with:
//   export $(cat .env.local | xargs) && npx tsx scripts/scrape-dry-run.ts
//
// Output: scripts/dry-run-output.json

import { GooglePlacesService } from '../lib/services/googlePlacesService'
import { ApifyClient } from 'apify-client'
import { writeFileSync } from 'fs'
import { join } from 'path'

interface ApifyReview {
  name: string
  stars: number
  text: string
  publishedAtDate: string
  language?: string
}

const CLINIC = {
  name: "Dr Serkan Aygın Hair Transplant Clinic",
  place_id: "ChIJ46c0kwG3yhQRxYnQckUyqPg",
}

async function main() {
  console.log(`\n🔍 Dry-run scrape for: ${CLINIC.name}\n`)

  // ─── Step 1: Google Places ─────────────────────────────────────────────────
  console.log('1. Fetching Google Places data...')
  const googleService = new GooglePlacesService()
  let googleData: Awaited<ReturnType<typeof googleService.getPlaceDetails>>

  try {
    googleData = await googleService.getPlaceDetails(CLINIC.place_id)
    console.log(`   ✓ Name    : ${googleData.title}`)
    console.log(`   ✓ Address : ${googleData.address}`)
    console.log(`   ✓ Rating  : ${googleData.rating} (${googleData.reviews_count} reviews)`)
    console.log(`   ✓ Website : ${googleData.website || 'none'}`)
    console.log(`   ✓ Phone   : ${googleData.phone || 'none'}`)
    console.log(`   ✓ City    : ${googleData.city}, ${googleData.country}`)
    console.log(`   ✓ Photos  : ${googleData.raw_response.result.photos?.length ?? 0}`)
    console.log(`   ✓ Reviews : ${googleData.raw_response.result.reviews?.length ?? 0} (Google, max 5)`)
  } catch (err) {
    console.error(`   ✗ Google Places failed: ${(err as Error).message}`)
    console.error('   → Check that GOOGLE_PLACES_API_KEY is set in .env.local')
    process.exit(1)
  }

  // ─── Step 2: Apify reviews ────────────────────────────────────────────────
  console.log('\n2. Fetching Apify reviews...')
  let apifyReviews: Record<string, unknown>[] = []

  try {
    const apifyClient = new ApifyClient({ token: process.env.APIFY_API_TOKEN! })
    const run = await apifyClient.actor('compass/google-maps-reviews-scraper').call({
      placeIds: [CLINIC.place_id],
      maxReviews: 10, // keep small for dry-run
      reviewsSort: 'newest',
      language: 'en',
      maxImages: 0,
    })
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems()
    apifyReviews = items || []
    console.log(`   ✓ Fetched ${apifyReviews.length} reviews from Apify`)
  } catch (err) {
    console.error(`   ✗ Apify failed: ${(err as Error).message}`)
    console.error('   → Check that APIFY_API_TOKEN is set in .env.local')
    process.exit(1)
  }

  // ─── Step 3: Build payload ────────────────────────────────────────────────
  console.log('\n3. Building import payload...')
  const allReviews = [
    ...(googleData.raw_response.result.reviews || []),
    ...(apifyReviews as unknown as ApifyReview[]).map((r) => ({
      author_name: r.name,
      rating: r.stars,
      text: r.text,
      time: new Date(r.publishedAtDate).getTime() / 1000,
      language: r.language || 'en',
    })),
  ]

  const payload = {
    clinicId: 'DRY-RUN-NO-DB-WRITE',
    googlePlacesData: {
      google_places: {
        place_id: googleData.place_id,
        display_name: googleData.title,
        formatted_address: googleData.address || '',
        rating: googleData.rating || 0,
        user_ratings_total: googleData.reviews_count || 0,
        website: googleData.website,
        phone: googleData.phone,
        international_phone: googleData.phone,
        location: { lat: googleData.lat, lng: googleData.lng },
        address_components: googleData.raw_response.result.address_components,
        opening_hours: googleData.opening_hours,
        photos: googleData.raw_response.result.photos,
        reviews: allReviews,
        types: googleData.categories,
      },
      extracted_claims: {
        location: {
          city: googleData.city,
          state: googleData.state,
          country: googleData.country,
          postal_code: null,
        },
        contact: {
          website_candidates: googleData.website ? [googleData.website] : [],
          phone_candidates: googleData.phone ? [googleData.phone] : [],
          email_candidates: [],
          whatsapp_candidates: [],
        },
        services: {
          claimed: ['Hair Transplant'],
          primary_service: 'Hair Transplant',
        },
      },
    },
  }

  console.log(`   ✓ Total reviews combined : ${allReviews.length}`)
  console.log(`   ✓ Photos in payload      : ${googleData.raw_response.result.photos?.length ?? 0}`)

  // ─── Step 4: Save to file ─────────────────────────────────────────────────
  const outPath = join(__dirname, 'dry-run-output.json')
  writeFileSync(outPath, JSON.stringify(payload, null, 2))
  console.log(`\n✓ Full payload saved to: scripts/dry-run-output.json`)

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════')
  console.log('Dry-run complete — nothing was written to the database.')
  console.log('If everything looks correct above, run scrape-one.ts to import for real.')
  console.log('══════════════════════════════\n')
}

main().catch(console.error)