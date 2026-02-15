-- Schema enhancements for opening hours, payment methods, doctor photos, and clinic statistics
-- Migration: 20260214120000_add_schema_enhancements.sql

-- Add opening hours and payment methods to clinic_locations
ALTER TABLE clinic_locations
  ADD COLUMN IF NOT EXISTS opening_hours jsonb,
  ADD COLUMN IF NOT EXISTS payment_methods text[];

-- Add photo URL to clinic_team
ALTER TABLE clinic_team
  ADD COLUMN IF NOT EXISTS photo_url text;

-- Add statistics to clinics
ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS years_in_operation integer,
  ADD COLUMN IF NOT EXISTS procedures_performed integer;

-- Ensure numeric stats are never negative
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'clinics_years_in_operation_nonnegative'
  ) THEN
    ALTER TABLE clinics
      ADD CONSTRAINT clinics_years_in_operation_nonnegative
      CHECK (years_in_operation IS NULL OR years_in_operation >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'clinics_procedures_performed_nonnegative'
  ) THEN
    ALTER TABLE clinics
      ADD CONSTRAINT clinics_procedures_performed_nonnegative
      CHECK (procedures_performed IS NULL OR procedures_performed >= 0);
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN clinic_locations.opening_hours IS 'JSON object with day-based hours, e.g. {"monday": {"open": "09:00", "close": "18:00"}}';
COMMENT ON COLUMN clinic_locations.payment_methods IS 'Array of accepted payment methods, e.g. {"Cash", "Credit Card", "Bank Transfer"}';
COMMENT ON COLUMN clinic_team.photo_url IS 'URL to doctor/staff photo';
COMMENT ON COLUMN clinics.years_in_operation IS 'Number of years the clinic has been operating';
COMMENT ON COLUMN clinics.procedures_performed IS 'Total number of procedures performed by the clinic';
