# Plan: Google Reviews UI Revamp — Clinic Profile Page

## Context

The Google Reviews section on the clinic profile page needed a visual polish pass: redundant 5-star display at the top, Google Signal Score buried on the left, a clipped G icon, and cluttered modal sidebar. All issues have been resolved across multiple iterations.

---

## Files Modified

1. `components/icons/GoogleIcon.tsx`
2. `components/istanbulmedic-connect/profile/ReviewsSection.tsx`
3. `components/istanbulmedic-connect/profile/ScoreBreakdownCard.tsx`
4. `tests/components/ReviewsSection.test.tsx`

---

## Implemented Changes

### 1. Fix clipped `G` in `GoogleIcon.tsx`

**Problem:** SVG path extends to y=24, the exact edge of `viewBox="0 0 24 24"`. At small render sizes (h-3.5, h-4), any expanded viewBox padding gets rounded away by sub-pixel rendering, so the bottom of the G is still clipped.

**Fix:** Add `overflow="visible"` directly on the SVG element. This is the SVG-native way to disable viewBox clipping entirely, regardless of render size or browser:
```tsx
<svg viewBox="0 0 24 24" overflow="visible" fill="currentColor" ...>
```

---

### 2. Fix clipped `G` in `ScoreBreakdownCard.tsx` (source badge on profile page)

**Problem:** The source score tile for Google rendered a plain text `"G"` letter inside a 24×24px `rounded-full` circle. Font descender rendering caused inconsistent clipping across browsers/fonts on certain clinics.

**Fix:** Replace the text `"G"` with the `GoogleIcon` SVG component for the Google source:
```jsx
{source.source_name === 'google'
  ? <GoogleIcon className="h-3.5 w-3.5 text-white" />
  : config.icon}
```
`GoogleIcon` uses `fill="currentColor"`, so `text-white` renders it white inside the dark blue circle.

---

### 3. `ReviewsSection.tsx` — Header (top of card)

- **1 star instead of 5:** Replaced the 5-star `Array.from` loop with a single `<Star className="h-4 w-4 fill-[#FFD700] text-[#FFD700]" />`.
- **Google Signal Score moved to top-right:** Removed from left column; added to right column as a stacked element.
- **Score/label order:** Score badge renders first (top), "Google Signal Score ⓘ" label below it.
- **Tooltip:** `<Info>` icon with `title="Calculated from review recency, volume, rating, and response patterns."` (imported from `lucide-react`).

---

### 4. `ReviewsSection.tsx` — No-reviews text

Changed both empty-state messages from `"No Google reviews yet."` → `"No Google Reviews available yet."`.

---

### 5. `ReviewsSection.tsx` — Modal sidebar (left panel)

- Added a single gold `<Star>` next to the score/rating.
- Removed `<h3>Google Reviews</h3>`.
- Changed review count text: `"45 reviews from Google."` → `"Based on 45 reviews from Google"`.

---

### 6. `ReviewsSection.tsx` — Modal right panel header

- Changed from `"Showing N of M reviews"` / `"M reviews"` → `"N available Google reviews"` where `N = reviews.length` (the stored count, which may be less than `totalReviews`).
- Search result state (`N results for "query"`) unchanged.

---

### 7. `tests/components/ReviewsSection.test.tsx` — Test updates

| Test | Change |
|---|---|
| "shows no reviews message when average rating is null" | `'No Google reviews yet.'` → `'No Google Reviews available yet.'` |
| "shows no reviews message when totalReviews is 0" | `/No Google reviews yet/` → `/No Google Reviews available yet/` |
| "clears search when clear button is clicked" | `'3 reviews'` → `/3 available Google reviews/` |

---

## Summary Table

| File | Change |
|---|---|
| `GoogleIcon.tsx` | Added `overflow="visible"` to SVG element (replaces viewBox hack) |
| `ScoreBreakdownCard.tsx` | Import `GoogleIcon`; render SVG instead of text `"G"` for google source badge |
| `ReviewsSection.tsx` | 5-star loop → single star in header |
| `ReviewsSection.tsx` | Signal Score moved top-right; score badge on top, label + ⓘ below |
| `ReviewsSection.tsx` | Empty state text → "No Google Reviews available yet." |
| `ReviewsSection.tsx` | Modal sidebar: add star, remove h3, update count text |
| `ReviewsSection.tsx` | Modal header: `"N available Google reviews"` using `reviews.length` |
| `ReviewsSection.test.tsx` | 3 test assertions updated to match new text |

---

## Verification

1. Start dev server: `cd IstanbulMedic-Connect && npm run dev`
2. Open a clinic profile page with Google reviews — confirm:
   - Header: 1 gold star, G icon not clipped
   - Top-right: score badge on top, "Google Signal Score ⓘ" label below; tooltip appears on hover
   - ScoreBreakdownCard: Google source badge shows SVG G icon (white, not clipped)
   - Modal sidebar: single star next to score, no "Google Reviews" heading, "Based on N reviews from Google"
   - Modal right panel header: "N available Google reviews" (N = stored count)
3. Open a clinic with no reviews — confirm "No Google Reviews available yet." appears
4. Run tests: `npm run test -- ReviewsSection`
