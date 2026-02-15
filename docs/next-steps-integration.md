# Backend Integration Status

This document tracks the progress of integrating the frontend with Supabase backend.

**Last Updated:** February 15, 2026

---

## Table of Contents

1. [Completed Work](#completed-work)
2. [Current Architecture](#current-architecture)
3. [Data Status](#data-status)
4. [Remaining Work](#remaining-work)
5. [For Backend Team](#for-backend-team)

---

## Completed Work

### Phase 1: PR Fixes ✅

| Task | Status |
|------|--------|
| Replace hardcoded colors with CSS variables | ✅ Done |
| Fix empty onClick handler | ✅ Done |
| Add TODO comments for hardcoded data | ✅ Done (now removed - using real data) |

### Phase 2: Supabase Setup ✅

| Task | Status |
|------|--------|
| Supabase client libraries already installed (`@supabase/ssr`) | ✅ |
| Created `lib/supabase/client.ts` (browser client) | ✅ |
| Created `lib/supabase/server.ts` (server client) | ✅ |
| Generated `lib/supabase/database.types.ts` | ✅ |
| Local Docker setup with seed data | ✅ |
| Added `db:types` script to package.json | ✅ |

### Phase 3: Data Layer ✅

| Task | Status |
|------|--------|
| Created `lib/api/clinics.ts` with reusable functions | ✅ |
| `getClinics()` - List clinics for explore page | ✅ |
| `getClinicById()` - Detail for profile page | ✅ |
| `getClinicCities()` - Cities for filters | ✅ |
| `getServiceCategories()` - Services for filters | ✅ |

### Phase 4: Component Refactoring ✅

| Component | Status |
|-----------|--------|
| `ExploreClinicsPage` - Now uses real clinic data | ✅ |
| `ClinicProfilePage` - Now uses real clinic data | ✅ |
| Updated `Clinic` type to use `id: string` (UUID) | ✅ |

---

## Current Architecture

We chose **server components with direct function calls** instead of API routes + client hooks.

### Why This Approach?

See `docs/data-layer-architecture.md` for full rationale. Summary:

```
❌ API Routes (unnecessary extra hop):
Browser → /api/clinics → Supabase → back

✅ Direct Functions (what we use):
Server Component → getClinics() → Supabase → HTML → Browser
```

### File Structure

```
lib/
├── api/
│   └── clinics.ts          # Reusable query functions
├── supabase/
│   ├── client.ts           # Browser Supabase client
│   ├── server.ts           # Server Supabase client
│   └── database.types.ts   # Auto-generated types
```

### How Data Flows

```tsx
// app/clinics/page.tsx (Server Component)
import { getClinics } from "@/lib/api/clinics"

export default async function Page() {
  const clinics = await getClinics()  // Runs on server
  return <ExploreClinicsPage initialClinics={clinics} />
}

// components/.../ExploreClinicsPage.tsx (Client Component)
"use client"
export function ExploreClinicsPage({ initialClinics }) {
  // Has the data already - no loading state needed
  // Handles interactivity (filters, sorting)
}
```

---

## Data Status

### ✅ Using Real Data From Database

| Data | Source Table | Notes |
|------|--------------|-------|
| Clinic name | `clinics.display_name` | ✅ |
| Clinic location | `clinics.primary_city` + `primary_country` | ✅ |
| Clinic status | `clinics.status` | ✅ Only showing `active` |
| Trust score | `clinic_scores.overall_score` | ✅ |
| Trust band | `clinic_scores.band` | ✅ A/B/C/D |
| Services/Specialties | `clinic_services` | ✅ |
| Languages | `clinic_languages` | ✅ |
| Team/Doctors | `clinic_team` | ✅ |
| Credentials | `clinic_credentials` | ✅ |
| Reviews | `clinic_reviews` | ✅ |
| Score components | `clinic_score_components` | ✅ Used for AI insights |
| Locations | `clinic_locations` | ✅ Address, lat/lng |
| Pricing | `clinic_pricing` | ✅ Displayed on profile |
| Packages | `clinic_packages` | ✅ Displayed on profile |
| Clinic media | `clinic_media` | ✅ Used for explore + profile images |
| Community mentions | `clinic_mentions` | ✅ Used for community signals |
| Clinic facts | `clinic_facts` | ✅ Used for overview stats |

### ⚠️ Still Using Placeholder Data

| Data | Current Status | What's Needed |
|------|----------------|---------------|
| **Clinic images** | ✅ From `clinic_media` | Seed or upload real images |
| **Opening hours** | Hardcoded placeholder | Add to schema or `clinic_locations` |
| **Payment methods** | Hardcoded placeholder | Add to schema |
| **Years in operation** | ✅ From `clinic_facts` | Add if missing |
| **Procedures performed** | ✅ From `clinic_facts` | Add if missing |
| **Community signals** | ✅ From `clinic_mentions` | Expand sources if needed |
| **Average rating** | Computed from reviews | Working, but few reviews in seed data |
| **Doctor photos** | Placeholder image | Add photo URL to `clinic_team` |

---

## Remaining Work

### High Priority

- [x] Add real clinic images to database (`clinic_media` wired)
- [x] Display pricing info on profile page (data exists)
- [x] Display packages on profile page (data exists)
- [x] Add loading skeletons for better UX
- [x] Add error handling UI

### Medium Priority

- [x] Transform `clinic_mentions` to community signals format
- [x] Add pagination for clinic list (server-side)
- [x] Add server-side filtering (query params + server data layer)
- [ ] Implement clinic comparison feature

### Low Priority

- [ ] Add opening hours to schema
- [ ] Add payment methods to schema
- [ ] Add doctor photos to `clinic_team`

---

## For Backend Team

### Schema Is Good! ✅

The current schema supports everything we need. The 16 tables cover:
- Core clinic data
- Locations, services, pricing, packages
- Team members and credentials
- Reviews and mentions
- Trust scores with components
- Evidence layer (sources, facts)

### Data Needed

To make the app fully functional with real data, please add:

1. **Clinic images** - Populate `clinic_media` table with real clinic photos (seeded locally)
2. **More seed clinics** - Currently 4 clinics (3 active, 1 under_review)
3. **More reviews** - Currently 2 reviews total

### Optional Schema Additions

These fields would be nice to have but aren't blockers:

```sql
-- Add to clinics table
ALTER TABLE clinics ADD COLUMN total_procedures integer;
ALTER TABLE clinics ADD COLUMN founded_year integer;

-- Add to clinic_team table
ALTER TABLE clinic_team ADD COLUMN photo_url text;

-- Add to clinic_locations table (or new table)
-- opening_hours jsonb
-- payment_methods text[]
```

### Environment Setup

To run locally with the seed data:

```bash
# Start local Supabase (requires Docker)
npx supabase start

# This will:
# - Run migrations
# - Seed the database with 4 sample clinics
# - Start local services at http://127.0.0.1:54321
```

The frontend `.env.local` is configured for local development:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Related Documentation

- `docs/data-layer-architecture.md` - Why we use direct functions instead of API routes
- `docs/server-vs-client-components.md` - Server vs client component explanation
- `docs/backend-schema-mapping.md` - Full schema documentation
- `supabase/seed.sql` - Sample data
