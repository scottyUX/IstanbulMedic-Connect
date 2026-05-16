# Reddit Post Scraper — IstanbulMedic-Connect

## Context

The platform needs community intelligence from Reddit to surface clinic reputation signals on profile pages. This work runs **in parallel** with the HRN forum scraper already underway. A new unified schema (`docs/plans/forums/forum-scraping-schema.md`) replaces the previous Reddit-specific tables (`clinic_reddit_posts`, `clinic_reddit_profiles`) with a hub + extensions pattern shared between all forum sources.

**Two-layer design principle (from the HRN plan):**
1. **Deterministic layer** — rule-based extraction, always has evidence snippets
2. **LLM layer** — interpretation only, clearly labeled, stored separately

**clinic_id is nullable at scrape time** — attribution (matching post to clinic) happens as a second step via LLM, not during scraping.

---

## Schema

Targeting the new unified schema from `docs/plans/forums/forum-scraping-schema.md`:

```
forum_thread_index          ← hub (clinic_id nullable)
    ↓ 1:1
reddit_thread_content       ← Reddit-specific fields

    ↓ both reference hub id
forum_thread_signals        ← deterministic extractions (EAV)
forum_thread_llm_analysis   ← LLM attribution + sentiment (is_current flag)
clinic_forum_profiles       ← aggregated per (clinic_id, forum_source)
```

SQL migration: `docs/plans/forums/20260409000000_create_forum_scraping_tables.sql` (already drafted — apply this first).

**Old schema cleanup:** Delete `supabase/migrations/20260323000000_create_reddit_tables.sql` — never applied to remote DB, fully superseded by the new unified schema. No data migration needed.

---

## Reddit Scraper — New Files

### `app/api/redditPipeline/redditConfig.ts`
Env-based config (mirrors `reddit-auto/src/config.py`):
```
REDDIT_USER_AGENT=IstanbulMedicConnect/1.0
REDDIT_SUBREDDITS=HairTransplants,TurkeyHairTransplant,HairTransplantTurkey,medical_tourism,tressless
REDDIT_REQUEST_DELAY_MS=1200
REDDIT_MAX_RETRIES=3
REDDIT_RETRY_DELAY_MS=65000
REDDIT_POSTS_PER_SUBREDDIT=100
REDDIT_LOOKBACK_DAYS=365
```

### `app/api/redditPipeline/redditService.ts`
Ports from `reddit-auto/src/services/reddit_collector.py`:
- `makeRedditRequest(url)` — rate limiting (`await sleep(requestDelayMs)`), exponential backoff, 429 handling. Port of `_make_request()`.
- `fetchSubredditPosts(subreddit, options)` — `after` token pagination until `lookbackDays` cutoff. Port of `get_subreddit_users()` pagination loop.
- `fetchPostComments(subreddit, postId, limit)` — top-level comments for a post.

Reddit API endpoints:
```
GET /r/{sub}/new.json?limit=100&after={after}
GET /r/{sub}/comments/{postId}.json?limit=50&depth=2
```

Output: `RawRedditPost[]` matching `reddit_thread_content` columns (id, subreddit, title, body, author, score, comment_count, permalink, created_utc).

No Reddit OAuth needed (public JSON API, same as reddit-auto).

### `app/api/redditPipeline/redditPipeline.ts`
Orchestrator. Scrape-only, no clinic attribution at this stage:
1. For each configured subreddit: paginate `fetchSubredditPosts()` until cutoff.
2. For each post: `INSERT forum_thread_index` (clinic_id = NULL) + `INSERT reddit_thread_content`.
3. Deduplication: unique on `thread_url` in `forum_thread_index`.
4. Optionally fetch comments for posts above a score threshold and insert as separate `forum_thread_index` rows with `post_type = 'comment'`.

---

## Shared Attribution + Signals Pipeline (used by both Reddit and HRN)

These files serve both scrapers — they reference `forum_thread_index.id` regardless of source.

### `app/api/forumPipeline/deterministicExtractor.ts`
Rule-based signal extraction. Runs on `op_text` (HRN) or `body` (Reddit).
Upserts to `forum_thread_signals` with `UNIQUE (thread_id, signal_name)`.

