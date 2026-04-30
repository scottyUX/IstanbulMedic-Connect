-- Registry data schema for Turkish Ministry of Health and Turkish Medical Association
-- Stores verified public registry data for clinic legitimacy verification

CREATE TYPE registry_source_enum AS ENUM ('turkish_ministry_of_health');
CREATE TYPE registry_license_status_enum AS ENUM ('active', 'expired', 'suspended', 'revoked', 'pending');
CREATE TYPE compliance_event_type_enum AS ENUM ('disciplinary_action', 'license_suspension', 'license_revocation', 'warning', 'fine', 'reinstatement', 'audit_finding');
CREATE TYPE compliance_severity_enum AS ENUM ('low', 'medium', 'high', 'critical');

-- Stores current license and registry status from official public sources
create table public.clinic_registry_records (
  id uuid not null default gen_random_uuid(),
  clinic_id uuid not null,
  source registry_source_enum not null,
  license_number character varying not null,
  license_status registry_license_status_enum not null,
  licensed_since date null,
  expires_at date null,
  authorized_specialties text[] null,
  registered_legal_name character varying null,
  registered_address text null,
  registry_url text null,
  raw_data jsonb null,
  last_verified_at timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
  created_at timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
  updated_at timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
  constraint clinic_registry_records_pkey primary key (id),
  constraint clinic_registry_records_clinic_id_fkey foreign key (clinic_id) references clinics (id) on delete cascade,
  constraint clinic_registry_records_unique unique (clinic_id, source, license_number)
) TABLESPACE pg_default;

-- Stores historical compliance events (disciplinary actions, suspensions, etc.)
create table public.clinic_compliance_history (
  id uuid not null default gen_random_uuid(),
  clinic_id uuid not null,
  source registry_source_enum not null,
  event_type compliance_event_type_enum not null,
  event_date date not null,
  description text null,
  resolved_at date null,
  severity compliance_severity_enum not null,
  raw_data jsonb null,
  created_at timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
  constraint clinic_compliance_history_pkey primary key (id),
  constraint clinic_compliance_history_clinic_id_fkey foreign key (clinic_id) references clinics (id) on delete cascade
) TABLESPACE pg_default;

-- Indexes for common query patterns
create index clinic_registry_records_clinic_id_idx on public.clinic_registry_records (clinic_id);
create index clinic_registry_records_source_idx on public.clinic_registry_records (source);
create index clinic_registry_records_status_idx on public.clinic_registry_records (license_status);
create index clinic_compliance_history_clinic_id_idx on public.clinic_compliance_history (clinic_id);
create index clinic_compliance_history_event_date_idx on public.clinic_compliance_history (event_date desc);
