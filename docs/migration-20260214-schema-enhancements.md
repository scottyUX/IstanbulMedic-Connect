# Migration: Schema Enhancements (20260214120000)

## Overview

This migration adds new columns to support opening hours, payment methods, doctor photos, and clinic statistics. These fields enable richer clinic profiles and improve the user experience when browsing clinics.

## Why These Changes?

### Opening Hours (`clinic_locations.opening_hours`)
Users need to know when clinics are open before planning visits or consultations. Storing hours as JSONB allows flexibility for:
- Different hours per day
- Closed days (null values)
- Future support for holiday schedules or special hours

### Payment Methods (`clinic_locations.payment_methods`)
International patients need to know accepted payment options upfront. This helps them:
- Plan finances before traveling
- Understand if their preferred payment method is accepted
- Know if insurance is accepted at specific locations

### Doctor Photos (`clinic_team.photo_url`)
Photos build trust and help patients:
- Put a face to the medical team
- Feel more comfortable before consultations
- Make more informed decisions about their care providers

### Clinic Statistics (`clinics.years_in_operation`, `clinics.procedures_performed`)
Experience metrics help patients assess clinic credibility:
- Years in operation indicates stability and track record
- Procedures performed demonstrates volume and expertise

## Schema Changes

### clinic_locations

| Column | Type | Description |
|--------|------|-------------|
| `opening_hours` | `jsonb` | Day-based schedule with open/close times |
| `payment_methods` | `text[]` | Array of accepted payment types |

### clinic_team

| Column | Type | Description |
|--------|------|-------------|
| `photo_url` | `text` | URL to staff member's photo |

### clinics

| Column | Type | Description |
|--------|------|-------------|
| `years_in_operation` | `integer` | Years the clinic has been operating |
| `procedures_performed` | `integer` | Total procedures completed |

## Opening Hours Format

The `opening_hours` column uses the following JSON structure:

```json
{
  "monday": { "open": "09:00", "close": "18:00" },
  "tuesday": { "open": "09:00", "close": "18:00" },
  "wednesday": { "open": "09:00", "close": "18:00" },
  "thursday": { "open": "09:00", "close": "18:00" },
  "friday": { "open": "09:00", "close": "17:00" },
  "saturday": { "open": "10:00", "close": "14:00" },
  "sunday": null
}
```

- Times are in 24-hour format (HH:MM)
- `null` indicates the clinic is closed that day
- All days should be present for consistency

## Payment Methods

Common values for the `payment_methods` array:

- `Cash`
- `Credit Card`
- `Bank Transfer`
- `Insurance`
- `Cryptocurrency`

## Migration SQL

```sql
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
```

## Data Integrity Rules

- `clinics.years_in_operation` must be `NULL` or `>= 0`
- `clinics.procedures_performed` must be `NULL` or `>= 0`

These checks prevent invalid negative values from being inserted.

## Idempotency

The migration is safe to rerun in development:

- Columns use `ADD COLUMN IF NOT EXISTS`
- Constraints are guarded with `IF NOT EXISTS` checks against `pg_constraint`

## Applying the Migration

```bash
# Reset local database (runs all migrations + seed)
npx supabase db reset

# Or push to remote
npx supabase db push
```

## Regenerating Types

After applying the migration, regenerate TypeScript types:

```bash
npx supabase gen types typescript --local > lib/supabase/database.types.ts
```

## TypeScript Usage

```typescript
import { Tables } from '@/lib/supabase/database.types';

// Clinic with statistics
type Clinic = Tables<'clinics'>;
// clinic.years_in_operation: number | null
// clinic.procedures_performed: number | null

// Location with hours and payments
type Location = Tables<'clinic_locations'>;
// location.opening_hours: Json | null
// location.payment_methods: string[] | null

// Team member with photo
type TeamMember = Tables<'clinic_team'>;
// member.photo_url: string | null
```

## Related Files

- Migration: `supabase/migrations/20260214120000_add_schema_enhancements.sql`
- Seed data: `supabase/seed.sql`
- TypeScript types: `lib/supabase/database.types.ts`
