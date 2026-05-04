# Forum Scraping Schema — Proposed Design

**Last Updated:** 2026-04-09
**Status:** Draft — for review before migration

---

## Architecture: Hub + Extensions

A thin **hub table** holds the fields common to every forum source. **Platform-specific extension tables** hold the fields that diverge. The downstream pipeline tables (signals, LLM analysis, profiles) reference the hub — so they are unified across all sources regardless of whether the content came from HRN, Reddit, or anything else.

```
               forum_thread_index          ← hub (common fields only)
               ┌──────────────────────────────────┐
               │ id, clinic_id, forum_source      │
               │ thread_url, title, author        │
               │ post_date, attribution fields    │
               │ first/last_scraped_at            │
               └──────────────┬───────────────────┘
                              │  1:1 FK
          ┌───────────────────┼──────────────────────┐
          ▼                   ▼                      ▼
hrn_thread_content   reddit_thread_content   (future sources)
──────────────────   ─────────────────────
op_text              subreddit
op_html              reddit_post_id
last_author_post_*   score
forum_section_id     post_type
sitemap_lastmod      is_firsthand
total_pages          had_clinical_procedures
image_urls           seeking_medical_help
scrape_strategy      image_urls

          │                   │
          └─────────┬─────────┘
                    ▼  (all reference forum_thread_index.id)
       forum_thread_signals          ← unified
       forum_thread_llm_analysis     ← unified
       clinic_forum_profiles         ← unified (one row per clinic per source)
```

### Why this pattern

- The downstream tables (`signals`, `llm_analysis`, `profiles`) don't care which platform content came from — they reference the hub ID and work identically for all sources.
- Platform-specific fields stay isolated in their own tables. No wide nullable columns.
- Adding a new forum source = new extension table + new enum value. Nothing else changes.
- The 1:1 join from hub → extension is effectively free in Postgres (both on PK/FK).

### Reddit refactor

The existing `clinic_reddit_posts` and `clinic_reddit_profiles` tables will be migrated into this pattern:
- `clinic_reddit_posts` → split into `forum_thread_index` rows + `reddit_thread_content` rows
- `clinic_reddit_profiles` → migrated into `clinic_forum_profiles` with `forum_source = 'reddit'`

---

## Enum: `forum_source_enum`

```sql
CREATE TYPE forum_source_enum AS ENUM ('hrn', 'reddit', 'realself');
```

Reddit is included here because the downstream tables are unified. The raw content differences are handled by the extension tables.

---

## Table 1: `forum_thread_index`

The hub. One row per unique thread URL across all forum sources. Common fields only — nothing platform-specific lives here.

`clinic_id` is nullable because both HRN and Reddit scraping may happen before clinic attribution. The LLM attribution step fills it in after the fact.

### Columns

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `clinic_id` | uuid | FK → `clinics`. **Nullable** — filled in after LLM attribution |
| `source_id` | uuid | FK → `sources`. For provenance tracking |
| `forum_source` | forum_source_enum | `'hrn'` \| `'reddit'` \| `'realself'` |
| `thread_url` | text | **Unique** — deduplication key across all sources |
| `title` | text | Thread or post title |
| `author_username` | varchar | Who wrote the original post |
| `post_date` | timestamptz | When the original post was published |
| `reply_count` | integer | Total replies at time of scrape |
| `clinic_attribution_method` | varchar | `'url'` \| `'llm'` \| `'manual'` \| null if unattributed |
| `first_scraped_at` | timestamptz | When we first captured this thread |
| `last_scraped_at` | timestamptz | When we last scraped it (updated on re-scrape) |

### Indexes

- `clinic_id` — all threads for a clinic
- `(forum_source, post_date DESC)` — recent threads per source
- `thread_url` — deduplication on insert

---

## Table 2: `hrn_thread_content`

HRN-specific fields. One row per `forum_thread_index` row where `forum_source = 'hrn'`. Always joined to the hub via `thread_id`.

### Columns

| Column | Type | Notes |
|--------|------|-------|
| `thread_id` | uuid | PK + FK → `forum_thread_index` |
| `forum_section_id` | varchar | e.g. `'24'` for Hair Transplant Reviews, `'17'` for Clinic Results |
| `forum_section_name` | varchar | Human-readable section label |
| `view_count` | integer | Nullable — not always present on HRN |
| `total_pages` | integer | Number of pages in the thread |
| `op_text` | text | Full text of the original post |
| `op_html` | text | Raw HTML (kept for re-parsing if selectors change) |
| `last_author_post_text` | text | Most recent post by the OP — captures long-term updates |
| `last_author_post_date` | timestamptz | Date of that last OP post |
| `last_author_post_page` | integer | Which page it was found on |
| `has_photos` | boolean | Whether any photos were found in the thread |
| `image_urls` | text[] | All image URLs extracted |
| `scrape_strategy` | varchar | `'op_only'` \| `'op_and_last'` \| `'paginated'` |
| `sitemap_lastmod` | timestamptz | `lastmod` from HRN sitemap — used to detect when re-scraping is needed |

