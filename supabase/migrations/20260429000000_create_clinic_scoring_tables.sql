-- Clinic Source Scores Migration
-- Adds per-source scoring summaries (Google, Reddit, HRN) as a separate layer
-- from pillar and overall scores, which are handled by existing tables.

create table public.clinic_source_scores (
  id                uuid         primary key default gen_random_uuid(),
  clinic_id         uuid         not null references public.clinics(id) on delete cascade,

  source_name       text         not null,   -- 'google' | 'reddit' | 'hrn'
  score_version     text         not null,

  summary_score     numeric(5,2) not null
                      check (summary_score between 0 and 100),
  confidence_score  numeric(5,2)
                      check (confidence_score between 0 and 100),

  -- Snapshot of normalized metrics used at compute time.
  -- e.g. { "google_rating_score": 84, "google_review_signal": 70 }
  metrics_json      jsonb        not null default '{}'::jsonb,

  -- Weights / component contributions used to produce the score.
  -- e.g. { "weights": { "google_rating_score": 0.75, "google_review_signal": 0.25 } }
  breakdown_json    jsonb        not null default '{}'::jsonb,

  explanation       text,

  computed_at       timestamptz  not null default now(),
  is_current        boolean      not null default true,

  constraint clinic_source_scores_unique
    unique (clinic_id, source_name, score_version)
);

create index idx_clinic_source_scores_clinic_id
  on public.clinic_source_scores(clinic_id);

create index idx_clinic_source_scores_source_name
  on public.clinic_source_scores(source_name);

-- Efficient lookup of the current score for a given source across all clinics.
create index idx_clinic_source_scores_current
  on public.clinic_source_scores(source_name, clinic_id)
  where is_current = true;
