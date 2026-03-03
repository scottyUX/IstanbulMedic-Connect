# Clinic Filtering System Implementation Plan

> **Status: BACKBURNER**
>
> This plan is on hold until backend data is populated. Currently, none of the filter data (pricing, ratings, districts, treatment taxonomy, etc.) is available in the database. Implementing these filters now would result in non-functional UI.
>
> **When to revisit:** After clinic data scraping/population is complete and the following tables have data:
> - `clinic_scores` - for Trust Score filter
> - `clinic_pricing` / `clinic_packages` - for Price Range filter
> - `clinic_reviews` - for Rating/Reviews filters
> - District columns on `clinics` - for District filter
>
> The plan includes a **Filter Configuration System** (`lib/filterConfig.ts`) that allows enabling/disabling individual filters, making it easy to roll out filters incrementally as data becomes available.

---

## Overview

Implement 9 filtering features for the clinic explorer page in a **single comprehensive PR**.

**Key Decisions:**
- Single PR implementing all features
- Replace current 5 treatments completely with hair-transplant-specific taxonomy
- Create test seed data for development/testing
- Use a config file to show/hide filters based on data availability

**Phases are for implementation order, not separate PRs.**

---

## Filter Configuration System

Since no filter data is currently populated, we'll add a config file to control which filters are visible. This lets us:
- Build all the code now (ready for when data exists)
- Hide filters in production until data is populated
- Enable filters one line at a time as data becomes available

**New file: `lib/filterConfig.ts`**
```typescript
export const FILTER_CONFIG = {
  // Phase 1
  trustScore: false,       // Enable when clinic_scores populated
  priceRange: false,       // Enable when clinic_pricing/packages have prices

  // Phase 2
  minRating: false,        // Enable when clinic_reviews have ratings
  minReviews: false,       // Enable when clinic_reviews populated
  verified: false,         // Enable when is_verified column populated
  hasPackages: false,      // Enable when clinic_packages populated
  hasTransfer: false,      // Enable when transport_included populated
  hasAccommodation: false, // Enable when nights_included populated

  // Phase 3
  districts: false,        // Enable when district_verified populated
  treatmentAreas: false,   // Enable when clinic_treatment_areas populated
  techniques: false,       // Enable when clinic_techniques populated
  specializations: false,  // Enable when clinic_specializations populated

  // Always enabled
  searchQuery: true,
  languages: true,         // Can show even with partial data
  accreditations: true,    // Can show even with partial data
} as const;
```

**Usage in FilterDialog.tsx:**
```typescript
import { FILTER_CONFIG } from '@/lib/filterConfig';

// In render:
{FILTER_CONFIG.trustScore && (
  <section>
    <h3>Trust Score</h3>
    {/* ... */}
  </section>
)}
```

This approach means:
- Flip `trustScore: true` when scores are ready
- Flip `priceRange: true` when pricing data exists
- etc.