Signals extracted (MVP):
| Signal name | Method | Example value |
|---|---|---|
| `graft_count` | regex: `\b(\d{1,5})\s*grafts?\b` | `3000` |
| `timeline_markers` | regex: `\b(\d+)\s*(month|year)s?\b` | `["6 months", "1 year"]` |
| `has_photos` | direct from scraper field | `true` |
| `reply_count` | direct | `47` |
| `is_repair_case` | keyword: `repair, revision, botched, fix` | `true` |
| `issue_keywords` | keyword list: `shock loss, scarring, infection, density, hairline` | `["shock_loss"]` |

Every signal row stores `evidence_snippet` (the exact text that triggered it) and `extraction_method: 'regex' | 'keyword' | 'direct'`.

### `app/api/forumPipeline/llmAttributor.ts`
Handles the LLM step. Processes unattributed threads (`WHERE clinic_id IS NULL`).

```typescript
// Single thread attribution + analysis
analyzeThread(thread: ForumThreadIndex, content: HrnOrRedditContent, clinicNames: ClinicNameEntry[]): Promise<LlmAnalysisResult>
```

LLM prompt (constrained JSON output, per HRN plan):
```
Given this forum post, respond only in JSON:
{
  "attributed_clinic_name": string | null,
  "attributed_doctor_name": string | null,
  "sentiment": "positive" | "mixed" | "negative",
  "satisfaction": "satisfied" | "mixed" | "regretful",
  "main_topics": (from fixed list),
  "issue_keywords": string[],
  "is_repair_case": boolean,
  "secondary_clinic_mentions": [{clinic_name, doctor_name, role, evidence}],
  "evidence_snippets": {per-field citations},
  "summary": "1-2 sentence neutral summary"
}
Post text: {text}
Clinic list: {names}
```

After analysis:
1. `INSERT forum_thread_llm_analysis` (is_current = true, prev rows set to false).
2. Match `attributed_clinic_name` to `clinics` table (substring normalization — load display names + doctor names from `clinic_team` where role IN surgeon/medical_director/doctor).
3. `UPDATE forum_thread_index SET clinic_id = matched_id, clinic_attribution_method = 'llm'`.
4. `UPDATE clinic_forum_profiles SET is_stale = true` for affected clinic + forum_source.

Model: `gpt-4o-mini` (~$0.0004/thread — ~1,065 tokens in, ~350 tokens out at $0.15/M input, $0.60/M output).

### `app/api/forumPipeline/profileAggregator.ts`
Recomputes stale `clinic_forum_profiles` rows (where `is_stale = true`).

```typescript
recomputeProfile(clinicId: string, forumSource: 'hrn' | 'reddit'): Promise<void>
```

Aggregates across all `forum_thread_index` rows for that clinic + source:
- `thread_count`, `mention_count` (total rows incl. comment-type entries), `photo_thread_count`, `longterm_thread_count` (6m+ timeline marker), `repair_mention_count`, `unique_authors_count`
- `sentiment_distribution`: count positives/mixed/negative from `forum_thread_llm_analysis`
- `sentiment_score`: weighted average (-1 to 1)
- `confidence_score`: `min(1.0, thread_count/20) * consistencyFactor`
- `pros`: most frequent positive themes from `main_topics` across satisfied threads (`satisfaction_label = 'satisfied'`)
- `common_concerns`: most frequent `issue_keywords` across threads
- `notable_threads`: top 5 by score (Reddit) or reply_count (HRN), with summary + has_photos
- `summary`: LLM-generated 1-3 sentence summary of the whole set (single call on the notable_threads digest)

Sets `is_stale = false` + updates `captured_at`.

---

## Import Endpoint

### `app/api/import/reddit/route.ts`
POST endpoint called by the pipeline script. Mirrors `app/api/import/instagram/route.ts`.

Accepts: `{ posts: RawRedditPost[] }` (no `clinicId` — attribution happens separately)

Steps:
1. Upsert `sources` row.
2. For each post: `INSERT forum_thread_index` + `INSERT reddit_thread_content` (deduplicated via `UNIQUE thread_url`).
3. Run `deterministicExtractor` on new posts.
4. Return counts.

---

## Data Fetch Layer

### `lib/api/forumSignals.ts`
```typescript
export async function getForumSignals(clinicId: string, source: 'hrn' | 'reddit'): Promise<ClinicForumProfile | null>
```
Queries `clinic_forum_profiles` by `(clinic_id, forum_source)`.

