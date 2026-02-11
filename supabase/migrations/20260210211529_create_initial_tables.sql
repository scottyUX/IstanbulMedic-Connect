CREATE TYPE clinic_status AS ENUM ('active', 'inactive', 'under_review');
CREATE TYPE clinic_service_category AS ENUM ('Medical Tourism', 'Cosmetic', 'Dental', 'Other');
CREATE TYPE clinic_service_name AS ENUM ('Hair Transplant', 'Rhinoplasty', 'Other');
CREATE TYPE clinic_pricing_type AS ENUM ('range', 'fixed', 'quote_only');
CREATE TYPE clinic_roles AS ENUM ('medical_director', 'surgeon', 'coordinator', 'translator', 'nurse', 'doctor', 'other');
CREATE TYPE doctor_involvement_levels AS ENUM ('high', 'medium', 'low');
CREATE TYPE clinic_credential_types AS ENUM ('license', 'accreditation', 'membership', 'registry_id', 'other');
CREATE TYPE clinic_language_support_types AS ENUM ('staff', 'translator', 'on_request');


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
  constraint clinic_packages_pkey primary key (id),
  constraint clinic_packages_clinic_id_fkey foreign KEY (clinic_id) references clinics (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.clinic_pricing (
  id uuid not null default gen_random_uuid (),
  clinic_id uuid not null default gen_random_uuid (),
  service_name character varying not null,
  price_min numeric null,
  price_max numeric null,
  currecy text null,
  pricing_type clinic_pricing_type not null,
  notes text null,
  constraint clinic_pricing_pkey primary key (id),
  constraint clinic_pricing_clinic_id_fkey foreign KEY (clinic_id) references clinics (id) on delete CASCADE
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
  language character varying not null,
  support_type clinic_language_support_types not null,
  constraint clinic_languages_pkey primary key (id),
  constraint clinic_languages_clinic_id_fkey foreign KEY (clinic_id) references clinics (id) on delete CASCADE
) TABLESPACE pg_default;

ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_credentials ENABLE ROW LEVEL SECURITY;