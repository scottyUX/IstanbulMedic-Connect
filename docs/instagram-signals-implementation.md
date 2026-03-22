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
| Business Account | `instagram_is_business` | Boolean from profile data |

**New helper functions:**
- `calculatePostsPerMonth()` - Calculates posting frequency from post timestamps
- `calculateCommentsEnabledRatio()` - Calculates ratio from `isCommentsDisabled` field per post

### 2. `getInstagramSignals()` Function (`lib/api/instagram.ts`)

Fetches and calculates Instagram signals data for a clinic:

1. Fetches clinic's Instagram profile from `clinic_social_media`
2. Fetches clinic's raw metrics from `clinic_facts`
3. Fetches ALL clinics' metrics for comparison
4. Calculates relative position (0-100% scale)
5. Counts actual posts from `clinic_instagram_posts` for sample size
6. Returns `InstagramSignalsData` for the component

**Exported helper functions (for unit testing):**
- `calculateRelativePosition()` - Spectrum calculation (0% = lowest, 100% = highest)
- `getStatusFromPercentile()` - Returns 'positive' (>=40%) or 'concern' (<40%)
- `getEngagementStatusText()` - Returns human-readable status text
- `getPostingStatusText()` - Returns human-readable status text

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
- Uses `InstagramSignalsCard` component
- Only renders when `clinic.instagramSignals` exists

**`InstagramSignalsCard.tsx`:**
- Displays 4 trust signals with visual indicators
- Explanatory text clarifies relative positioning vs percentile
- Grid-like column alignment for consistent layout

### 5. Seed Data (`supabase/seed.sql`)

Added test data for local development:

**Instagram Posts:** 10-25 posts per clinic for sample size counting

**Instagram Signal Facts:**
| Clinic | Engagement | Posts/Mo | Comments Enabled | Business |
|--------|------------|----------|------------------|----------|
| Istanbul Hair Masters | 2.3% | 8.5 | 90% (18/20) | Yes |
| Ankara Smile Dental | 1.5% | 5.0 | 100% (15/15) | Yes |
| Bodrum Aesthetic | 3.5% | 12.0 | 35% (9/25) - concern | Yes |
| Izmir Cosmetic | 0.5% | 2.0 | 80% (8/10) - low engagement | Yes |

### 6. Code Cleanup

Removed legacy Instagram components that were replaced by the signals card:
- `components/.../profile/instagram/` folder (InstagramTabContent, PostsSection, ProfileHeader)
- `components/.../profile/InstagramIntelligenceSection.tsx`
- `getClinicInstagramData()` function from `lib/api/instagram.ts`
- Dead types from `components/istanbulmedic-connect/types.ts` (InstagramPostVM, InstagramIntelligenceVM, etc.)

---

## Architecture

```
Scraped Data (Apify) — runs monthly
    │
    ▼
Import Endpoint (/api/import/instagram)
    │
    ├── clinic_social_media (profile data, last_checked_at)
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
        • "Data last updated" timestamp
```

**Performance Note:** With a ceiling of ~150 clinics, on-the-fly percentile calculation is performant (<50ms). Pre-computation is not needed at this scale.

---

## Signal Thresholds

| Signal | Type | Positive | Concern |
|--------|------|----------|---------|
| Engagement | Relative Position | >= 40% | < 40% |
| Posting Activity | Relative Position | >= 40% | < 40% |
| Comments Enabled | Boolean | >= 50% ratio | < 50% ratio |
| Business Account | Boolean | true | false |

---

## Files

| File | Purpose |
|------|---------|
| `app/api/import/instagram/route.ts` | Calculates and stores metrics during import |
| `lib/api/instagram.ts` | `getInstagramSignals()` + helper functions |
| `lib/api/clinics.ts` | `ClinicDetail` type includes `instagramSignals` |
| `components/.../ClinicProfilePage.tsx` | Renders `InstagramSignalsCard` |
| `components/.../InstagramSignalsCard.tsx` | The signals card component |
| `supabase/seed.sql` | Test data for local development |
| `tests/unit/instagram-api.test.ts` | Unit tests for signals logic (31 tests) |

---

## Testing

### Completed
- [x] Manual testing with seed data
- [x] Unit tests for `getInstagramSignals()` and helper functions
- [x] Unit tests for `ClinicProfilePage` rendering
- [x] Build verification

### Remaining (Pre-Production)
- [ ] Scraper script test on 1-2 real clinics (validates Apify integration)
- [ ] Verify metrics stored correctly in database
- [ ] End-to-end verification with real data

### Commands

```bash
# Reset local database with seed data
npx supabase db reset

# Run Instagram API tests
npm run test:run -- tests/unit/instagram-api.test.ts

# Run all tests
npm run test:run

# Build check
npm run build

# Start dev server
npm run dev

# Run scraper test (costs ~$0.50, requires APIFY_API_TOKEN)
npx tsx app/api/instagramPipeline/testing/testInstagramPipeline.ts
```

### Test Clinic URLs (Local)

- Istanbul Hair Masters: `/clinics/550e8400-e29b-41d4-a716-446655440001`
- Ankara Smile Dental: `/clinics/550e8400-e29b-41d4-a716-446655440002`
- Bodrum Aesthetic (under_review): `/clinics/550e8400-e29b-41d4-a716-446655440003`
- Izmir Cosmetic: `/clinics/550e8400-e29b-41d4-a716-446655440004`

---

## Future Enhancements

- Add data freshness indicator styling (e.g., warning if data > 1 month old — scrapes run monthly)
- **Engagement calculation:** Currently using average likes/comments. Could explore median (more robust to outliers) + surfacing "most engaged post" separately so viral posts aren't ignored. Keeping average for now since 200-post sample size naturally smooths outliers.