**Note:** Backend filtering logic still runs (doesn't break anything), it just returns all results when no filter applied. The config only hides the UI.

---

## Phase 1: Quick Wins (No DB Changes)

### 1.1 Rename "AI Match Score" to "Trust Score"
**Files:**
- `components/istanbulmedic-connect/FilterDialog.tsx` (lines 157-175)
- `components/istanbulmedic-connect/ExploreClinicsPage.tsx` (line 54-56)
- `app/clinics/page.tsx` (line 71, 98, 107-108)

**Changes:**
- Label: "AI Match Score" → "Trust Score"
- Description: "Show clinics that match your profile..." → "Show clinics that meet a minimum trust and transparency standard."
- URL param: `minScore` → `minTrust`
- Re-enable the filter (currently commented out on line 107-108)

---

### 1.2 Price Range Filter (Wire Up Existing UI)
**Files:**
- `lib/api/clinics.ts` - Add price filtering logic
- `components/istanbulmedic-connect/ExploreClinicsPage.tsx` - Add budget to buildQueryString
- `app/clinics/page.tsx` - Parse pMin/pMax params
- `components/istanbulmedic-connect/types.ts` - ClinicsQuery already has budgetRange

**Backend Logic:**
```sql
-- Filter against clinic_pricing and clinic_packages
WHERE clinic_id IN (
  SELECT clinic_id FROM clinic_pricing
  WHERE price_min <= :pMax AND price_max >= :pMin
  UNION
  SELECT clinic_id FROM clinic_packages
  WHERE price_min <= :pMax AND price_max >= :pMin
)
-- Clinics without pricing data: INCLUDE when no price filter set
```

**URL params:** `?pMin=1000&pMax=5000`

---

## Phase 2: Simple Filters (Minor DB or Computed Data)

### 2.1 Minimum Rating Filter + Fix Rating Display
**Migration:** None needed - compute from `clinic_reviews.rating`

**Files:**
- `lib/api/clinics.ts` - Compute rating_avg, review_count; add filter
- `components/istanbulmedic-connect/FilterDialog.tsx` - Add dropdown
- `components/istanbulmedic-connect/types.ts` - Add to FilterState
- `app/clinics/page.tsx` - Parse minRating param
- `components/istanbulmedic-connect/ClinicCard.tsx` - Already handles rating display

**Backend Logic:**
```typescript
// In getClinics query, join clinic_reviews and compute:
// rating_avg = AVG(parsed rating)
// review_count = COUNT(*)
// Filter: WHERE rating_avg >= minRating (exclude null when filter applied)
```

**UI:** Dropdown - "Any", "4.0+", "4.5+", "4.8+"
**URL param:** `?minRating=4.5`

---

### 2.2 Minimum Reviews Filter
**Files:**
- `lib/api/clinics.ts` - Add review count filter
- `components/istanbulmedic-connect/FilterDialog.tsx` - Add dropdown
- `components/istanbulmedic-connect/types.ts` - Add to FilterState
- `app/clinics/page.tsx` - Parse minReviews param

**UI:** Dropdown - "Any", "10+", "50+", "200+"
**URL param:** `?minReviews=50`

---

### 2.3 Verified by IstanbulMedic Toggle
**Migration:** Add `is_verified BOOLEAN DEFAULT false` to clinics table

**Files:**
- `supabase/migrations/YYYYMMDD_add_clinic_filters.sql` - Add column
- `lib/api/clinics.ts` - Add verified filter
- `components/istanbulmedic-connect/FilterDialog.tsx` - Add toggle at top
- `components/istanbulmedic-connect/types.ts` - Add to FilterState
- `app/clinics/page.tsx` - Parse verified param

**UI:** Toggle switch at top of dialog
**URL param:** `?verified=true`

---

### 2.4 Has Packages Toggle
**Files:**
- `lib/api/clinics.ts` - Check EXISTS in clinic_packages
- `components/istanbulmedic-connect/FilterDialog.tsx` - Add toggle
- `components/istanbulmedic-connect/types.ts` - Add to FilterState
- `app/clinics/page.tsx` - Parse hasPackages param

**Backend Logic:**
```sql
WHERE EXISTS (SELECT 1 FROM clinic_packages WHERE clinic_id = clinics.id)
```

**UI:** Toggle switch
**URL param:** `?hasPackages=true`

---

### 2.5 Logistics Toggles (Airport Transfer + Accommodation)
**Files:**
- `lib/api/clinics.ts` - Filter via clinic_packages join
- `components/istanbulmedic-connect/FilterDialog.tsx` - Add two toggles
- `components/istanbulmedic-connect/types.ts` - Add to FilterState
- `app/clinics/page.tsx` - Parse URL params

**Backend Logic:**
```sql
-- Airport Transfer
WHERE EXISTS (SELECT 1 FROM clinic_packages WHERE clinic_id = clinics.id AND transport_included = true)

-- Accommodation
WHERE EXISTS (SELECT 1 FROM clinic_packages WHERE clinic_id = clinics.id AND nights_included > 0)
```

**UI:** Two toggle switches
**URL params:** `?hasTransfer=true&hasAccommodation=true`

---

## Phase 3: Complex Filters (New Tables/Major Changes)

### 3.1 District Filter (Istanbul Districts)
**Migration:**
```sql
ALTER TABLE clinics
  ADD COLUMN district_suggested VARCHAR,
  ADD COLUMN district_verified VARCHAR;
```

**New API Function:**
```typescript
// lib/api/clinics.ts
export async function getDistrictOptions(): Promise<{district: string, count: number}[]>
```

**Files:**
- `supabase/migrations/YYYYMMDD_add_district_columns.sql`
- `lib/api/clinics.ts` - Add getDistrictOptions(), add district filter
- `components/istanbulmedic-connect/FilterDialog.tsx` - Replace free-text with multi-select
- `components/istanbulmedic-connect/types.ts` - Update FilterState (location → districts[])
- `components/istanbulmedic-connect/UnifiedFilterBar.tsx` - Update location display
- `app/clinics/page.tsx` - Parse district param

**UI:** Multi-select dropdown with chips showing district counts
**URL param:** `?district=besiktas,sisli`

---

### 3.2 Treatment Taxonomy (Hair Transplant Specific)
**Note:** Completely replaces current 5-treatment system (Hair Transplant, Dental, Cosmetic Surgery, Eye Surgery, Bariatric Surgery) with hair-transplant-specific taxonomy.

**Migration - New Enums:**
```sql
CREATE TYPE treatment_area_enum AS ENUM (
  'Scalp Hair Transplant', 'Beard Transplant', 'Eyebrow Transplant', 'Body Hair Transplant'
);
CREATE TYPE technique_enum AS ENUM ('FUE', 'FUT', 'Robotic', 'Hybrid');
CREATE TYPE specialization_enum AS ENUM (
  'Afro / Curly Hair', 'Female Hair Transplant', 'Repair / Correction',
  'High Norwood Cases', 'Unshaven Procedure'
);
```

**Migration - New Tables:**
```sql
CREATE TABLE clinic_treatment_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id),
  treatment_area treatment_area_enum NOT NULL,
  UNIQUE(clinic_id, treatment_area)
);

CREATE TABLE clinic_techniques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id),
  technique technique_enum NOT NULL,
  UNIQUE(clinic_id, technique)
);

CREATE TABLE clinic_specializations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id),
  specialization specialization_enum NOT NULL,
  UNIQUE(clinic_id, specialization)
);
```

**Files:**
- `supabase/migrations/YYYYMMDD_add_treatment_taxonomy.sql`
- `supabase/seed.sql` - Populate for existing clinics
- `lib/supabase/database.types.ts` - Regenerate types
- `lib/api/clinics.ts` - New filtering logic (OR within group, AND across groups)
- `components/istanbulmedic-connect/types.ts` - Replace TreatmentType with 3 new filter types
- `components/istanbulmedic-connect/FilterDialog.tsx` - Replace treatments with 3 sub-sections
- `app/clinics/page.tsx` - Parse new URL params
- `components/istanbulmedic-connect/ExploreClinicsPage.tsx` - Update buildQueryString

**URL params:** `?treatmentArea=scalp,beard&technique=fue&specialization=afro-curly`

---

## Updated FilterState Type
```typescript
export interface FilterState {
  searchQuery: string
  districts: string[]  // Changed from location: string

  // Treatment taxonomy (replaces treatments)
  treatmentAreas: Record<TreatmentArea, boolean>
  techniques: Record<Technique, boolean>
  specializations: Record<Specialization, boolean>

  budgetRange: [number, number]
  languages: Record<Language, boolean>
  accreditations: Record<Accreditation, boolean>

  // Renamed
  minTrustScore: number  // was aiMatchScore

  // New filters
  minRating: number | null      // null = "Any"
  minReviews: number | null     // null = "Any"
  isVerified: boolean
  hasPackages: boolean
  hasTransfer: boolean
  hasAccommodation: boolean
}
```

---

## Implementation Order (Recommended)

1. **Trust Score Rename** - Quick win, builds momentum
2. **Price Range Filter** - Highest impact per issue
3. **Rating + Reviews Filters** - Fix undefined rating issue
4. **Logistics Toggles** - Uses existing data
5. **Has Packages Toggle** - Uses existing data
6. **Verified Toggle** - Simple migration
7. **District Filter** - Medium complexity
8. **Treatment Taxonomy** - Most complex, save for last

---

## Files Summary

| File | Changes |
|------|---------|
| `lib/filterConfig.ts` | **NEW** - Feature flags to show/hide each filter |
| `supabase/migrations/YYYYMMDD_add_filters.sql` | New columns + tables |
| `supabase/seed.sql` | Populate new data |
| `lib/supabase/database.types.ts` | Regenerate after migration |
| `lib/api/clinics.ts` | All filtering logic + new getDistrictOptions() |
| `components/istanbulmedic-connect/types.ts` | FilterState updates |
| `components/istanbulmedic-connect/FilterDialog.tsx` | All UI changes (wrapped in config checks) |
| `components/istanbulmedic-connect/UnifiedFilterBar.tsx` | District display |
| `components/istanbulmedic-connect/ExploreClinicsPage.tsx` | buildQueryString updates |
| `app/clinics/page.tsx` | URL param parsing |

---

## Seed Data (Test Data)

Will create realistic test data in `supabase/seed.sql`:

1. **Districts**: Populate `district_verified` for existing clinics with Istanbul districts (Besiktas, Sisli, Kadikoy, Uskudar, Fatih, etc.)

2. **Treatment Taxonomy**: Assign treatment areas, techniques, and specializations to existing clinics based on their current `clinic_services` data

3. **Verified Status**: Mark a subset of clinics as `is_verified = true`

4. **Pricing Data**: Ensure `clinic_pricing` and `clinic_packages` have price ranges for testing

---

## Verification

After implementation:
1. Run `npm run build` - Ensure no TypeScript errors
2. Run `npm test` - Ensure existing tests pass
3. Run `npm run test:e2e` - Ensure E2E tests pass
4. Manual testing:
   - Apply each filter individually → verify results change
   - Apply multiple filters → verify AND logic works
   - Refresh page → verify URL params persist
   - Clear filters → verify reset works
   - Check clinics without data appear when no filter applied

---

## Related GitHub Issues

- Price Range Filter
- Treatment Taxonomy
- Rename AI Match Score to Trust Score (#24)
- District Filter
- Verified by IstanbulMedic Toggle
- Minimum Rating Filter
- Minimum Reviews Filter
- Logistics Toggles (Airport Transfer + Accommodation)
- Has Packages Toggle


New plan (implementing functional filters, but will be extendable)

Final Implementation Plan                                                                                                                           
                                                                                                                                                      
  1. Create lib/filterConfig.ts                                                                                                                       
                                                                                                                                                      
  Feature flags to show/hide each filter section.                                                                                                     
                                                                                                                                                      
  2. Create lib/api/clinicRatings.ts                                                                                                                  
                                                                                                                                                      
  Aggregation helper for multi-source ratings (Google-only for now, extensible).                                                                      
                                                                                                                                                      
  3. Update Types                                                                                                                                     
                                                                                                                                                      
  - FilterState: Add minRating, minReviews                                                                                                            
  - ClinicListItem: Add reviewCount                                                                                                                   
  - ClinicsQuery: Add minRating, minReviews                                                                                                           
                                                                                                                                                      
  4. Update lib/api/clinics.ts                                                                                                                        
                                                                                                                                                      
  - Fetch google_rating and google_review_count from clinic_facts                                                                                     
  - Use aggregation helper                                                                                                                            
  - Add filtering logic                                                                                                                               
  - Return rating/reviewCount in response                                                                                                             
                                                                                                                                                      
  5. Update FilterDialog.tsx                                                                                                                          
                                                                                                                                                      
  - Wrap each filter section in FILTER_CONFIG checks                                                                                                  
  - Add Rating dropdown (Any, 4.0+, 4.5+, 4.8+)                                                                                                       
  - Add Reviews dropdown (Any, 10+, 50+, 200+)                                                                                                        
                                                                                                                                                      
  6. Update ExploreClinicsPage.tsx                                                                                                                    
                                                                                                                                                      
  - Add minRating/minReviews to buildQueryString                                                                                                      
                                                                                                                                                      
  7. Update app/clinics/page.tsx                                                                                                                      
                                                                                                                                                      
  - Parse URL params, update defaults                                                                                                                 
                                                                                                                                                      
  8. Update ClinicCard.tsx                                                                                                                            
                                                                                                                                                      
  - Display "4.7 ★ (2,341)" format                                                                                                                    
                                                                                                                                                      
  9. Update ReviewsSection.tsx

  - Show "Showing X of Y reviews" in modal

---

## Rating Data Source Strategy

### Current Implementation (Single Source)
Currently using `clinic_google_places` table directly for rating data:
- `rating` - Google Places rating (numeric, 1-5)
- `user_ratings_total` - Total review count from Google

This provides clean columns for sorting (`ORDER BY rating DESC`) and filtering.

### Future Implementation (Multi-Source Aggregation)
When additional review platforms are added (Trustpilot, WhatClinic, RealSelf, etc.):

1. **Create aggregate database view** (`clinic_ratings_aggregate`):
   ```sql
   CREATE VIEW clinic_ratings_aggregate AS
   SELECT
     clinic_id,
     -- Weighted average across sources
     SUM(rating * weight) / SUM(weight) as aggregate_rating,
     SUM(review_count) as total_review_count,
     array_agg(source_name) as sources
   FROM (
     SELECT clinic_id, rating, user_ratings_total as review_count,
            'google' as source_name, 0.4 as weight
     FROM clinic_google_places
     UNION ALL
     SELECT clinic_id, rating, review_count,
            'trustpilot' as source_name, 0.35 as weight
     FROM clinic_trustpilot  -- future table
     -- ... additional sources
   ) sources
   GROUP BY clinic_id;
   ```

2. **Update `lib/api/clinics.ts`** to query the view instead of `clinic_google_places`

3. **The existing `lib/api/clinicRatings.ts`** has aggregation logic that can inform the view's weighting:
   - Google: 40% weight
   - Trustpilot: 35% weight
   - WhatClinic: 25% weight

### Why This Approach
- **Now**: Simple, clean columns for sorting/filtering. No complex JOINs or JSON parsing.
- **Later**: Database view handles aggregation at query time. Application code stays simple.
- **Migration path**: When adding sources, create the view and update one query. No major refactor needed.      