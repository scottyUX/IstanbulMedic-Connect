# Clinic Comparison Feature

Side-by-side comparison of two clinics, filterable by data source. Each source has a dedicated view showing its specific signals alongside a score from the central `clinic_source_scores` table.

---

## ⚠️ Requirements Before Deploying

### 1. `clinic_source_scores` anon grant
The comparison pages query `clinic_source_scores` from the browser. Without an explicit `grant select` for the `anon` role, **logged-out users will see all scores as `—`** — Supabase RLS denies by default and returns empty results silently.

The migration that creates the `clinic_source_scores` table **must include**:

```sql
grant select on table "public"."clinic_source_scores" to "anon";
grant select on table "public"."clinic_source_scores" to "authenticated";
```

Confirm this is present before merging that PR and before deploying.

### 2. HRN detailed signals require `NEXT_PUBLIC_USE_MOCK_HRN=true`
The HRN score card (`hrnScore`) is wired to `clinic_source_scores` and works in production without any env flag.

However, the **detailed HRN breakdown** inside `HRNView` (thread counts, sentiment bars, common topics) currently uses mock data. To see this in development, set the following in `.env.local`:

```
NEXT_PUBLIC_USE_MOCK_HRN=true
```

Without this flag, the breakdown section shows "No data yet" while the score card still displays the real score. This is expected behaviour in production until live HRN signal fetching is wired into `useClinicCompareSignals`.

---

## Routes

| URL | Source |
|-----|--------|
| `/clinics/compare` | All sources combined |
| `/clinics/compare/google-places` | Google Places |
| `/clinics/compare/reddit` | Reddit |
| `/clinics/compare/hrn` | Hair Restoration Network |
| `/clinics/compare/instagram` | Instagram |

Each route is a **server component** that:
1. Fetches all clinics (`getClinics`, up to 500, alphabetical)
2. Fetches per-source scores for all clinic IDs (`getClinicSourceScores`)
3. Spreads the scores onto each clinic object before passing to `CompareClinicPage`

URL state (`?left=<id>&right=<id>&sort=highest`) is synced via `router.replace` so comparisons are shareable and survive page refresh.

---

## File Structure

```
app/clinics/compare/
├── page.tsx                  # All sources
├── google-places/page.tsx
├── reddit/page.tsx
├── hrn/page.tsx
└── instagram/page.tsx

components/istanbulmedic-connect/comparison/
├── CompareClinicPage.tsx     # Shell: source nav, split-pane layout, ClinicRow list, sort/URL sync
├── useClinicCompareSignals.ts # Client-side hook: detailed signals per selected clinic
├── AllSourcesView.tsx        # "All Sources" selected-clinic card
├── GooglePlacesView.tsx      # Google Places selected-clinic card
├── RedditView.tsx            # Reddit selected-clinic card
├── HRNView.tsx               # HRN selected-clinic card
└── InstagramView.tsx         # Instagram selected-clinic card

lib/api/clinics.ts
└── getClinicSourceScores()   # Server-side: fetches scores from clinic_source_scores
```

---

## Data Flow

### Server side (page load)

```
page.tsx
  ├── getClinics()              → clinic list with trustScore, rating, reviewCount
  ├── getClinicSourceScores()   → googleScore, redditScore, hrnScore, instagramScore
  └── spread scores onto clinics → enriched ClinicListItem[]
        ↓
  CompareClinicPage (client component, receives full enriched list)
```

All scores on `ClinicListItem` come from `clinic_source_scores.summary_score` (0–100 stored, divided by 10 for display). See [scoring.md](./scoring.md).

### Client side (after clinic selected)

When a user picks a clinic, `useClinicCompareSignals(clinicId)` fires and fetches detailed signals in parallel:

| Signal | Table |
|--------|-------|
| Instagram follower count, engagement rate | `clinic_social_media`, `clinic_facts` |
| Reddit sentiment, threads, concerns, AI summary | `clinic_forum_profiles` |
| Google review breakdown, recent reviews | `clinic_reviews` |
| Registry records | `clinic_registry_records` |
| Extra gallery images | `clinic_media` |
| HRN signals (dev only) | `getMockHRNSignals()` — see note below |

> **HRN signals in `useClinicCompareSignals`**: currently returns mock data when `NEXT_PUBLIC_USE_MOCK_HRN=true`, otherwise null. The HRN score card in `HRNView` reads from `clinic.hrnScore` (server-loaded from `clinic_source_scores`) and is not affected by this. Only the detailed thread/sentiment breakdown inside `HRNView` depends on the mock flag.

---

## Score Pills in the Clinic Selection List

Each `ClinicRow` in the selection list shows a score pill. All sources use `/10` scale.

| Source | Score field | Fallback |
|--------|-------------|---------|
| All sources | `clinic.trustScore / 10` | null if trustScore = 0 |
| Google Places | `clinic.googleScore` | `—` |
| Reddit | `clinic.redditScore` | `—` |
| HRN | `clinic.hrnScore` | `—` |
| Instagram | `clinic.instagramScore` | `—` |

A `—` displays when the score is `null` (no data). For sorting, `null` is treated as `0` so unscored clinics sort to the bottom on "Highest Rated" and the top on "Lowest Rated".

---

## Sorting

The sort dropdown (Alphabetical / Highest Rated / Lowest Rated) works for all five sources. The sort key per source:

| Source | Sort key |
|--------|---------|
| All sources | `trustScore / 10` |
| Google Places | `googleScore` |
| Reddit | `redditScore` |
| HRN | `hrnScore` |
| Instagram | `instagramScore` |

Clinics with no score for the active source (`null`) are treated as `0` for ordering purposes.

---

## Score Cards in Each View

Every source view opens with a score card that shows the `clinic_source_scores` value at a glance.

| View | Score card field | Additional signals |
|------|-----------------|-------------------|
| `AllSourcesView` | `trustScore / 10` (IstanbulMedic Score) | Google stars, Reddit sentiment pill, HRN sentiment pill, Instagram followers/engagement, registry status |
| `GooglePlacesView` | `googleScore` | Raw star rating (1–5), per-star breakdown, recent review excerpts |
| `RedditView` | `redditScore` | AI summary, thread/longterm/repair counts, sentiment bar chart, common topics |
| `HRNView` | `hrnScore` | Thread/photo/longterm counts, sentiment bar chart, common topics |
| `InstagramView` | `instagramScore` | Follower count, engagement rate bar |