---

## UI Component

### `components/istanbulmedic-connect/profile/RedditSignalsCard.tsx`
Mirrors `InstagramSignalsCard.tsx`. Uses data from `clinic_forum_profiles WHERE forum_source = 'reddit'`.

Header: Reddit icon, `thread_count`, `unique_authors_count`.

Signal rows (deterministic — no LLM label needed):
- **Volume** — `thread_count ≥ 3` = positive ("enough data"), `< 3` = concern ("limited data")
- **Long-term evidence** — `longterm_thread_count > 0` = positive ("has 6m+ updates")
- **Repair mentions** — `repair_mention_count = 0` = positive, `> 0` = flag (shown as count, not hidden)
- **Firsthand rate** — % `is_firsthand = true` among threads (from `reddit_thread_content`)

AI-assisted section (labeled "AI-assisted"):
- Sentiment bar: `sentiment_score` mapped to visual spectrum
- `pros` tag list (green) — "Frequently praised"
- `common_concerns` tag list (amber) — "Recurring concerns"
- `notable_threads`: 3 shown by default, "Show all N threads" toggle for the rest

---

## Existing Files to Modify

| File | Change |
|---|---|
| `lib/api/clinics.ts` | Add `redditSignals: ClinicForumProfile \| null` to `ClinicDetail`; call `getForumSignals(id, 'reddit')` in `getClinicById()` |
| `components/istanbulmedic-connect/profile/ClinicProfilePage.tsx` | Add `<RedditSignalsCard>` below `InstagramSignalsCard` in full-width sections |
| `lib/filterConfig.ts` | Add `profileRedditSignals: false` to `FEATURE_CONFIG` (enable after data populated) |
| `.env.local` | Add Reddit config vars + `FORUM_LLM_MODEL=gpt-4o-mini` |

---

## Scripts

| Script | Purpose |
|---|---|
| `scripts/reddit-scrape-subreddits.ts` | Scrapes subreddits → inserts into forum_thread_index + reddit_thread_content |
| `scripts/forum-attribute-threads.ts` | Runs LLM attribution on unattributed threads (both HRN and Reddit) |
| `scripts/forum-recompute-profiles.ts` | Recomputes all stale clinic_forum_profiles |

---

## Critical Reference Files

- `docs/plans/forums/forum-scraping-schema.md` — unified schema (source of truth)
- `docs/plans/forums/20260409000000_create_forum_scraping_tables.sql` — migration to apply
- `app/api/import/instagram/route.ts` — import endpoint pattern
- `components/istanbulmedic-connect/profile/InstagramSignalsCard.tsx` — UI card pattern
- `reddit-auto/src/services/reddit_collector.py` — rate limiting / pagination to port to TS

---

## Verification

0. **Cleanup** — delete `supabase/migrations/20260323000000_create_reddit_tables.sql`.

1. **Apply migration** — run `docs/plans/forums/20260409000000_create_forum_scraping_tables.sql` against local Supabase. Verify new tables exist (`forum_thread_index`, `reddit_thread_content`, `hrn_thread_content`, `forum_thread_signals`, `forum_thread_llm_analysis`, `clinic_forum_profiles`).

2. **Reddit dry run** — `npx tsx scripts/reddit-scrape-subreddits.ts --dry-run`. Prints posts without writing to DB.

3. **Reddit end-to-end** — run full scrape for 1 subreddit. Verify `forum_thread_index` has rows with `clinic_id = NULL`, `reddit_thread_content` has corresponding rows, `forum_thread_signals` has deterministic extractions with evidence snippets.

4. **Attribution** — run `scripts/forum-attribute-threads.ts`. Verify `clinic_id` fills in on matched threads, `forum_thread_llm_analysis` rows created with `is_current = true`.

5. **Profile recompute** — run `scripts/forum-recompute-profiles.ts`. Verify `clinic_forum_profiles` has rows with non-null `sentiment_score`, `pros`, `common_concerns`, `mention_count`, `notable_threads`.

6. **Deduplication** — run Reddit scrape twice. Verify `forum_thread_index` row count does not increase.

7. **UI** — enable `profileRedditSignals: true`, load a clinic profile. Verify `RedditSignalsCard` renders with real data.
