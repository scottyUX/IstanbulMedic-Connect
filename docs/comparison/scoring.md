# Comparison Page — Score System

How per-source scores are stored, fetched, and displayed across the comparison feature.

---

## Source of Truth: `clinic_source_scores`

All per-source scores shown in the comparison UI come from a single table:

```
clinic_source_scores
  clinic_id       uuid
  source_name     text        — 'google' | 'reddit' | 'hrn' | 'instagram'
  summary_score   numeric     — 0–100
  confidence_score numeric    — 0–100, nullable
  is_current      boolean     — only the latest score version per clinic+source
  score_version   text
  metrics_json    jsonb       — raw inputs used to compute the score
  breakdown_json  jsonb       — per-component weights and values
  explanation     text
  computed_at     timestamptz
```

The scoring pipeline writes rows to this table. The `is_current = true` flag marks the active row for each `(clinic_id, source_name)` pair — older versions are kept for history but excluded from all UI queries.

---

## `getClinicSourceScores()` — `lib/api/clinics.ts`

Called server-side on every comparison page. Fetches the current scores for all clinic IDs in one query and returns a `Map<clinicId, scores>`.

```typescript
// One query, four sources
const { data, error } = await supabase
  .from('clinic_source_scores')
  .select('clinic_id, source_name, summary_score')
  .in('clinic_id', clinicIds)
  .in('source_name', ['google', 'reddit', 'hrn', 'instagram'])
  .eq('is_current', true)

// summary_score (0–100) → divided by 10 for /10 display
// summary_score = 0 → treated as null (placeholder row, no real data)
```

The result is spread onto each `ClinicListItem` before being passed to `CompareClinicPage`:

```typescript
// In each comparison page.tsx:
const scores = await getClinicSourceScores(clinics.map(c => c.id))
const enriched = clinics.map(c => ({ ...c, ...scores.get(c.id) }))
```

This means `googleScore`, `redditScore`, `hrnScore`, and `instagramScore` are available on `ClinicListItem` everywhere downstream — score pills in the selection list, score cards in each view, and the sort function.

---

## `ClinicListItem` Score Fields

```typescript
interface ClinicListItem {
  trustScore: number          // from clinic_scores.overall_score (0–100)
  trustBand: 'A'|'B'|'C'|'D'|null

  rating?: number             // raw Google star rating (1–5), from clinic_google_places
  reviewCount?: number

  googleScore?: number | null    // clinic_source_scores, source_name='google'    (0–10)
  redditScore?: number | null    // clinic_source_scores, source_name='reddit'    (0–10)
  hrnScore?: number | null       // clinic_source_scores, source_name='hrn'       (0–10)
  instagramScore?: number | null // clinic_source_scores, source_name='instagram' (0–10)
}
```

`trustScore` is the overall IstanbulMedic composite score and comes from a separate `clinic_scores` table via `getClinics()`. The four per-source scores are only attached in the comparison pages via the spread above — `getClinics()` alone does not populate them.

---

## Display Conventions

| Value | Display |
|-------|---------|
| `null` | `—` (no data) |
| `0` (from DB) | treated as `null` → `—` |
| `> 0` | `X.X / 10` |

**Sorting**: `null` and `0` both sort as `0`. Clinics without a score for the active source sink to the bottom on "Highest Rated" and float to the top on "Lowest Rated". This is intentional — unscored clinics shouldn't appear to outrank scored ones.

---

## Score Card vs Raw Signals

Each source view shows two layers of data:

1. **Score card** (top) — reads `clinic.xScore` from the server-loaded `ClinicListItem`. Available immediately on render, no loading state needed.

2. **Detailed signals** (below) — reads from `useClinicCompareSignals()` which fires client-side after a clinic is selected. Shows a loading state while fetching. These are the raw underlying signals: thread counts, sentiment breakdowns, review excerpts, follower counts, etc.

The score and the signals are computed from the same underlying data but fetched separately. They should be consistent, but the score reflects the last time the scoring pipeline ran, while signals reflect live DB state.

---

## Permissions

`clinic_source_scores` requires an explicit `grant select` for the `anon` role. Without it, logged-out users get a silent empty result. This grant is handled in a migration owned by the scoring pipeline PR — confirm it is applied before deploying the comparison page to production.

---

## Adding a New Source

1. Have the scoring pipeline write rows to `clinic_source_scores` with the new `source_name`
2. Add the source name to the `.in('source_name', [...])` filter in `getClinicSourceScores()`
3. Add a new score field to `ClinicListItem` (e.g. `tiktokScore?: number | null`)
4. Map the new `source_name` in the `for` loop in `getClinicSourceScores()`
5. Add a new route under `app/clinics/compare/<source>/page.tsx`
6. Add the source to the `SOURCES` array in `CompareClinicPage.tsx`
7. Create a view component in `components/istanbulmedic-connect/comparison/`
