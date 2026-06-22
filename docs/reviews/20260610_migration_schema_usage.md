# Migration Schema Usage Review
**Date:** 2026-06-10

## Overview

Reviewed all 26 migration files and 41 tables in `/supabase/migrations/` to identify unused or underused schemas.

---

## Accidentally Pushed to Remote — Must Be Removed

### `clinic_reddit_posts`, `clinic_reddit_profiles`
- These schemas were accidentally pushed to the remote database and should not exist. They need to be removed via a drop migration.
- **Action:** Write a migration to drop both tables from remote. Verify no app code references them before running.

---

## Confirmed Unused — Safe to Drop

### `analyses`
- **Migration:** `20260302001955_remote_schema.sql`
- **Schema:** Tracks code repository analysis (`repo_url`, `commit_sha`, `result_id`)
- **Verdict:** Fully unused. All `analyses` variable references in application code are local variable names querying `forum_thread_llm_analysis`, not this table. No pipeline writes to it, no app code reads it. Only appears in the migration itself, auto-generated `database.types.ts`, and as a listed name in the LangChain schema allowlist test.
- **Action:** Safe to drop with a new migration.

---

## Dead Weight — Requires Decision

### `clinic_mentions`
- **Migration:** `20260210211529_create_initial_tables.sql`
- **Schema:** Relational table linking clinics to source mentions (`clinic_id`, `source_id`, `mention_text`, `topic`, `sentiment`)
- **Verdict:** Half-built design. The table is read in the clinic detail query (`lib/api/clinics.ts:680`) and is accessible via LangChain tools, but it is **never written to by any pipeline**. The actual mention data lives in `forum_thread_llm_analysis.secondary_clinic_mentions` (a JSONB column). The migration comment on that column even acknowledges the intent: *"Stored as jsonb so a junction table can be backfilled later."* That backfill was never built, so `clinic_mentions` contains only static seed data in production.
- **Options:**
  1. **Complete it** — build a backfill from `forum_thread_llm_analysis.secondary_clinic_mentions` into this table so the detail view shows real data.
  2. **Remove it** — drop the table and remove the join in `clinics.ts` and LangChain references if the backfill is not planned.

---

## Lightly Used — Keep, Monitor

### `clinic_pricing`
- 1 reference (clinic detail display only). No pipeline writes reviewed.

### `clinic_source_scores`
- 1 reference. Used in scoring but not surfaced to users directly.

### `forum_thread_signals` / `forum_thread_llm_analysis`
- 1 reference each in app code, but both are core to the forum pipeline. Low app-reference count reflects pipeline-centric design, not disuse.

### `clinic_compliance_history`
- Written by `scripts/ingest-registry/upsert.ts` and queried by `lib/api/registry.ts`. Lightly used because Turkish ministry compliance data is sparse by nature — legitimate usage.

---

## Actively Used — No Action Needed

### `clinic_credentials`
- Queried in `lib/api/clinics.ts` (list + detail views), used by the LangChain agent, referenced in the Leila system prompt, and covered by unit tests. Healthy usage.

### `clinic_forum_profiles`, `clinic_services`, `clinic_media`, `clinic_locations`, `clinic_google_places`
- All 5+ references. Core to the clinic display and scoring system.

### `user_bookmarks`, `consultations`
- Actively used in user-facing features.

---

## Pipeline-Only Tables — Not Unused

### `hrn_thread_content`, `reddit_thread_content`
- Never queried by app code, but written to and read by the forum ingestion pipelines. These are raw staging tables — their low app-reference count is intentional.

### `clinic_mentions` (secondary)
- The `secondary_clinic_mentions` JSONB column on `forum_thread_llm_analysis` is actively written by `llmAttributor.ts` and read by `profileAggregator.ts`, `hrn.ts`, and `reddit.ts`. Not the same as the `clinic_mentions` table.