create table public.clinic_scraped_data (
  id bigserial not null,
  clinic_id uuid null,
  url text not null,
  -- ... rest of your columns
  constraint clinic_scraped_data_pkey primary key (id),
  constraint clinic_scraped_data_url_key unique (url),
  constraint clinic_scraped_data_clinic_id_fkey foreign key (clinic_id) references clinics (id) on delete cascade
) tablespace pg_default;

create trigger set_updated_at before
update on clinic_scraped_data for each row
execute function update_updated_at();