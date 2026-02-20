-- Migration: add_instagram_profile_fields_to_clinic_social_media.sql

ALTER TABLE clinic_social_media
  ADD COLUMN IF NOT EXISTS follows_count bigint,
  ADD COLUMN IF NOT EXISTS posts_count integer,
  ADD COLUMN IF NOT EXISTS highlights_count integer,
  ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS business_category varchar;

COMMENT ON COLUMN clinic_social_media.follows_count IS 'Number of accounts this profile follows';
COMMENT ON COLUMN clinic_social_media.posts_count IS 'Total posts at time of last check';
COMMENT ON COLUMN clinic_social_media.highlights_count IS 'Number of story highlights';
COMMENT ON COLUMN clinic_social_media.is_private IS 'Whether the account is private';
COMMENT ON COLUMN clinic_social_media.business_category IS 'Instagram business category e.g. Medical & health';