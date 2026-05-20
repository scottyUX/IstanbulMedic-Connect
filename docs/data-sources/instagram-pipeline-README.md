# Instagram Pipeline

Scrapes Instagram profile and posts for each clinic, extracts structured claims, and stores them in the database.

## Folder Structure

```
app/api/instagramPipeline/
├── instagramPipeline.ts     # Main runner — reads config, scrapes, uploads
├── instagramService.ts      # Apify scraper wrapper (profile + posts)
├── extractionInstagram.ts   # Parses raw Apify data into structured claims
├── clinics.json             # Config: clinic names + Instagram URLs to scrape
```

```
app/api/import/instagram/
└── route.ts                 # POST endpoint that writes scraped data to DB
```

## How It Works

1. **`instagramPipeline.ts`** reads `clinics.json` for the list of clinics to scrape
2. For each clinic, it looks up the clinic ID in the database by `display_name`
   - If not found, it creates a new clinic row automatically
3. Calls `instagramService.ts` to scrape the Instagram profile and up to 200 posts via Apify
4. Calls `extractionInstagram.ts` to parse the raw data into structured claims
5. POSTs the result to `/api/import/instagram` which writes to the database

## Database Tables Written To

| Table | What gets stored |
|---|---|
| `sources` | Instagram profile as a source record |
| `source_documents` | Raw profile text |
| `clinic_social_media` | Instagram handle, follower count, bio |
| `clinic_facts` | Structured facts (languages, services, etc.) |
| `clinic_instagram_posts` | Up to 200 posts with captions, likes, comments |
| `fact_evidence` | Links facts back to source posts |
| `clinics` | Updates `website_url` if found in bio |

## Required Environment Variables

| Variable | Description |
|---|---|
| `APIFY_API_TOKEN` | Apify API key for running the Instagram scraper |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `INSTAGRAM_IMPORT_ENDPOINT` | Optional — defaults to `http://localhost:3000/api/import/instagram` |

## Adding Clinics to Scrape

Edit `clinics.json` — add a clinic name (must match `display_name` in the `clinics` table exactly) and its Instagram URL:

```json
{
  "clinics": [
    {
      "clinicName": "Vera Clinic | Hair Transplant Clinic in Turkey",
      "instagramUrl": "https://www.instagram.com/veraclinic/"
    }
  ]
}
```

If the clinic name doesn't exist in the database, the pipeline will create a new clinic row with `status: active`, `primary_city: Istanbul`, `primary_country: Turkey`.

## Running the Pipeline

Make sure the Next.js dev server is running first, then:

```bash
npx tsx app/api/instagramPipeline/instagramPipeline.ts
```

To run against production, set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the production values in `.env.local`.