---

## Table 3: `reddit_thread_content`

Reddit-specific fields. One row per `forum_thread_index` row where `forum_source = 'reddit'`. Replaces `clinic_reddit_posts` after the refactor.

### Columns

| Column | Type | Notes |
|--------|------|-------|
| `thread_id` | uuid | PK + FK → `forum_thread_index` |
| `reddit_post_id` | varchar | Reddit's internal ID (e.g. `t3_abc123`) — for deduplication |
| `subreddit` | varchar | Without `r/` prefix, e.g. `HairTransplants` |
| `post_type` | varchar | `'post'` \| `'comment'` |
| `body` | text | Post or comment body text |
| `score` | integer | Upvote score at time of scrape |
| `comment_count` | integer | Number of comments (for top-level posts) |
| `is_firsthand` | boolean | Author describes their own experience vs. asking/commenting |
| `had_clinical_procedures` | boolean | Author had a procedure (not just researching) |
| `seeking_medical_help` | boolean | Author is actively looking for a clinic or advice |

---

## Table 4: `forum_thread_signals`

Deterministic signals (regex/keyword) extracted from thread content. One row per signal per thread. References the hub so it works identically for HRN and Reddit content.

**Why EAV and not columns?** Signals grow over time and vary per thread. This lets us add new signal types without schema changes, and stores the evidence snippet alongside each one.

### Columns

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `thread_id` | uuid | FK → `forum_thread_index` |
| `signal_name` | varchar | e.g. `'graft_count'`, `'timeline_markers'`, `'has_photos'` |
| `signal_value` | jsonb | Flexible — number (`3000`), array (`["6 months", "1 year"]`), boolean (`true`) |
| `evidence_snippet` | text | Exact text that triggered this extraction |
| `extraction_method` | varchar | `'regex'` \| `'keyword'` \| `'direct'` |
| `extraction_version` | varchar | e.g. `'v1.0'` — for reproducibility |
| `created_at` | timestamptz | |

### Constraint

`UNIQUE (thread_id, signal_name)` — one value per signal per thread. Re-running extraction upserts.

### Signal Name Reference (MVP)

| Signal Name | Value Type | Method | Example |
|-------------|-----------|--------|---------|
| `graft_count` | number | regex | `3000` |
| `timeline_markers` | string[] | regex | `["6 months", "1 year"]` |
| `has_photos` | boolean | direct | `true` |
| `reply_count` | number | direct | `47` |
| `view_count` | number | direct | `1200` |

---

## Table 5: `forum_thread_llm_analysis`

LLM-derived signals. Kept separate from `forum_thread_signals` because all LLM fields come from a single prompt call and need to be versioned together — when you re-run with an improved prompt, you replace the whole analysis atomically, not signal by signal.

References the hub so it works for both HRN and Reddit threads.

### Columns

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `thread_id` | uuid | FK → `forum_thread_index` |
| `attributed_clinic_name` | varchar | Clinic name as extracted from thread text |
| `attributed_doctor_name` | varchar | Doctor name as extracted |
| `attributed_clinic_id` | uuid | FK → `clinics` — matched after name resolution, nullable |
| `sentiment_label` | varchar | `'positive'` \| `'mixed'` \| `'negative'` |
| `satisfaction_label` | varchar | `'satisfied'` \| `'mixed'` \| `'regretful'` |
| `summary_short` | text | 1-2 sentence neutral summary |
| `main_topics` | text[] | e.g. `['density', 'hairline', 'donor_area', 'healing']` |
| `issue_keywords` | text[] | Negation-aware, e.g. `['shock_loss', 'scarring']` |
| `is_repair_case` | boolean | Whether this describes a repair/revision procedure |
| `secondary_clinic_mentions` | jsonb | Other clinics/doctors found in the thread that aren't the primary subject. Default `[]`. Stored as jsonb so a junction table can be backfilled later without re-running the LLM. Format: `[{ clinic_name, doctor_name, role, sentiment, evidence }]`. Role values: `'mentioned'` \| `'compared'` \| `'repair_source'` |
| `evidence_snippets` | jsonb | Per-signal citations: `{ "is_repair_case": "...text...", "sentiment": "...text..." }` |
| `model_name` | varchar | e.g. `'gpt-4o-mini'` |
| `prompt_version` | varchar | e.g. `'v1.0'` |
| `run_timestamp` | timestamptz | When this LLM run executed |
| `is_current` | boolean | `true` for the latest run — `false` for historical runs |

