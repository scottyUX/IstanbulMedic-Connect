# Instagram Signals Card Implementation

## Overview

This document describes the implementation of the `InstagramSignalsCard` component integration with real data from the database. The card displays 4 trust signals with relative positioning calculated against other clinics.

## What Was Implemented

### 1. Import Endpoint Updates (`app/api/import/instagram/route.ts`)

Added calculation and storage of raw metrics during Instagram data import:

| Metric | Fact Key | Calculation |
|--------|----------|-------------|
| Engagement Rate | `instagram_engagement_rate` | `(avg_likes + avg_comments) / followers` |
| Posts Per Month | `instagram_posts_per_month` | `posts.length / months_spanned` |
| Comments Enabled Ratio | `instagram_comments_enabled_ratio` | `posts_with_comments_enabled / total_posts` |

**New helper functions:**
- `calculatePostsPerMonth()` - Calculates posting frequency from post timestamps
- `calculateCommentsEnabledRatio()` - Calculates ratio from `isCommentsDisabled` field per post

### 2. New `getInstagramSignals()` Function (`lib/api/instagram.ts`)

Fetches and calculates Instagram signals data for a clinic:

1. Fetches clinic's Instagram profile from `clinic_social_media`
2. Fetches clinic's raw metrics from `clinic_facts`
3. Fetches ALL clinics' metrics for comparison
4. Calculates relative position (0-100% scale)
5. Counts actual posts from `clinic_instagram_posts` for sample size
6. Returns `InstagramSignalsData` for the component

**Relative Position Calculation:**
```typescript
// Spectrum approach: lowest = 0%, highest = 100%
position = ((value - min) / (max - min)) * 100
```

This is NOT a traditional percentile - it shows where a clinic falls on the spectrum from lowest to highest among clinics we track.

### 3. Type Updates (`lib/api/clinics.ts`)

- Changed `ClinicDetail.instagram` to `ClinicDetail.instagramSignals`
- Updated `getClinicById()` to call `getInstagramSignals()` instead of `getClinicInstagramData()`

### 4. Component Updates

**`ClinicProfilePage.tsx`:**
- Replaced `InstagramIntelligenceSection` with `InstagramSignalsCard`
- Only renders when `clinic.instagramSignals` exists

**`InstagramSignalsCard.tsx`:**
- Updated explanatory text to clarify relative positioning vs percentile
- Improved layout with grid-like column alignment:
  - Visual column (bar/checkmark): right-aligned, fixed width
  - Metric column: left-aligned, fixed width (75px)
  - Status column: right-aligned, fixed width (90px)
- Business Account row stays compact (no metric column)

### 5. Seed Data (`supabase/seed.sql`)

Added test data for local development:

**Instagram Posts:** 10-25 posts per clinic for sample size counting

**Instagram Signal Facts:**
| Clinic | Engagement | Posts/Mo | Comments Enabled |
|--------|------------|----------|------------------|
| Istanbul Hair Masters | 2.3% | 8.5 | 90% (18/20) |
| Ankara Smile Dental | 1.5% | 5.0 | 100% (15/15) |
| Bodrum Aesthetic | 3.5% | 12.0 | 35% (9/25) - concern |
| Izmir Cosmetic | 0.5% | 2.0 | 80% (8/10) - low engagement concern |

### 6. Test Updates

Updated test files to use `instagramSignals` instead of `instagram`:
- `tests/components/ClinicProfilePage.test.tsx`
- `tests/unit/clinics-api.test.ts`

---

## Architecture

```
Scraped Data (Apify)
    │
    ▼
Import Endpoint (/api/import/instagram)
    │
    ├── clinic_social_media (profile data)
    ├── clinic_instagram_posts (individual posts)
    └── clinic_facts (raw metrics)
            │
            ▼
    getInstagramSignals() queries:
        • This clinic's metrics
        • All clinics' metrics (for comparison)
        • Post count (for sample size)
            │
            ▼
    InstagramSignalsCard renders:
        • 4 signals with visual indicators
        • Relative position gauges
        • Link to Instagram profile
```

---

## Signal Thresholds

| Signal | Type | Positive | Concern |
|--------|------|----------|---------|
| Engagement | Relative Position | >= 40% | < 40% |
| Posting Activity | Relative Position | >= 40% | < 40% |
| Comments Enabled | Boolean | >= 50% ratio | < 50% ratio |
| Business Account | Boolean | true | false |

---

## Files Changed

| File | Changes |
|------|---------|
| `app/api/import/instagram/route.ts` | Added raw metric calculations |
| `lib/api/instagram.ts` | Added `getInstagramSignals()` |
| `lib/api/clinics.ts` | Updated types and `getClinicById()` |
| `components/.../ClinicProfilePage.tsx` | Use `InstagramSignalsCard` |
| `components/.../InstagramSignalsCard.tsx` | Layout improvements, clearer text |
| `supabase/seed.sql` | Added Instagram posts and facts |
| `tests/components/ClinicProfilePage.test.tsx` | Updated for new type |
| `tests/unit/clinics-api.test.ts` | Updated mock and assertions |

---

## Next Steps

### 1. Local Testing
- [x] Run `npx supabase db reset` to populate seed data
- [ ] Verify signals card renders correctly on clinic profile pages
- [ ] Test expand/collapse functionality
- [ ] Test "View on Instagram" link
- [ ] Verify empty state (clinic without Instagram data shows no card)

### 2. Scraper Script Testing
- [ ] Add `isCommentsDisabled` field extraction to scraper if not already present
- [ ] Test scraper on a few clinics locally
- [ ] Verify the import endpoint receives and stores data correctly
- [ ] Check that all 4 metrics are calculated and stored

### 3. Production Deployment
- [ ] Deploy code changes
- [ ] Run scraper on production for all clinics with Instagram handles
- [ ] Verify data appears correctly on production clinic pages

### 4. Future Enhancements
- Consider adding more clinics to improve relative position granularity
- Add data freshness indicator styling (e.g., warning if data > 2 weeks old)
- Consider caching percentile calculations if performance becomes an issue with many clinics

---

## Testing Commands

```bash
# Reset local database with seed data
npx supabase db reset

# Run tests
npm run test:run -- tests/components/ClinicProfilePage.test.tsx tests/unit/clinics-api.test.ts

# Build check
npm run build

# Start dev server
npm run dev
```

## Test Clinic URLs (Local)

- Istanbul Hair Masters: `/clinics/550e8400-e29b-41d4-a716-446655440001`
- Ankara Smile Dental: `/clinics/550e8400-e29b-41d4-a716-446655440002`
- Bodrum Aesthetic (under_review): `/clinics/550e8400-e29b-41d4-a716-446655440003`
- Izmir Cosmetic: `/clinics/550e8400-e29b-41d4-a716-446655440004`
