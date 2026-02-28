scrape-and-imports.ts

Scrapes Google Places data + reviews for all 27 Istanbul hair transplant clinics and imports them into the database via the /api/import/google-places endpoint.
What it does
For each clinic it:

Fetches clinic details from Google Places API
Fetches up to 100 reviews via Apify
Combines them and POSTs to /api/import/google-places

Prerequisites
The following must be set in .env.local:
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
APIFY_API_TOKEN=
GOOGLE_PLACES_API_KEY=

I ran scrape-and-import using the following commands
npm run dev
export $(cat .env.local | xargs) && npx tsx scripts/scrape-and-import.ts

Use seed-clinics to add a new clinic to the database with its google clinic id before calling the scraper logic on it