### Re-run Behavior

When re-running with a new prompt:
1. Set `is_current = false` on all existing rows for that `thread_id`
2. Insert new row with `is_current = true`

Queries always filter `WHERE is_current = true`. Full history is preserved without overwriting.

### Topic Reference

Valid values for `main_topics`:

`density` · `hairline` · `donor_area` · `healing` · `communication` · `value` · `doctor_involvement` · `technician_quality` · `aftercare` · `natural_results` · `other`

---

## Table 6: `clinic_forum_profiles`

Aggregated profile per clinic per forum source. Replaces both `clinic_reddit_profiles` and the previously proposed HRN-only profile table. One row per `(clinic_id, forum_source)`.

### Columns

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `clinic_id` | uuid | FK → `clinics` |
| `forum_source` | forum_source_enum | Which forum this aggregates |
| `summary` | text | 1-3 sentence AI summary of the clinic's reputation on this forum |
| `thread_count` | integer | Total attributed threads |
| `photo_thread_count` | integer | Threads with photo evidence |
| `longterm_thread_count` | integer | Threads with 6m+ or 12m+ timeline markers |
| `repair_mention_count` | integer | Threads flagged as repair/revision cases |
| `unique_authors_count` | integer | Distinct author usernames |
| `last_thread_at` | timestamptz | Date of the most recent attributed thread |
| `confidence_score` | numeric(4,3) | 0–1 reliability signal based on volume and consistency |
| `sentiment_score` | numeric(4,3) | -1 (very negative) to 1 (very positive) aggregate |
| `sentiment_distribution` | jsonb | `{ "positive": 14, "mixed": 6, "negative": 3 }` |
| `common_concerns` | text[] | Most frequent issue keywords across threads |
| `notable_threads` | jsonb | Array of `{ title, url, summary, sentiment, has_photos }` |
| `is_stale` | boolean | Set to `true` when a new thread is attributed — triggers recompute |
| `captured_at` | timestamptz | When this profile was last computed |
| `updated_at` | timestamptz | Updated on every recompute |

### Constraint

`UNIQUE (clinic_id, forum_source)` — one profile per clinic per forum.

### Staleness Strategy

When a new thread is attributed to a clinic (either on insert or when `clinic_id` is filled in by LLM), set `is_stale = true` on the corresponding profile row. A background job recomputes stale profiles on a schedule (e.g. nightly).

---

## Pipeline Flow

```
Scraper (HRN or Reddit)
  → INSERT forum_thread_index       (clinic_id = NULL)
  → INSERT hrn_thread_content       (or reddit_thread_content)

Regex/keyword extractor
  → UPSERT forum_thread_signals
      graft_count, timeline_markers, has_photos, ...
      evidence_snippet per signal

LLM extractor (~$0.0003/thread with Haiku)
  → INSERT forum_thread_llm_analysis  (is_current = true)
      clinic/doctor attribution, sentiment, topics, evidence
  → UPDATE forum_thread_index SET clinic_id = attributed_clinic_id
  → UPDATE clinic_forum_profiles SET is_stale = true

Profile aggregator (nightly or on-demand)
  → UPSERT clinic_forum_profiles
      roll up signals + LLM analysis across all threads for that source
```

---

## Migration Plan (Reddit Refactor)

| Step | Action |
|------|--------|
| 1 | Create `forum_thread_index`, `reddit_thread_content`, `hrn_thread_content` |
| 2 | Create `forum_thread_signals`, `forum_thread_llm_analysis`, `clinic_forum_profiles` |
| 3 | Migrate `clinic_reddit_posts` → insert into `forum_thread_index` + `reddit_thread_content` |
| 4 | Migrate `clinic_reddit_profiles` → insert into `clinic_forum_profiles` with `forum_source = 'reddit'` |
| 5 | Drop `clinic_reddit_posts`, `clinic_reddit_profiles` |

---

## What's NOT in Scope

- Storing every reply in a thread (only OP + last author post for HRN; top-level posts + matched comments for Reddit)
- A separate images table (URLs stored as array on `hrn_thread_content` is sufficient for MVP)
- Auto-discovery of clinics from content (LLM attribution matches to existing `clinics` rows only)
- A many-to-many junction table for multi-clinic threads — secondary mentions are captured in `forum_thread_llm_analysis.secondary_clinic_mentions` (jsonb) so the data is preserved and a junction table can be backfilled later without re-running the LLM
