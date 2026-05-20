# HRN Implementation — Architecture & Design Reference

**Last Updated:** 2026-04-23  
**Status:** Complete. Frontend showing real data. HRN Score implemented. Pending HRN permission + full batch scrape.

For development history, test results, and solved blockers see `docs/hrn-scraper-progress.md`.

---

## What It Does

Scrapes public patient threads from Hair Restoration Network (HRN), extracts structured signals via LLM, stores them in Supabase, and surfaces per-clinic aggregates on the clinic profile page. The result is a "Forum Evidence" card showing community sentiment, photo evidence rate, long-term follow-up rate, repair case count, and top discussion topics — all sourced from real patient posts, not the clinic.

---

## Architecture Overview

```
HRN Website (forums 17, 24, 89)
    ↓  Playwright browser automation
forumListingScraper     →  thread URL list (~28,650 URLs)
    ↓
hrnStoragePipeline      →  per-thread: scrape → entity filter → LLM → store
    ↓
Supabase (5 tables)
    ↓
lib/api/hrn.ts          →  query + aggregate per clinic
    ↓
HRNSignalsCard.tsx      →  render on clinic profile page
```

---

## Layer 1 — Scraping

### `app/api/hrnPipeline/forumListingScraper.ts`

Paginates through forum listing pages for forums 17 (Clinic Results), 24 (Reviews), and 89 (Repairs) to collect all thread URLs. Uses a fresh Playwright browser context per page to avoid Cloudflare session-based blocking. Outputs a list of ~28,650 URLs.

### `app/api/hrnPipeline/hrnScraperTest.ts`

Given a single thread URL, visits the page with Playwright and extracts:
- Title, author, post date, reply count
- Full OP text + HTML
- Last post by the same author (captures long-term result updates — the most valuable signal)
- Has photos flag + all image URLs
- Total page count

The `scrapeHRNThread(url)` function is what the pipeline calls per thread. Takes ~11s for single-page threads, ~21s for multi-page.

---

## Layer 2 — Pipeline Orchestration

### `app/api/hrnPipeline/hrnStoragePipeline.ts`

The main orchestrator. Key functions:

**Per-thread flow:**
```
processThread(url)
  1. scrapeHRNThread(url)         → raw content
  2. matchesKnownEntity()         → skip LLM if no known clinic/doctor found
  3. extractThreadSignals()       → LLM extraction
  4. resolveClinicId()            → clinic name → UUID
  5. upsert to DB (3 tables)
```

**Entity filter functions:**
- `loadKnownClinicKeywords()` — loads all clinic names + doctor names from `clinics` + `clinic_team` tables
- `buildEntityRegex()` — compiles a single regex from all names; strips "Dr." prefix to match bare surnames; skips generic stopwords (hair, clinic, medical, istanbul) to avoid false positives
- `matchesKnownEntity(title, opText, regex)` — checks thread text before calling the LLM. If no known entity is mentioned, the thread is skipped. Saves ~$0.0008 per filtered thread.

**Clinic attribution functions:**
- `buildClinicNameMap()` — `Map<clinic name → UUID>` for the lookup after LLM returns
- `buildClinicDoctorMap()` — `Map<clinic UUID → doctor names[]>` to annotate each clinic in the LLM prompt
- `resolveClinicId(name, map)` — case-insensitive exact match, with a contains fallback as a safety net

---

## Layer 3 — LLM Extraction

### `app/api/hrnPipeline/extractionPrompt.ts`

GPT-4o-mini with OpenAI function calling (prompt version v1.1). One call per thread returns a structured `ExtractionResult`:

| Field | Type | Notes |
|---|---|---|
| `attributed_clinic_name` | string \| null | Returned exactly as it appears in the known clinics list |
| `attributed_doctor_name` | string \| null | Format "Dr. [Last Name]" |
| `sentiment_label` | positive \| mixed \| negative | |
| `sentiment_score` | -1.0 to 1.0 | Numeric score for future aggregation |
| `satisfaction_label` | satisfied \| mixed \| regretful | |
| `summary_short` | string | 1-2 sentences, neutral language |
| `main_topics` | string[] | Fixed enum: density, hairline, donor_area, healing, communication, value, etc. |
| `issue_keywords` | string[] | Negation-aware — only includes issues the author actually experienced |
| `is_repair_case` | boolean | True only if THIS procedure was a repair of a previous transplant |
| `has_12_month_followup` | boolean | True if thread contains 12+ month results |
| `secondary_clinic_mentions` | array | Other clinics mentioned but not the primary subject |
| `evidence_snippets` | object | Exact quotes supporting each classification |

**Why function calling over prompt-based JSON:** Schema-validated output on every call. No need to parse free-form JSON or handle malformed responses.

**Why GPT-4o-mini over Claude Haiku:** ~$0.0008/thread vs ~$0.0014. At 28K threads, saves ~$17. Team already had the API key.

### Clinic Attribution Design

The LLM is given the full known clinics list (with associated doctors) and instructed to return the clinic name **exactly as listed** when a match is found. This turns attribution into a trivial case-insensitive string lookup — no fuzzy matching needed.

