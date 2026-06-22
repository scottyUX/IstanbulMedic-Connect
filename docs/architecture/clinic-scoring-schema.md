# Clinic Scoring Schema

## Overview

This document defines the proposed persistence layer for clinic scoring.

The scoring system has three distinct layers:

- source summaries
- pillar scores
- final overall scores

Those layers should be persisted separately so the system remains:

- auditable
- versionable
- explainable
- easy to evolve as formulas change

## Recommended Tables

The proposed scoring subsystem uses three tables:

- `clinic_source_scores`
- `clinic_pillar_scores`
- `clinic_overall_scores`

These tables sit on top of the existing raw and aggregated source tables such as:

- `clinic_google_places`
- `clinic_forum_profiles`
- `forum_thread_llm_analysis`
- `clinic_scraped_data`
- `clinic_credentials`
- `clinic_team`

## Why Separate Tables

### `clinic_source_scores`

Stores source-level public or internal summaries such as:

- Google summary
- future Reddit summary
- future HRN summary

This makes source summaries queryable and versioned without mixing them into pillar logic.

### `clinic_pillar_scores`

Stores the current pillar outputs:

- `reputation_score`
- `evidence_transparency_score`

This is the core trust layer that sits between raw source data and the final score.

### `clinic_overall_scores`

Stores the final weighted clinic ranking score.

This is the table that ranking, sorting, and public overall score displays should use.

## Design Principles

- Keep source summaries, pillars, and final scores separate.
- Version every computed score row with `score_version`.
- Use `is_current` so formulas can be revised without destructive updates.
- Store scoring inputs and weighted breakdowns in `jsonb` for auditability.
- Avoid forcing scoring into `clinic_facts`; it is the wrong abstraction for weighted score snapshots.

## Proposed Table Definitions

### `clinic_source_scores`

One row per `clinic_id + source_name + score_version`.

Use this for:

- public Google source summary
- future Reddit source summary
- future HRN source summary

Suggested `source_name` values:

- `google`
- `reddit`
- `hrn`

Suggested schema:

```sql
create table public.clinic_source_scores (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,

  source_name text not null,
  score_version text not null,

  summary_score numeric(5,2) not null check (summary_score between 0 and 100),
  confidence_score numeric(5,2) check (confidence_score between 0 and 100),

  metrics_json jsonb not null default '{}'::jsonb,
  breakdown_json jsonb not null default '{}'::jsonb,
  explanation text,

  computed_at timestamptz not null default now(),
  is_current boolean not null default true,

  unique (clinic_id, source_name, score_version)
);
```

Example `metrics_json` for Google:

```json
{
  "google_rating_score": 84,
  "google_review_signal": 70
}
```

Example `breakdown_json` for Google:

```json
{
  "weights": {
    "google_rating_score": 0.75,
    "google_review_signal": 0.25
  }
}
```

### `clinic_pillar_scores`

One row per `clinic_id + score_version`.

Suggested schema:

```sql
create table public.clinic_pillar_scores (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,

  score_version text not null,

  reputation_score numeric(5,2) not null check (reputation_score between 0 and 100),
  evidence_transparency_score numeric(5,2) not null check (evidence_transparency_score between 0 and 100),

  metrics_json jsonb not null default '{}'::jsonb,
  breakdown_json jsonb not null default '{}'::jsonb,
  explanation text,

  computed_at timestamptz not null default now(),
  is_current boolean not null default true,

  unique (clinic_id, score_version)
);
```

Example `metrics_json`:

```json
{
  "google_rating_score": 84,
  "google_review_signal": 70,
  "reddit_sentiment_score": 68,
  "hrn_sentiment_score": 74,
  "instagram_boost": 3,
  "reddit_volume_score": 72,
  "reddit_unique_voices_score": 80,
  "hrn_photo_threads_score": 76
}
```

### `clinic_overall_scores`

One row per `clinic_id + score_version`.

Suggested schema:

```sql
create table public.clinic_overall_scores (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,

  score_version text not null,

  overall_score numeric(5,2) not null check (overall_score between 0 and 100),
  reputation_weight numeric(5,2) not null check (reputation_weight between 0 and 1),
  evidence_transparency_weight numeric(5,2) not null check (evidence_transparency_weight between 0 and 1),

  band text,
  metrics_json jsonb not null default '{}'::jsonb,
  breakdown_json jsonb not null default '{}'::jsonb,
  explanation text,

  computed_at timestamptz not null default now(),
  is_current boolean not null default true,

  unique (clinic_id, score_version)
);
```

For the current default model:

