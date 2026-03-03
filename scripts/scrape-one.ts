
import { GooglePlacesService } from '../lib/services/googlePlacesService';
import { ApifyClient } from 'apify-client';

const CLINIC = {
  name: "Dr Serkan Aygın Hair Transplant Clinic",
  place_id: "ChIJ46c0kwG3yhQRxYnQckUyqPg",
  clinicId: "fa43da13-5643-4698-ba76-1fd536832067",
}

async function main() {
  console.log(`Scraping ${CLINIC.name}...`)

  const googleService = new GooglePlacesService()
  const googleData = await googleService.getPlaceDetails(CLINIC.place_id)

  const apifyClient = new ApifyClient({ token: process.env.APIFY_API_TOKEN! })
  const run = await apifyClient.actor('compass/google-maps-reviews-scraper').call({
    placeIds: [CLINIC.place_id],
    maxReviews: 100,
    reviewsSort: 'newest',
    language: 'en',
    maxImages: 0,
  })

  const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems()
  const apifyReviews = items || []

  const allReviews = [
    ...(googleData.raw_response.result.reviews || []),
    ...apifyReviews.map((r: any) => ({
      author_name: r.name,
      rating: r.stars,
      text: r.text,
      time: new Date(r.publishedAtDate).getTime() / 1000,
      relative_time_description: r.publishedAtDate,
      language: r.language || 'en',
    })),
  ]

  const payload = {
    clinicId: CLINIC.clinicId,
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

  const response = await fetch('http://localhost:3000/api/import/google-places', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const result = await response.json() as any
  if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`)

  console.log(`✓ Done: ${result.display_name}`)
  console.log(`  clinic_id: ${result.clinic_id}`)
  console.log(`  source_id: ${result.source_id}`)
}

main().catch(console.error)