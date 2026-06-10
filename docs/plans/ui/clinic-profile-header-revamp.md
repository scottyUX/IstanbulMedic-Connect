# Plan: Revamp Clinic Profile Header + Sidebar Card Header

## Context
The clinic profile header previously showed only Google star rating and location in its sub-header row. The sidebar card header showed only a star rating (price estimate gated off). The goal was to surface richer trust signals in both places, add source score chips (Google, Instagram, Reddit) that scroll to their respective sections, and fix sticky sidebar positioning.

---

## Changes Implemented

### 1 — HeroSection sub-header
**File:** `components/istanbulmedic-connect/profile/HeroSection.tsx`

**Props added:**
```typescript
sourceScores?: ClinicSourceScore[]   // imported from @/lib/api/clinics
```
(`trustBand` already existed; now also used in the sub-header.)

**Constants added at module level:**
```typescript
const BAND_CONFIG: Record<string, { color: string; bg: string }> = { A, B, C, D }
const SOURCE_ICON: Record<string, string> = { google: "G", reddit: "R", instagram: "I" }
```

**Computed values added inside the component:**
```typescript
const bandConfig = trustBand ? BAND_CONFIG[trustBand] : null
const googleScore    = sourceScores.find(s => s.source_name === "google"    && s.is_current)
const instagramScore = sourceScores.find(s => s.source_name === "instagram" && s.is_current)
const redditScore    = sourceScores.find(s => s.source_name === "reddit"    && s.is_current)
```

**New sub-header order (left → right):**
1. **Trust score** — shield icon + "Trust {score}" + band badge (color-coded A/B/C/D). Always rendered (no feature flag). Scrolls to `#score-breakdown`.
2. **★ Google star rating** — existing star + rating.toFixed(2) + review count. Scrolls to `#reviews`.
3. **Google score chip** — "G" icon + `summary_score`. Conditional on `googleScore` existing. Scrolls to `#score-breakdown`.
4. **Instagram score chip** — "I" icon + `summary_score`. Conditional. Scrolls to `#instagram-intel`.
5. **Reddit score chip** — "R" icon + `summary_score`. Conditional. Scrolls to `#reddit-intel`.
6. **Location** — unchanged, scrolls to `#location`.

All source chips are `Button variant="link"` with teal hover, hidden when the source score is absent or `is_current = false`.

---

### 2 — SummarySidebar card header
**File:** `components/istanbulmedic-connect/profile/SummarySidebar.tsx`

**Props added:**
```typescript
trustScore?: number
trustBand?: "A" | "B" | "C" | "D" | null
sourceScores?: ClinicSourceScore[]   // accepted but not displayed in card header
```

**Imports changed:**
- Added `Star`, `ShieldCheck` to lucide-react imports
- Removed `PriceRatingBlock` import (replaced inline)
- Removed `SOURCE_CONFIG` constant

**CardHeader — new minimal single-row layout:**
```
[Shield] Trust {score}  [Band]          ★ 4.72 · 312 reviews
```
- Trust section (left): shield icon + "Trust" label + bold score number + band badge. Only rendered when `trustScore` is defined.
- Star + reviews (right): inline star icon + `rating.toFixed(2)` + "· N reviews" link to `#reviews`. Always rendered.
- Source chips (Google/Reddit/Instagram) **removed** — sidebar is minimal.
- `PriceRatingBlock` and separator **removed** from CardHeader (price is feature-flagged off; rating is now inlined).

**Sticky positioning fix:**
```
sticky top-[148px] max-h-[calc(100vh-148px)] overflow-y-auto
```
Previous `sticky top-24` (96px) caused the card to stick behind the combined navbar (80px) + SectionNav (~48px). Updated to 148px clears both. `max-h` + `overflow-y-auto` prevents the card from extending below the viewport.

---

### 3 — ClinicProfilePage prop pass-through
**File:** `components/istanbulmedic-connect/profile/ClinicProfilePage.tsx`

- `<HeroSection>`: added `sourceScores={clinic.sourceScores}`
- `<SummarySidebar>`: added `trustScore={clinic.trustScore}`, `trustBand={clinic.trustBand}`, `sourceScores={clinic.sourceScores}`
- `<RedditSignalsCard>` wrapper: added `id="reddit-intel"` so the Reddit chip in the header can scroll to it

---

## Files Modified
| File | Change |
|------|--------|
| `components/istanbulmedic-connect/profile/HeroSection.tsx` | Sub-header reorder, Trust chip, source score chips (Google/Instagram/Reddit) |
| `components/istanbulmedic-connect/profile/SummarySidebar.tsx` | Minimal card header with trust + star inline; sticky positioning fix |
| `components/istanbulmedic-connect/profile/ClinicProfilePage.tsx` | Prop pass-through; `id="reddit-intel"` on Reddit wrapper |
| `tests/components/HeroSection.test.tsx` | Unskipped trust score test; added Google/Instagram/Reddit chip tests |
| `tests/components/SummarySidebar.test.tsx` | Updated trust block tests; removed source chip tests |

**Not modified:** Data fetching (`lib/api/clinics.ts`), scoring logic, `ScoreBreakdownCard`, `InstagramSignalsCard`, `RedditSignalsCard`.

---

## Verification
1. Run `npm run test:run` — 1150 passing, 47 skipped, 0 failures
2. On the clinic profile page, sub-header shows: Trust {score} [Band] · ★ rating · Google {score} · Instagram {score} · Reddit {score} · location
3. Each chip scrolls to its section on click
4. Sidebar card header shows trust score + band on the left, star rating on the right — one minimal row
5. Sticky sidebar clears the combined navbar + section nav when scrolling; card does not overflow the viewport
6. Source chips hidden when score is absent or `is_current = false`
