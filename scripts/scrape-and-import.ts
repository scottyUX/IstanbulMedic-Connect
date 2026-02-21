import { GooglePlacesService } from '../lib/services/googlePlacesService';
import { ApifyClient } from 'apify-client';


// ─── Config ───────────────────────────────────────────────────────────────────

const DELAY_MS = 2000; // pause between clinics to avoid rate limits
const MAX_RETRIES = 3;

// Raw clinic data from your JSON (deduplicated by place_id)
const RAW_CLINICS = [
  { name: "Dr Serkan Aygın Hair Transplant Clinic", place_id: "ChIJ46c0kwG3yhQRxYnQckUyqPg" },
  { name: "Vera Clinic", place_id: "ChIJEX82kp7GyhQRNnmeBwH1MMQ" },
  { name: "Cosmedica Hair Transplantation Clinic", place_id: "ChIJKdpnq1O7yhQRx2ShopMPSfA" },
  { name: "NIMCLINIC", place_id: "ChIJzwK4DbK3yhQRH3NsFk7tI0Y" },
  { name: "Smile Hair Clinic", place_id: "ChIJZYs6o7LIyhQR-sGxFoifWLw" },
  { name: "HLC Clinic", place_id: "ChIJf6HkXpFP0xQRwyW_ZhsKJ68" },
  { name: "ASMED Medical Center", place_id: "ChIJq6YwlDzGyhQR9Vsz_MQqCxU" },
  { name: "Özel PHR Polikliniği", place_id: "ChIJjRKPz-lP0xQRwzwlCbdlgSs" },
  { name: "Hermest Hair Clinic", place_id: "ChIJ12WcZ_e3yhQRnsEKjsPkqQI" },
  { name: "Dr. Cinik Clinic", place_id: "ChIJ7R706h63yhQRsmvIUI3HUaY" },
  { name: "AHD Clinic", place_id: "ChIJMe9xLEWbwxQRQW1rY53Bwb0" },
  { name: "Clinicana", place_id: "ChIJN5fbNG-3yhQRDH2pvYVRt90" },
  { name: "Dr. Resul Yaman Hair Clinic", place_id: "ChIJnVSODoGlyhQRKzH3wZ7mjVI" },
  { name: "Estetik International", place_id: "ChIJM1eSB0zGyhQRts3ii7oU6pY" },
  { name: "Sapphire Hair Transplant Clinic", place_id: "ChIJnaqISme3yhQRasjRHVX0UGQ" },
  { name: "Este Favor", place_id: "ChIJj8IQRde7yhQRvz2UIHwZ3a0" },
  { name: "SULE CLINIC", place_id: "ChIJuQbq64ewyhQRSEKVkD785Vk" },
  { name: "HEVA CLINIC", place_id: "ChIJHzttL5G3yhQRUBzIrlPs5X8" },
  { name: "Lenus Clinic", place_id: "ChIJFaFcZQ3HyhQR1jBlLct5yUA" },
  { name: "Dr. Servet Terziler", place_id: "ChIJXReAXDq7yhQRCeDIVE7ENAk" },
  { name: "AEK Hair Clinic", place_id: "ChIJacWZiA_GyhQRU7LUboOIkLo" },
  { name: "Memorial Şişli Hastanesi", place_id: "ChIJz6nRJSO3yhQRNrNDK8063a0" },
  { name: "Este Medical", place_id: "ChIJSwrv5JW3yhQRmzvMUTBhg-w" },
  { name: "EsteNove", place_id: "ChIJ82ROLbS3yhQRrsYUOPFXwfo" },
  { name: "Doku Clinic", place_id: "ChIJobQQ-wK3yhQRzULSi_kfisE" },
  { name: "Esthetic Hair Turkey", place_id: "ChIJwQFp5oewyhQRsDOAVsry82E" },
  { name: "Longevita", place_id: "ChIJY-PxTLQbdkgRo__pU5Sv54w" },
];

// ─── No Supabase needed — using place_id directly as clinicId ─────────────────
// TODO: replace with real UUID lookup once you have Supabase set up,
// or pre-populate the RAW_CLINICS array with a `clinicId` field.
async function getClinicIdByPlaceId(placeId: string): Promise<string | null> {
  return placeId;
}

// ─── Core scrape function (unchanged from your original) ──────────────────────

async function scrapeAndImport(clinicId: string, placeId: string) {
  const googleService = new GooglePlacesService();
  const googleData = await googleService.getPlaceDetails(placeId);

  const apifyClient = new ApifyClient({ token: process.env.APIFY_API_TOKEN! });
  const run = await apifyClient.actor('compass/google-maps-reviews-scraper').call({
    placeIds: [placeId],
    maxReviews: 100,
    reviewsSort: 'newest',
    language: 'en',
    maxImages: 0,
  });

  const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
  const apifyReviews = items || [];

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
  ];

  const payload = {
    clinicId,
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
  };

  const response = await fetch('http://localhost:3000/api/import/google-places', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
  return result;
}

// ─── Retry wrapper ─────────────────────────────────────────────────────────────

async function scrapeWithRetry(clinicId: string, placeId: string, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await scrapeAndImport(clinicId, placeId);
    } catch (err) {
      const isLast = attempt === retries;
      console.warn(`  Attempt ${attempt}/${retries} failed: ${(err as Error).message}`);
      if (isLast) throw err;
      await delay(DELAY_MS * attempt); // exponential-ish backoff
    }
  }
}


const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── Main bulk runner ─────────────────────────────────────────────────────────

async function main() {
  const results = { success: [] as string[], skipped: [] as string[], failed: [] as string[] };

  console.log(`Starting bulk scrape for ${RAW_CLINICS.length} clinics...\n`);

  for (const [i, clinic] of RAW_CLINICS.entries()) {
    console.log(`[${i + 1}/${RAW_CLINICS.length}] ${clinic.name}`);

    // 1. Resolve clinic UUID from Supabase
    const clinicId = await getClinicIdByPlaceId(clinic.place_id);
    if (!clinicId) {
      console.warn(`  ⚠ No Supabase record found for place_id ${clinic.place_id} — skipping`);
      results.skipped.push(clinic.name);
      continue;
    }

    // 2. Scrape + import
    try {
      const result = await scrapeWithRetry(clinicId, clinic.place_id);
      console.log(`  ✓ Done: ${result.display_name}`);
      results.success.push(clinic.name);
    } catch (err) {
      console.error(`  ✗ Failed after ${MAX_RETRIES} attempts: ${(err as Error).message}`);
      results.failed.push(clinic.name);
    }

    // 3. Pause between clinics
    if (i < RAW_CLINICS.length - 1) await delay(DELAY_MS);
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════');
  console.log(`✓ Success : ${results.success.length}`);
  console.log(`⚠ Skipped : ${results.skipped.length}`);
  console.log(`✗ Failed  : ${results.failed.length}`);
  if (results.failed.length)  console.log('  Failed clinics:', results.failed);
  if (results.skipped.length) console.log('  Skipped clinics:', results.skipped);
}

main().catch(console.error);