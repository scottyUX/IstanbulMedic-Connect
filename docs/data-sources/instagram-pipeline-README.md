# Instagram Pipeline

Scrapes Instagram profile and posts for each clinic, extracts structured claims, and stores them in the database.

## Folder Structure

```
app/api/instagramPipeline/
├── instagramPipeline.ts     # Main runner — reads config, scrapes, imports
├── instagramService.ts      # Apify scraper wrapper (profile + posts)
├── extractionInstagram.ts   # Parses raw Apify data into structured claims
├── clinics.json             # Config: clinic names + Instagram URLs to scrape

lib/instagram/
└── importInstagramData.ts   # Shared DB write logic (used by pipeline + API route)

app/api/import/instagram/
└── route.ts                 # POST endpoint — thin wrapper around importInstagramData

.github/workflows/
└── instagram-pipeline.yml   # GitHub Actions cron job (runs 1st of every month)
```

## How It Works

1. **`instagramPipeline.ts`** reads `clinics.json` for the list of clinics to scrape
2. For each clinic, it looks up the clinic ID in the database by `display_name`
   - If not found, it creates a new clinic row automatically
3. Calls `instagramService.ts` to scrape the Instagram profile and up to 200 posts via Apify
4. Calls `extractionInstagram.ts` to parse the raw data into structured claims
5. Calls `importInstagramData()` directly to write results to the database (no server needed)

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
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (bypasses row-level security) |

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

## Running the Pipeline Manually

No server required — the pipeline writes directly to Supabase:

```bash
npx tsx app/api/instagramPipeline/instagramPipeline.ts
```

Make sure `.env.local` has the three environment variables above set to your target database (local or production). Each clinic takes up to ~5 minutes (Apify poll), so 26 clinics can take up to ~2 hours total.

## Automated Cron Job (GitHub Actions)

The pipeline runs automatically on the **1st of every month at 03:00 UTC** via GitHub Actions.

### How it works

The workflow file at [`.github/workflows/instagram-pipeline.yml`](../../.github/workflows/instagram-pipeline.yml):

1. Checks out the repo on a fresh `ubuntu-latest` runner
2. Installs Node 20 and runs `npm ci`
3. Runs `npx tsx app/api/instagramPipeline/instagramPipeline.ts` directly — no server needed
4. Writes results straight to the production Supabase database using the secrets below

### Setup (one-time)

Add these three secrets to the GitHub repo (**Settings → Secrets and variables → Actions**):

| Secret | Value |
|---|---|
| `APIFY_API_TOKEN` | Your Apify API key |
| `NEXT_PUBLIC_SUPABASE_URL` | Production Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Production Supabase service role key |

The cron job only runs from the **default branch** (`main`). Make sure the workflow file is merged into `main` for the schedule to activate.

### Manual trigger

You can also trigger the pipeline on demand without waiting for the schedule:

1. Go to the repo on GitHub
2. Click **Actions** → **Monthly Instagram Pipeline**
3. Click **Run workflow** → **Run workflow**

### Monitoring

Each run logs per-clinic progress and prints a summary at the end:

```
[1/26] Vera Clinic
  Imported — facts: 12, posts: 200
[2/26] Cosmedica Hair Transplantation Clinic
  Imported — facts: 9, posts: 187
...
========== Pipeline Complete ==========
Succeeded: 25/26
Failed: 1/26
```

If a run fails, GitHub will send an email notification to repo admins. Full logs are available in the Actions tab.