```
Prompt includes:
## Known Clinics
- Cosmedica Hair Transplantation Clinic
  Doctors: Dr. Levent Acar
- ASMED Medical Center
  Doctors: Dr. Koray Erdogan
...

LLM returns: "Cosmedica Hair Transplantation Clinic"
resolveClinicId() → exact match → UUID
```

**Why name not UUID:** LLMs can transpose characters in 36-char UUIDs → silent wrong attribution. A name mismatch → `null` → safe failure with a log entry.

**Doctor→clinic resolution:** The prompt lists each doctor under their clinic, so a thread about "Dr. Levent Acar" (no clinic name mentioned) resolves to the correct clinic UUID via the doctor association.

---

## Layer 4 — Database

### Schema Design: Why Five Tables

All four thread tables connect through `thread_id` (the `id` from `forum_thread_index`):

```
forum_thread_index.id  (primary key)
    │
    ├── hrn_thread_content.thread_id        1:1
    ├── forum_thread_llm_analysis.thread_id  1:many (versioned)
    └── forum_thread_signals.thread_id       1:many (EAV)
```

**`forum_thread_index` + `hrn_thread_content` — hub + extension pattern**

`forum_thread_index` holds only source-agnostic fields: URL, title, author, post date, clinic attribution. Fields specific to HRN (op text, image URLs, last author post, forum section) live in `hrn_thread_content` as a 1:1 extension.

When Reddit or RealSelf are added (both already in the `forum_source_enum`), they get their own extension tables (`reddit_thread_content`, etc.). The downstream tables — signals and LLM analysis — work identically for all sources without schema changes.

**`forum_thread_signals` vs `forum_thread_llm_analysis` — deterministic vs versioned**

These are separated because they have different trust and versioning properties:

- `forum_thread_signals` is deterministic — a regex either matches or it doesn't. Re-running gives the same result. Simple EAV (one row per signal per thread), no versioning needed.

- `forum_thread_llm_analysis` is non-deterministic — the LLM can return a different answer if re-run with a new prompt or model. Every re-run inserts a new row; the old row is marked `is_current = false`. This preserves history and lets you re-process threads when the prompt improves without losing prior results.

Keeping them separate means you can re-run signals extraction without touching LLM rows, and vice versa. Their update lifecycles are fully decoupled.

**`clinic_forum_profiles` — aggregated cache (not yet populated)**

Exists in the schema but is not yet written to. The current frontend data layer queries raw tables and computes aggregates in memory. Once the full batch runs and there is real traffic, a nightly job will:
1. Find clinics where `is_stale = true` (set automatically when a new thread is attributed)
2. Aggregate thread counts, sentiment distribution, photo rate, followup rate, repair count
3. Write to `clinic_forum_profiles`
4. Frontend switches to reading from this table for performance

### Table Summary

| Table | Purpose | Relationship |
|---|---|---|
| `forum_thread_index` | Hub — one row per thread URL, clinic attribution | Primary key |
| `hrn_thread_content` | HRN-specific content — op text, photos, last author post | 1:1 with hub |
| `forum_thread_llm_analysis` | LLM output, versioned by prompt run | Many per thread, `is_current` flag |
| `forum_thread_signals` | Deterministic EAV signals | Many per thread |
| `clinic_forum_profiles` | Aggregated per clinic (not yet populated) | One per clinic per source |

---

## Layer 5 — Frontend Data Layer

### `lib/api/hrn.ts`

`getHRNSignals(clinicId): Promise<HRNSignalsData | null>`

Queries raw tables (bypassing the unpopulated `clinic_forum_profiles`). Runs four queries in parallel via `Promise.all`:
1. `forum_thread_index` — all HRN threads for this clinic
2. `forum_thread_llm_analysis` — LLM results where `is_current = true`
3. `hrn_thread_content` — photo data
4. `forum_thread_signals` — `has_12_month_followup` signal rows

Joins in memory using Maps (O(1) lookup per thread). Computes aggregates in JS:
- Sentiment counts (positive / mixed / negative)
- `photoThreadsList` — threads where `has_photos = true`
- `longTermFollowups` — count of threads with the followup signal
- `repairCases` — count of threads where `is_repair_case = true`
- `topTopics` — top 5 topics by frequency, flattened across all `main_topics` arrays
- `hrnScore` + `hrnScoreBreakdown` — computed via `computeHRNScore()` from `lib/scoring/hrn.ts`

Returns `null` if no threads are attributed to this clinic.

### `lib/api/clinics.ts`

`getClinicDetail()` calls `getHRNSignals` in parallel with `getInstagramSignals` via `Promise.all`. Result is stored on `ClinicDetail.hrnSignals: HRNSignalsData | null`.

---

## Layer 6 — UI

### `components/istanbulmedic-connect/profile/HRNSignalsCard.tsx`

