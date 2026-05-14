## What You Changed

Added end-to-end HRN (Hair Restoration Network) forum scraping and display pipeline.

**Key files to review:**
- `app/api/hrnPipeline/hrnStoragePipeline.ts` — core pipeline: scrape → LLM extract → store in Supabase
- `app/api/hrnPipeline/forumListingScraper.ts` — Playwright scraper that paginates HRN forum listings to collect thread URLs
- `app/api/hrnPipeline/extractionPrompt.ts` — LLM prompt that extracts structured signals (sentiment, repair case, topics, clinic attribution) from raw thread text
- `lib/api/hrn.ts` — data fetch layer: joins `forum_thread_index`, `hrn_thread_content`, `forum_thread_llm_analysis`, and `forum_thread_signals` to build the signals object for the UI
- `lib/scoring/hrn.ts` — pure scoring function computing a 0–10 HRN score using recency-weighted sentiment, Bayesian shrinkage, repair case penalty, long-term follow-up bonus, and issue keyword penalty
- `components/istanbulmedic-connect/profile/HRNSignalsCard.tsx` — UI card displaying the HRN score, sentiment breakdown, photo threads, long-term follow-up count, and notable threads
- `lib/api/hrn.mock.ts` — mock data for local dev/demo (enabled via `NEXT_PUBLIC_USE_MOCK_HRN=true`)
- `supabase/migrations/20260409000000_create_forum_scraping_tables.sql` — DB schema: `forum_thread_index` (hub), `hrn_thread_content` (HRN extension), `forum_thread_signals`, `forum_thread_llm_analysis`, `clinic_forum_profiles`

## Why You Changed It

HRN is the most trusted independent forum for hair transplant patient reviews. Adding it gives us a high-signal, unbiased data source for clinic reputation that's harder to fake than clinic-controlled channels. The pipeline is designed to be non-destructive — read-only on HRN, with LLM attribution running separately so raw data is preserved for re-analysis.

The HRN card is currently **feature-flagged off** (`profileHRN: false` in `lib/filterConfig.ts`) pending approval to run the full production scrape.

## Automated Tests

3 test files, ~50 test cases:

- `tests/unit/hrn-api.test.ts` — unit tests for `getHRNSignals`: null cases (no threads, DB error), correct aggregation of sentiment/topics/photo counts, mock fallback behaviour
- `tests/unit/hrn-score.test.ts` — unit tests for `computeHRNScore`: recency decay, Bayesian shrinkage, repair penalty, long-term follow-up bonus, issue keyword penalty, minimum sample size threshold
- `tests/unit/hrnEntityFilter.test.ts` — unit tests for the entity regex matcher used during clinic attribution in the storage pipeline

**To run:**

```bash
# All HRN tests
npx vitest tests/unit/hrn-api.test.ts tests/unit/hrn-score.test.ts tests/unit/hrnEntityFilter.test.ts

# Or all unit tests
npx vitest tests/unit/
```

## Manual Testing Steps

To see the HRN card populated with mock data locally:

1. Add to `.env.local`:
```
NEXT_PUBLIC_USE_MOCK_HRN=true
```
2. In `lib/filterConfig.ts`, set:
```ts
profileHRN: true,
```
3. Run `npm run dev` and open any clinic profile page
4. Scroll to the bottom — you should see the **HRN Signals** card with score, sentiment breakdown, photo threads, and notable threads

To test with real data (requires approved scrape):

1. Run the listing scraper to collect thread URLs:
```bash
npx tsx app/api/hrnPipeline/forumListingScraper.ts
```
2. Run the storage pipeline to scrape, extract, and store:
```bash
npx tsx app/api/hrnPipeline/hrnStoragePipeline.ts --batch
```
3. Omit `NEXT_PUBLIC_USE_MOCK_HRN` (or set to `false`) and visit a clinic profile that has attributed threads

## Future Steps

- **TODO: set up GitHub Actions to run the automated tests** (currently running manually)
- Get approval to run the full HRN production scrape, then enable `profileHRN: true` in `lib/filterConfig.ts`
- Run `forum-attribute-threads.ts` and `forum-recompute-profiles.ts` after the scrape to populate `clinic_forum_profiles`
- Consider a nightly cron to re-scrape threads marked `is_stale = true` in `clinic_forum_profiles`
