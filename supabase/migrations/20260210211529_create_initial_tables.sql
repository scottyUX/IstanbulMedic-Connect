CREATE TYPE clinic_status AS ENUM ('active', 'inactive', 'under_review');
CREATE TYPE clinic_service_category AS ENUM ('Medical Tourism', 'Cosmetic', 'Dental', 'Other');
CREATE TYPE clinic_service_name AS ENUM ('Hair Transplant', 'Rhinoplasty', 'Other');
CREATE TYPE clinic_pricing_type AS ENUM ('range', 'fixed', 'quote_only');
CREATE TYPE clinic_roles AS ENUM ('medical_director', 'surgeon', 'coordinator', 'translator', 'nurse', 'doctor', 'other');
CREATE TYPE doctor_involvement_levels AS ENUM ('high', 'medium', 'low');
CREATE TYPE clinic_credential_types AS ENUM ('license', 'accreditation', 'membership', 'registry_id', 'other');
CREATE TYPE clinic_language_support_types AS ENUM ('staff', 'translator', 'on_request');
CREATE TYPE clinic_language_types AS ENUM ('English', 'Arabic', 'Spanish', 'Russian', 'French', 'Portuguese', 'Hungarian', 'Italian', 'German', 'Polish', 'Ukranian', 'Dutch', 'Romanian', 'Hindi', 'Mandarin Chinese', 'Urdu', 'Bengali');
CREATE TYPE source_type_enum AS ENUM ('clinic_website', 'registry', 'review_platform', 'forum', 'reddit', 'quora', 'social_media', 'mystery_inquiry', 'internal_note');
CREATE TYPE doc_type_enum AS ENUM ('html', 'pdf', 'post', 'comment', 'review');
CREATE TYPE value_type_enum AS ENUM ('string', 'number', 'bool', 'json');
CREATE TYPE computed_by_enum AS ENUM ('extractor', 'human', 'inquiry', 'model');
CREATE TYPE mention_topic_enum AS ENUM ('pricing', 'results', 'staff', 'logistics', 'complaint', 'praise', 'bait_and_switch', 'coordinator_behavior', 'response_time', 'package_accuracy', 'before_after');
CREATE TYPE sentiment_enum AS ENUM ('negative', 'neutral', 'positive');
CREATE TYPE score_band_enum AS ENUM ('A', 'B', 'C', 'D');
CREATE TYPE social_platform_enum AS ENUM ('instagram', 'tiktok', 'x', 'reddit', 'youtube', 'facebook');


create table public.clinics (
  id uuid not null default gen_random_uuid (),
  display_name character varying not null,
  legal_name character varying null,
  status clinic_status not null,
  primary_city character varying not null,
  primary_country character varying not null,
  website_url text null,
  whatsapp_contact text null,
  email_contact text null,
  phone_contact VARCHAR(20) null,
  description text,
  short_description text,
  thumbnail_url text,
  created_at timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
  updated_at timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
  constraint clinics_pkey primary key (id),
  constraint clinics_id_key unique (id)
) TABLESPACE pg_default;