Self-contained card component. Accepts `HRNSignalsData` and renders:
- **HRN Score** — numeric display with color coding (emerald ≥ 7.5, amber 5.0–7.4, red < 5.0), confidence tier badge ("High confidence / Moderate / Low confidence · N threads"), inline score breakdown (sentiment contribution, follow-up bonus, repair penalty, severity penalty), and a "How is this calculated?" tooltip. Shows "Insufficient data" when `hrnScore` is undefined.
- **Community Sentiment** — segmented bar (positive / mixed / negative) with AI-assisted badge
- **Stats list** — photo %, followup %, repair cases (zero = green checkmark, non-zero = amber wrench)
- **Topic tags** — top topics prettified from snake_case
- **Recent threads preview** — first 3 threads inline
- **Three modals** — photo threads, repair threads (with neutral context notice), all threads

Repair case display is a binary: zero → green "No repair case threads", non-zero → amber count + "See context →" modal. Amber rather than red because repair cases can be either repairs *performed at* this clinic or repairs *needed after* treatment elsewhere — the modal notice explains this.

### `components/istanbulmedic-connect/profile/ClinicProfilePage.tsx`

Renders `<HRNSignalsCard>` in the full-width section below reviews, alongside the Instagram card. Gated on `clinic.hrnSignals` being non-null. Vera Clinic renders demo data (`DEMO_HRN_SIGNALS`) for UI demonstration purposes.

---

## Tests

| File | Coverage |
|---|---|
| `tests/unit/hrnEntityFilter.test.ts` | 14 tests — `buildEntityRegex` + `matchesKnownEntity`. Covers full name, bare surname, case insensitivity, stopword filtering, special characters. |
| `tests/unit/hrn-api.test.ts` | 9 tests — `getHRNSignals`. Covers null/error cases, sentiment aggregation, partial data (no LLM analysis), photo threads, followup signal, repair cases, topic frequency ranking. |
| `tests/unit/hrn-score.test.ts` | 19 tests — `computeHRNScore`. Covers: minimum threshold (`effectiveN < 4` → undefined), confidence tiers, Bayesian shrinkage, recency decay, repair penalty and cap, follow-up bonus and cap, HIGH/MED severity issue penalties and cap, score clamping to 0–10, null `sentimentScore` fallback. |

---

## One-off Tooling

### `app/api/hrnPipeline/seedLocalClinics.ts`

Copies `clinics` + `clinic_team` from prod → local Supabase via the API (no DB password needed). Uses `PROD_SUPABASE_URL` + `PROD_SUPABASE_SERVICE_ROLE_KEY` from `.env.local`. Run once to set up a local dev environment with real clinic data so the entity filter and attribution work correctly against the same set of clinics as production.

---

## Key Design Decisions

| Decision | Alternative Considered | Reason |
|---|---|---|
| Playwright over HTTP requests | BeautifulSoup / fetch | HRN uses Cloudflare — requires a real browser |
| Fresh browser context per page | Reuse session | Solved Cloudflare session-based blocking on pagination |
| GPT-4o-mini with function calling | Claude Haiku / prompt JSON | Cheaper at scale; schema-validated output |
| LLM returns clinic name, not UUID | LLM returns UUID directly | LLMs transpose chars in UUIDs → silent wrong attribution |
| Doctor→clinic in LLM prompt | Post-process doctor name | Enables attribution when clinic name never appears in thread |
| Hub + extension table pattern | Single wide table | Allows Reddit/RealSelf extension without schema changes |
| Deterministic signals separate from LLM | Combined table | Different versioning semantics — signals are immutable, LLM rows are versioned |
| Aggregate in JS, not SQL | SQL aggregation | Avoids complex multi-join query; data volumes are small per clinic |
| HRN Score computed at query time (v1) | Pre-computed in `clinic_forum_profiles` | Unblocks the UI before batch data exists; simple migration to pre-compute once full batch runs |
| Bayesian shrinkage toward 5.0 | Raw mean | Prevents low-N clinics (2–3 threads) from dominating the leaderboard with extreme scores |
| Recency decay (1.0 / 0.7 / 0.5 / 0.3) | Equal weighting | Hair transplant results evolve; a clinic's reputation 3+ years ago is less relevant than recent posts |

---

## What's Next

1. **Contact HRN for permission** — ToS prohibits automated access. The implementation is ready; the question is whether to proceed. Contact: `copyright@HairTransplantNetwork.com`.
2. **50-thread pilot** — Validate pipeline at scale before the full run. Check attribution accuracy, cost per thread, and error rate on a diverse sample.
3. **Calibrate score constants** — After the pilot, check the real score distribution and tune `k` (prior weight), decay weights, and penalty caps in `lib/scoring/hrn.ts`. See `docs/hrn-score-plan.md` for the full formula.
4. **Full batch** — 28K threads across 4 parallel Playwright contexts (~29 hours, ~$23 LLM cost). Pipeline needs resume capability before starting (skip already-processed URLs via the unique constraint on `thread_url`).
5. **`clinic_forum_profiles` aggregation job** — Once data exists at scale, replace raw-table queries with reads from the pre-aggregated table, and move score computation into the pipeline rather than at query time.
