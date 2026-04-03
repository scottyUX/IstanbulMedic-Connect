-- Create users, user_profiles, and all user onboarding tables
-- Migration: 20260314000000_create_user_profiles.sql

-- Helper function to auto-update updated_at timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Users table
create table public.users (
  id uuid not null default gen_random_uuid(),
  auth_id text null,
  name text null,
  email text null,
  phone_number text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  deleted boolean null default false,
  constraint users_pkey primary key (id),
  constraint uq_user_auth_id unique (auth_id)
) tablespace pg_default;

create index if not exists idx_users_phone_number on public.users using btree (phone_number) tablespace pg_default;

create index if not exists idx_users_auth_id on public.users using btree (auth_id) tablespace pg_default;

create trigger update_users_updated_at
  before update on users
  for each row
  execute function update_updated_at_column();

-- User profiles table (extended info, references users)
create table public.user_profiles (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  first_name text not null,
  last_name text not null,
  date_of_birth date null,
  gender text null,
  nationality text null,
  preferred_language text null default 'en'::text,
  timezone text null default 'UTC'::text,
  profile_picture_url text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  deleted boolean null default false,
  constraint user_profiles_pkey primary key (id),
  constraint user_profiles_user_id_key unique (user_id),
  constraint user_profiles_user_id_fkey foreign key (user_id) references users (id) on delete cascade,
  constraint user_profiles_gender_check check (
    gender = any (array['male'::text, 'female'::text, 'other'::text, 'prefer_not_to_say'::text])
  )
) tablespace pg_default;

create trigger update_user_profiles_updated_at
  before update on user_profiles
  for each row
  execute function update_updated_at_column();

-- ============================================================
-- ENUMS
-- ============================================================

create type age_tier as enum (
  '18_24', '25_34', '35_44', '45_54', '55_64', '65_plus'
);

create type hair_loss_pattern as enum (
  'early', 'moderate', 'advanced', 'extensive'
);

create type budget_tier as enum (
  'under_2000', '2000_5000', '5000_8000', '8000_12000', '12000_plus'
);

create type treatment_timeline as enum (
  '1_3_months', '3_6_months', '6_12_months', '12_plus_months'
);

create type donor_area_quality as enum (
  'excellent', 'good', 'adequate', 'poor'
);

create type donor_area_availability as enum (
  'good', 'adequate', 'limited'
);

create type desired_density as enum (
  'maximum', 'high', 'medium', 'low'
);

create type photo_view as enum (
  'front', 'left_side', 'right_side', 'top', 'donor_area'
);

-- ============================================================
-- USER QUALIFICATION (GetStarted wizard)
-- ============================================================

create table public.user_qualification (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  age_tier age_tier null,
  country text null,
  hair_loss_pattern hair_loss_pattern null,
  budget_tier budget_tier null,
  timeline treatment_timeline null,
  whatsapp_number text null,
  preferred_language text null default 'en'::text,
  terms_accepted boolean not null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  deleted boolean null default false,
  constraint user_qualification_pkey primary key (id),
  constraint user_qualification_user_id_key unique (user_id),
  constraint user_qualification_user_id_fkey foreign key (user_id) references users (id) on delete cascade
) tablespace pg_default;

create trigger update_user_qualification_updated_at
  before update on user_qualification
  for each row
  execute function update_updated_at_column();

-- ============================================================
-- USER TREATMENT PROFILES (TreatmentProfile wizard)
-- ============================================================

create table public.user_treatment_profiles (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  norwood_scale integer null,
  hair_loss_duration_years integer null,
  donor_area_quality donor_area_quality null,
  donor_area_availability donor_area_availability null,
  desired_density desired_density null,
  had_prior_transplant boolean null default false,
  allergies text[] null default '{}',
  medications text[] null default '{}',
  other_conditions text[] null default '{}',
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  deleted boolean null default false,
  constraint user_treatment_profiles_pkey primary key (id),
  constraint user_treatment_profiles_user_id_key unique (user_id),
  constraint user_treatment_profiles_user_id_fkey foreign key (user_id) references users (id) on delete cascade,
  constraint user_treatment_profiles_norwood_check check (
    norwood_scale is null or norwood_scale between 1 and 7
  )
) tablespace pg_default;

create trigger update_user_treatment_profiles_updated_at
  before update on user_treatment_profiles
  for each row
  execute function update_updated_at_column();

-- ============================================================
-- USER PRIOR TRANSPLANTS (child rows per transplant entry)
-- ============================================================

create table public.user_prior_transplants (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  year integer not null,
  estimated_grafts integer null,
  clinic_country text null,
  created_at timestamp with time zone null default now(),
  constraint user_prior_transplants_pkey primary key (id),
  constraint user_prior_transplants_user_id_fkey foreign key (user_id) references users (id) on delete cascade,
  constraint user_prior_transplants_year_check check (year between 1900 and extract(year from now())::integer)
) tablespace pg_default;

create index if not exists idx_user_prior_transplants_user_id
  on public.user_prior_transplants using btree (user_id) tablespace pg_default;

-- ============================================================
-- USER PRIOR SURGERIES (child rows per surgery entry)
-- ============================================================

create table public.user_prior_surgeries (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  surgery_type text not null,
  year integer not null,
  notes text null,
  created_at timestamp with time zone null default now(),
  constraint user_prior_surgeries_pkey primary key (id),
  constraint user_prior_surgeries_user_id_fkey foreign key (user_id) references users (id) on delete cascade,
  constraint user_prior_surgeries_year_check check (year between 1900 and extract(year from now())::integer)
) tablespace pg_default;

create index if not exists idx_user_prior_surgeries_user_id
  on public.user_prior_surgeries using btree (user_id) tablespace pg_default;

-- ============================================================
-- USER PHOTOS (metadata for uploaded photo views)
-- ============================================================

create table public.user_photos (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  photo_view photo_view not null,
  storage_url text not null,
  file_size_bytes integer null,
  mime_type text null,
  uploaded_at timestamp with time zone null default now(),
  deleted boolean null default false,
  constraint user_photos_pkey primary key (id),
  constraint user_photos_user_id_fkey foreign key (user_id) references users (id) on delete cascade,
  constraint user_photos_unique_view unique (user_id, photo_view)
) tablespace pg_default;

create index if not exists idx_user_photos_user_id
  on public.user_photos using btree (user_id) tablespace pg_default;


