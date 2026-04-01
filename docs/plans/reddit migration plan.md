# Plan: Reddit Data Migration

## Context
The scraper produces a `results.json` with per-user Reddit data (posts, comments, medical_analysis). The goal is to store this as a structured **clinic-level trust signal** on the profile page — not a raw feed. Two concerns drive the schema: (1) the aggregated `ClinicRedditProfile` shape the frontend needs, and (2) a raw post/comment store for auditability and future re-analysis.

---

## Existing Schema Reuse Analysis

| Existing Table | Can Reuse? | Reason |
|---|---|---|
| `sources` | **Yes — as-is** | Already has `source_type='reddit'`, `author_handle`, `url`, `content_hash`. One row per Reddit thread/user. |
| `source_documents` | **No** | No `clinic_id` column (only links via `sources`). Missing Reddit-specific fields: `reddit_post_id`, `score`, `is_firsthand`, `medical_analysis` fields. Polluting it risks breaking generic pipeline queries. |
| `clinic_mentions` | **No** | `mention_topic_enum` doesn't include Reddit themes ('natural_results', 'density', etc.). Adding them via `ALTER TYPE` risks breaking existing queries. No `is_firsthand` field. |
| `clinic_facts` | **Partial** | Could store scalar aggregates (mention_count, confidence_score) but storing `pros[]`, `themes[]`, `notable_mentions[]` as facts is awkward. A single-row profile table is cleaner for the frontend query. |
| `clinic_score_components` | **No** | Reddit sentiment/confidence could feed scores eventually, but that's a separate scoring pass. |

**Conclusion:** `sources` is reused as the entry point. Two new tables are created following the same pattern as `clinic_instagram_posts` (which also bypasses `source_documents` for the same reasons).

---

## Migration File
**Path:** `supabase/migrations/20260323000000_create_reddit_tables.sql`

---

## New Enum
```sql
CREATE TYPE reddit_post_type AS ENUM ('post', 'comment');
```
`themes[].sentiment` and `notable_mentions[].sentiment` use "mixed" — these live inside JSONB so no enum needed there. Existing `sentiment_enum` is not extended to avoid breaking changes.

---

## Table 1: `clinic_reddit_posts` — raw post/comment rows
Mirrors `clinic_instagram_posts`. Raw data for auditability and re-analysis.
Maps to scraper fields: `username`, `all_posts[]`, `all_comments[]`, `medical_analysis`.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | gen_random_uuid() |
| `clinic_id` | uuid FK → clinics NOT NULL | direct FK (source_documents lacks this) |
| `source_id` | uuid FK → sources NULLABLE | link back to sources row for the thread |
| `reddit_post_id` | varchar NOT NULL | Reddit's internal ID, used for dedup |
| `subreddit` | varchar | e.g. "HairTransplants" |
| `post_type` | reddit_post_type NOT NULL | 'post' or 'comment' |
| `url` | text NOT NULL | full permalink |
| `title` | text | top-level posts only |
| `body` | text | post body or comment text |
| `author_username` | varchar | from `username` in results.json |
| `score` | integer DEFAULT 0 | Reddit upvote score |
| `comment_count` | integer DEFAULT 0 | |
| `is_firsthand` | boolean DEFAULT false | firsthand experience vs hearsay |
| `medical_summary` | text | from `medical_analysis.summary` |
| `had_clinical_procedures` | boolean | from `medical_analysis.had_clinical_procedures` |
| `seeking_medical_help` | boolean | from `medical_analysis.seeking_medical_help` |
| `posted_at` | timestamp with time zone | when Reddit post was made |
| `captured_at` | timestamp with time zone NOT NULL DEFAULT now() | when scraped |

**UNIQUE:** `(clinic_id, reddit_post_id)`
**Indexes:** `clinic_id`, `(clinic_id, posted_at DESC)`, `source_id`

---

## Table 2: `clinic_reddit_profiles` — aggregated per-clinic (one row per clinic)
Directly maps to the `ClinicRedditProfile` TypeScript type. Single efficient query for the profile page.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | gen_random_uuid() |
| `clinic_id` | uuid FK → clinics NOT NULL UNIQUE | one profile per clinic |
| `summary` | text | 1–3 sentence AI summary |
| `mention_count` | integer NOT NULL DEFAULT 0 | total matched posts + comments |
| `thread_count` | integer NOT NULL DEFAULT 0 | unique Reddit threads |
| `unique_authors_count` | integer | nullable |
| `last_mentioned_at` | timestamp with time zone | nullable |
| `confidence_score` | numeric(4,3) | CHECK 0–1, nullable |
| `sentiment_score` | numeric(4,3) | CHECK -1–1, nullable |
| `pros` | text[] DEFAULT '{}' | recurring positives |
| `cons` | text[] DEFAULT '{}' | recurring negatives |
| `themes` | jsonb DEFAULT '[]' | `[{label, count, sentiment}]` — Reddit-specific labels kept out of mention_topic_enum |
| `caution_flags` | jsonb DEFAULT '[]' | `[{label, count}]` |
| `notable_mentions` | jsonb DEFAULT '[]' | `[{title?, snippet, url, created_at?, sentiment?, firsthand?}]` |
| `captured_at` | timestamp with time zone NOT NULL DEFAULT now() | when last scraped |
| `updated_at` | timestamp with time zone NOT NULL DEFAULT now() | for cache invalidation |

**Indexes:** `clinic_id` (implicit from UNIQUE), `(clinic_id, last_mentioned_at DESC)`

---

## v1 Lean Subset
All columns are present, but the ingestion script should populate at minimum:
`summary`, `pros`, `cons`, `themes`, `thread_count`, `mention_count`, `last_mentioned_at`, `confidence_score`, `notable_mentions`

Optional for v1: `unique_authors_count`, `sentiment_score`, `caution_flags`

---

## Critical Files
- `supabase/migrations/20260323000000_create_reddit_tables.sql` — new file to create
- `lib/supabase/database.types.ts` — regenerate after migration: `supabase gen types typescript --local`

---

## Migration Style (from existing files)
- `CREATE TABLE public.<name>` (no TABLESPACE clause in newer migrations)
- `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `COMMENT ON TABLE` and `COMMENT ON COLUMN` for non-obvious columns
- `timestamp with time zone` (not `timestamptz` shorthand)
- Naming: `idx_<table>_<column>`, `<table>_<column>_fkey`

---

## Verification
1. `supabase db reset` — migration applies cleanly after `20260302001955_remote_schema.sql`
2. `\dt clinic_reddit*` in psql — confirms both tables exist
3. Insert test row into `clinic_reddit_profiles` with JSONB themes — no constraint errors
4. `supabase gen types typescript --local > lib/supabase/database.types.ts` — both tables appear in generated types
