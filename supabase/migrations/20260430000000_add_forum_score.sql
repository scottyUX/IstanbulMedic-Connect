-- Add pre-computed composite score to clinic_forum_profiles.
-- Nullable: NULL means insufficient data (effectiveN < threshold).
-- Scoped per (clinic_id, forum_source) so HRN and Reddit store independent scores.

ALTER TABLE public.clinic_forum_profiles
  ADD COLUMN score numeric(4,1);

COMMENT ON COLUMN clinic_forum_profiles.score IS
  '0–10 composite score computed by the forum pipeline. NULL = insufficient data (effectiveN < 3).';
