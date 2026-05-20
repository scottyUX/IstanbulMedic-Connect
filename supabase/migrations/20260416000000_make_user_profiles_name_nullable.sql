-- Allow first_name / last_name to be NULL on user_profiles.
--
-- Rationale: persistGoogleExtras (auth/callback) upserts a user_profiles row on
-- first sign-in using Google People API data. If Google returns no name info
-- (possible during testing / app not yet verified), neither first_name nor
-- last_name is supplied and the INSERT would violate the NOT NULL constraints.
-- Making them nullable prevents that silent failure.

ALTER TABLE user_profiles ALTER COLUMN first_name DROP NOT NULL;
ALTER TABLE user_profiles ALTER COLUMN last_name  DROP NOT NULL;
