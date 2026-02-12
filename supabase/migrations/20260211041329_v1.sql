CREATE TYPE source_type_enum AS ENUM ('clinic_website', 'registry', 'review_platform', 'forum', 'reddit', 'quora', 'social_media', 'mystery_inquiry', 'internal_note');
CREATE TYPE doc_type_enum AS ENUM ('html', 'pdf', 'post', 'comment', 'review');
CREATE TYPE value_type_enum AS ENUM ('string', 'number', 'bool', 'json');
CREATE TYPE computed_by_enum AS ENUM ('extractor', 'human', 'inquiry', 'model');
CREATE TYPE mention_topic_enum AS ENUM ('pricing', 'results', 'staff', 'logistics', 'complaint', 'praise');
CREATE TYPE sentiment_enum AS ENUM ('negative', 'neutral', 'positive');
CREATE TYPE score_band_enum AS ENUM ('A', 'B', 'C', 'D');


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
  constraint clinic_facts_confidence_check check (confidence >= 0.0 AND confidence <= 1.0)
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


ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_score_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_scores ENABLE ROW LEVEL SECURITY;