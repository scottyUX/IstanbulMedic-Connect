-- Doctor Credential Verification Layer
--
-- Extends clinic_team with verification metadata and adds a per-qualification
-- table populated by the scraper. The clinic_team table remains the
-- authoritative roster of "who works at which clinic" — this migration adds
-- a credential layer sourced from public professional directories
-- (ISHRS, IAHRS).

create extension if not exists unaccent;

-- ─────────────────────────────────────────────────────────────────────────────
-- Extend clinic_team
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.clinic_team
  add column if not exists name_normalized text,
  add column if not exists external_ids jsonb not null default '{}'::jsonb,
  add column if not exists last_verified_at timestamptz;

update public.clinic_team
  set name_normalized = lower(unaccent(name))
  where name_normalized is null and name is not null;

create index if not exists clinic_team_name_normalized_idx
  on public.clinic_team(name_normalized);

create index if not exists clinic_team_clinic_name_normalized_idx
  on public.clinic_team(clinic_id, name_normalized);

comment on column public.clinic_team.name_normalized is
  'lower(unaccent(name)) — used by the credential scraper to match the same doctor across sources without diacritic/case noise.';
comment on column public.clinic_team.external_ids is
  'Per-source identifiers, e.g. {"ishrs_id": "50809", "iahrs_slug": "koray-erdogan"}. JSONB so new sources can be added without schema changes.';
comment on column public.clinic_team.last_verified_at is
  'Most recent verification across all sources. See clinic_team_qualifications.verified_at for per-source timestamps.';

-- ─────────────────────────────────────────────────────────────────────────────
-- New table: clinic_team_qualifications
-- ─────────────────────────────────────────────────────────────────────────────

create table public.clinic_team_qualifications (
  id              uuid primary key default gen_random_uuid(),
  team_member_id  uuid not null references public.clinic_team(id) on delete cascade,
  qualification   text not null,
  source          text not null,
  source_url      text,
  verified_at     timestamptz not null default now(),
  unique (team_member_id, qualification, source)
);

create index clinic_team_qualifications_member_id_idx
  on public.clinic_team_qualifications(team_member_id);

comment on table public.clinic_team_qualifications is
  'Per-qualification rows scraped from external professional directories. Re-run of the scraper updates verified_at via upsert; rows are not auto-deleted.';
comment on column public.clinic_team_qualifications.source is
  'Source identifier — currently ''ishrs'' or ''iahrs''.';
comment on column public.clinic_team_qualifications.source_url is
  'Exact URL the qualification was scraped from. Surfaced in the UI as a verification anchor.';

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: public read, no client write (scraper uses the service role)
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.clinic_team_qualifications enable row level security;

create policy "qualifications are readable by anyone"
  on public.clinic_team_qualifications for select using (true);