create table public.clinic_locations (
  id uuid not null default gen_random_uuid (),
  clinic_id uuid not null,
  location_name character varying not null,
  address_line text not null,
  city character varying not null,
  country character varying not null,
  postal_code character varying not null,
  latitude double precision null,
  longitude double precision null,
  is_primary boolean not null,
  constraint clinic_locations_pkey primary key (id),
  constraint clinic_locations_clinic_id_fkey foreign KEY (clinic_id) references clinics (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.clinic_services (
  id uuid not null default gen_random_uuid (),
  clinic_id uuid not null,
  service_category clinic_service_category not null,
  service_name clinic_service_name not null,
  is_primary_service boolean not null,
  constraint clinic_services_pkey primary key (id),
  constraint clinic_services_clinic_id_fkey foreign KEY (clinic_id) references clinics (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.clinic_packages (
  id uuid not null default gen_random_uuid (),
  clinic_id uuid not null default gen_random_uuid (),
  package_name character varying not null,
  includes jsonb not null,
  excludes jsonb not null,
  nights_included int null,
  transport_included boolean not null,
  aftercare_duration_days int null,
  price_min numeric, 
  price_max numeric null,
  currency text,
  constraint clinic_packages_pkey primary key (id),
  constraint clinic_packages_clinic_id_fkey foreign KEY (clinic_id) references clinics (id) on delete CASCADE,
  constraint clinic_packages_nights_check check (nights_included >= 0),
  constraint clinic_packages_aftercare_check check (aftercare_duration_days >= 0)
) TABLESPACE pg_default;

create table public.clinic_pricing (
  id uuid not null default gen_random_uuid (),
  clinic_id uuid not null default gen_random_uuid (),
  service_name character varying not null,
  price_min numeric null,
  price_max numeric null,
  currency text null,
  pricing_type clinic_pricing_type not null,
  notes text null,
  source_id uuid null, -- Track where this price came from
  is_verified boolean default false,
  last_verified_at timestamp with time zone null,
  constraint clinic_pricing_pkey primary key (id),
  constraint clinic_pricing_clinic_id_fkey foreign KEY (clinic_id) references clinics (id) on delete CASCADE,
  constraint clinic_pricing_price_check check (
    (pricing_type = 'quote_only' AND price_min IS NULL AND price_max IS NULL) OR
    (pricing_type != 'quote_only' AND (price_min IS NOT NULL OR price_max IS NOT NULL))
  )
) TABLESPACE pg_default;

create table public.clinic_team (
  id uuid not null default gen_random_uuid (),
  clinic_id uuid not null,
  role clinic_roles not null,
  name character varying null,
  credentials text not null,
  years_experience bigint null,
  doctor_involvement_level doctor_involvement_levels not null,
  constraint clinic_team_pkey primary key (id),
  constraint clinic_team_clinic_id_fkey foreign KEY (clinic_id) references clinics (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.clinic_credentials (
  id uuid not null default gen_random_uuid (),
  clinic_id uuid not null,
  credential_type clinic_credential_types not null,
  credential_name character varying not null,
  credential_id bigint null,
  issuing_body character varying null,
  valid_from date null,
  valid_to date null,
  constraint clinic_credentials_pkey primary key (id),
  constraint clinic_credentials_clinic_id_fkey foreign KEY (clinic_id) references clinics (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.clinic_languages (
  id uuid not null default gen_random_uuid (),
  clinic_id uuid not null,
  language clinic_language_types not null,
  support_type clinic_language_support_types not null,
  constraint clinic_languages_pkey primary key (id),
  constraint clinic_languages_clinic_id_fkey foreign KEY (clinic_id) references clinics (id) on delete CASCADE
) TABLESPACE pg_default;


create table public.sources (
  id uuid not null default gen_random_uuid (),
  source_type source_type_enum not null,
  source_name character varying not null,
  url text null,
  captured_at timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
  author_handle character varying null,
  content_hash character varying null,
  constraint sources_pkey primary key (id),
  constraint sources_content_hash_unique unique (content_hash)
) TABLESPACE pg_default;


create table public.source_documents (
  id uuid not null default gen_random_uuid (),
  source_id uuid not null,
  doc_type doc_type_enum not null,
  title character varying null,
  raw_text text not null,
  language character varying null,
  published_at timestamp with time zone null,
  constraint source_documents_pkey primary key (id),
  constraint source_documents_source_id_fkey foreign KEY (source_id) references sources (id) on delete CASCADE
) TABLESPACE pg_default;


create table public.clinic_facts (
  id uuid not null default gen_random_uuid (),
  clinic_id uuid not null,
  fact_key character varying not null,
  fact_value jsonb not null,
  value_type value_type_enum not null,
  confidence real not null,
  computed_by computed_by_enum not null,
  first_seen_at timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
  last_seen_at timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
  is_conflicting boolean not null,
  constraint clinic_facts_pkey primary key (id),
  constraint clinic_facts_clinic_id_fkey foreign KEY (clinic_id) references clinics (id) on delete CASCADE,
  constraint clinic_facts_confidence_check check (confidence >= 0.0 AND confidence <= 1.0),
  constraint clinic_facts_clinic_id_fact_key_unique UNIQUE (clinic_id, fact_key) --ensure upsert works
) TABLESPACE pg_default;


create table public.fact_evidence (
  id uuid not null default gen_random_uuid (),
  clinic_fact_id uuid not null,
  source_document_id uuid not null,
  evidence_snippet text null,
  evidence_locator jsonb null,
  constraint fact_evidence_pkey primary key (id),
  constraint fact_evidence_clinic_fact_id_fkey foreign KEY (clinic_fact_id) references clinic_facts (id) on delete CASCADE,
  constraint fact_evidence_source_document_id_fkey foreign KEY (source_document_id) references source_documents (id) on delete CASCADE
) TABLESPACE pg_default;


create table public.clinic_reviews (
  id uuid not null default gen_random_uuid (),
  clinic_id uuid not null,
  source_id uuid not null,
  rating character varying null,
  review_text text not null,
  review_date date null,
  language character varying null,
  constraint clinic_reviews_pkey primary key (id),
  constraint clinic_reviews_clinic_id_fkey foreign KEY (clinic_id) references clinics (id) on delete CASCADE,
  constraint clinic_reviews_source_id_fkey foreign KEY (source_id) references sources (id) on delete CASCADE
) TABLESPACE pg_default;


create table public.clinic_mentions (
  id uuid not null default gen_random_uuid (),
  clinic_id uuid null,
  source_id uuid not null,
  mention_text text not null,
  topic mention_topic_enum not null,
  sentiment sentiment_enum null,
  created_at timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
  constraint clinic_mentions_pkey primary key (id),
  constraint clinic_mentions_clinic_id_fkey foreign KEY (clinic_id) references clinics (id) on delete set null,
  constraint clinic_mentions_source_id_fkey foreign KEY (source_id) references sources (id) on delete CASCADE
) TABLESPACE pg_default;


create table public.clinic_score_components (
  id uuid not null default gen_random_uuid (),
  clinic_id uuid not null,
  component_key character varying not null,
  score int not null,
  weight real not null,
  explanation text not null,
  computed_at timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
  constraint clinic_score_components_pkey primary key (id),
  constraint clinic_score_components_clinic_id_fkey foreign KEY (clinic_id) references clinics (id) on delete CASCADE,
  constraint clinic_score_components_score_check check (score >= 0 AND score <= 100),
  constraint clinic_score_components_weight_check check (weight >= 0.0 AND weight <= 1.0)
) TABLESPACE pg_default;


create table public.clinic_scores (
  clinic_id uuid not null,
  overall_score int not null,
  band score_band_enum not null,
  computed_at timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
  version text not null,
  constraint clinic_scores_pkey primary key (clinic_id),
  constraint clinic_scores_clinic_id_fkey foreign KEY (clinic_id) references clinics (id) on delete CASCADE,
  constraint clinic_scores_overall_score_check check (overall_score >= 0 AND overall_score <= 100)
) TABLESPACE pg_default;

CREATE TABLE clinic_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'before_after', 'certificate')),
  url TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  source_id UUID REFERENCES sources(id),  -- provenance
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE clinic_social_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,                    -- Which clinic owns this account
  platform social_platform_enum NOT NULL,     -- instagram, tiktok, youtube, etc.
  account_handle varchar NOT NULL,            -- e.g., "istanbulmedic"
  follower_count bigint,                      -- How many followers
  verified boolean DEFAULT false,             -- Blue checkmark?
  last_checked_at timestamp,                  -- When we last updated this
  created_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  UNIQUE(clinic_id, platform, account_handle) -- One record per account
);

CREATE TABLE clinic_google_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  place_id varchar NOT NULL,                      -- Google's unique place ID
  rating numeric,                                 -- Current rating
  user_ratings_total bigint,                      -- Total review count
  last_checked_at timestamp with time zone,       -- When we last synced
  created_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  updated_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  UNIQUE(clinic_id, place_id)                     -- One record per place
);

CREATE INDEX idx_clinic_google_places_clinic_id ON clinic_google_places(clinic_id);
CREATE INDEX idx_clinic_google_places_place_id ON clinic_google_places(place_id);


CREATE INDEX idx_clinic_media_clinic_id ON clinic_media(clinic_id);
CREATE UNIQUE INDEX idx_clinic_media_primary
  ON clinic_media(clinic_id)
  WHERE is_primary = true;

-- Indexes for clinic_social_media
CREATE INDEX idx_clinic_social_media_clinic_id ON clinic_social_media(clinic_id);
CREATE INDEX idx_clinic_social_media_platform ON clinic_social_media(platform);
CREATE INDEX idx_clinic_social_media_follower_count ON clinic_social_media(follower_count);

-- Indexes for clinic_facts (already mentioned but not in schema)
CREATE INDEX idx_clinic_facts_clinic_id ON clinic_facts(clinic_id);
CREATE INDEX idx_clinic_facts_fact_key ON clinic_facts(fact_key);
CREATE INDEX idx_clinic_facts_clinic_key ON clinic_facts(clinic_id, fact_key);

ALTER TABLE clinic_pricing ADD CONSTRAINT clinic_pricing_source_id_fkey foreign key (source_id) references sources (id) on delete set null;

-- Add unique constraint to prevent duplicate reviews
ALTER TABLE clinic_reviews 
ADD CONSTRAINT clinic_reviews_unique_review 
UNIQUE (clinic_id, source_id, review_text, review_date);

-- Add unique constraint to prevent duplicate media
ALTER TABLE clinic_media 
ADD CONSTRAINT clinic_media_unique_url 
UNIQUE (clinic_id, url);


-- ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clinic_team ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clinic_pricing ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clinic_packages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clinic_locations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clinic_languages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clinic_services ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clinic_credentials ENABLE ROW LEVEL SECURITY;