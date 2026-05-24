-- Add unique constraint on clinic_score_components (clinic_id, component_key)
-- Prevents duplicate rows if scoreClinic is ever called concurrently.

alter table public.clinic_score_components
  add constraint clinic_score_components_clinic_id_component_key_unique
  unique (clinic_id, component_key);