- `reputation_weight = 0.60`
- `evidence_transparency_weight = 0.40`

## Indexes

Recommended indexes:

```sql
create index idx_clinic_source_scores_clinic_id
  on public.clinic_source_scores(clinic_id);

create index idx_clinic_source_scores_source_name
  on public.clinic_source_scores(source_name);

create index idx_clinic_source_scores_current
  on public.clinic_source_scores(source_name, clinic_id)
  where is_current = true;

create index idx_clinic_pillar_scores_clinic_id
  on public.clinic_pillar_scores(clinic_id);

create index idx_clinic_pillar_scores_current
  on public.clinic_pillar_scores(clinic_id)
  where is_current = true;

create index idx_clinic_overall_scores_clinic_id
  on public.clinic_overall_scores(clinic_id);

create index idx_clinic_overall_scores_current
  on public.clinic_overall_scores(clinic_id)
  where is_current = true;

create index idx_clinic_overall_scores_score
  on public.clinic_overall_scores(overall_score desc)
  where is_current = true;
```

## Migration Proposal

Below is the proposed migration SQL for introducing the scoring tables.

```sql
-- Create scoring persistence tables for source summaries, pillar scores,
-- and final overall clinic scores.

create table public.clinic_source_scores (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,

  source_name text not null,
  score_version text not null,

  summary_score numeric(5,2) not null
    check (summary_score between 0 and 100),
  confidence_score numeric(5,2)
    check (confidence_score between 0 and 100),

  metrics_json jsonb not null default '{}'::jsonb,
  breakdown_json jsonb not null default '{}'::jsonb,
  explanation text,

  computed_at timestamptz not null default now(),
  is_current boolean not null default true,

  constraint clinic_source_scores_unique
    unique (clinic_id, source_name, score_version)
);

create table public.clinic_pillar_scores (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,

  score_version text not null,

  reputation_score numeric(5,2) not null
    check (reputation_score between 0 and 100),
  evidence_transparency_score numeric(5,2) not null
    check (evidence_transparency_score between 0 and 100),

  metrics_json jsonb not null default '{}'::jsonb,
  breakdown_json jsonb not null default '{}'::jsonb,
  explanation text,

  computed_at timestamptz not null default now(),
  is_current boolean not null default true,

  constraint clinic_pillar_scores_unique
    unique (clinic_id, score_version)
);

create table public.clinic_overall_scores (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,

  score_version text not null,

  overall_score numeric(5,2) not null
    check (overall_score between 0 and 100),
  reputation_weight numeric(5,2) not null
    check (reputation_weight between 0 and 1),
  evidence_transparency_weight numeric(5,2) not null
    check (evidence_transparency_weight between 0 and 1),

  band text,
  metrics_json jsonb not null default '{}'::jsonb,
  breakdown_json jsonb not null default '{}'::jsonb,
  explanation text,

  computed_at timestamptz not null default now(),
  is_current boolean not null default true,

  constraint clinic_overall_scores_unique
    unique (clinic_id, score_version)
);

create index idx_clinic_source_scores_clinic_id
  on public.clinic_source_scores(clinic_id);

create index idx_clinic_source_scores_source_name
  on public.clinic_source_scores(source_name);

create index idx_clinic_source_scores_current
  on public.clinic_source_scores(source_name, clinic_id)
  where is_current = true;

create index idx_clinic_pillar_scores_clinic_id
  on public.clinic_pillar_scores(clinic_id);

create index idx_clinic_pillar_scores_current
  on public.clinic_pillar_scores(clinic_id)
  where is_current = true;

create index idx_clinic_overall_scores_clinic_id
  on public.clinic_overall_scores(clinic_id);

create index idx_clinic_overall_scores_current
  on public.clinic_overall_scores(clinic_id)
  where is_current = true;

create index idx_clinic_overall_scores_score
  on public.clinic_overall_scores(overall_score desc)
  where is_current = true;
```

## Implementation Notes

- `clinic_source_scores` is useful even if only Google summary is defined right now, because Reddit and HRN summaries are expected to follow.
- `metrics_json` should store the normalized metric snapshot used at compute time.
- `breakdown_json` should store the weights or component contributions used to produce the score.
- `is_current` allows keeping historical scoring versions without destructive updates.
- If desired later, the current `clinic_scores` table can be deprecated in favor of `clinic_overall_scores`, or kept as a thin compatibility layer.

## Suggested Migration Filename

If this is implemented as a real Supabase migration, a reasonable filename would be:

`supabase/migrations/20260429000000_create_clinic_scoring_tables.sql`
