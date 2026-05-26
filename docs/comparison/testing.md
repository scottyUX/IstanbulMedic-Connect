# Comparison Feature — Testing

## Test files

| File | What it covers |
|------|---------------|
| `tests/unit/clinics-api.test.ts` → `getClinicSourceScores` suite | Data fetching logic, score mapping, edge cases |
| `tests/components/ComparisonViews.test.tsx` | Score cards in each view, `—` fallback, `ClinicRow` score pill |

Run them:
```bash
npx vitest run tests/unit/clinics-api.test.ts tests/components/ComparisonViews.test.tsx
```

**Total: 61 tests — all passing.**

---

## Unit tests — `getClinicSourceScores`

Covers the core data-fetching function that powers all per-source scores across every comparison page.

| Test | What it proves |
|------|---------------|
| Empty clinicIds → empty map, no DB call | Fast-exit guard works |
| No matching rows → all four scores null | Correct initialisation |
| `source_name` → correct field, `summary_score ÷ 10` | Mapping and scale conversion |
| `summary_score = 0` → treated as null | Placeholder rows don't show as `0.0` |
| Multiple clinics get independent scores | No cross-contamination between clinics |
| DB error → all-null map, no throw | Page degrades gracefully rather than crashing |
| Query includes `is_current = true` filter | Stale/historical score rows excluded |

---

## Component tests — `ComparisonViews.test.tsx`

Each source view is tested to confirm it reads from `clinic_source_scores` (via `clinic.xScore` props) rather than the client-side signals hook.

**Per-view score card tests:**
- `RedditView` — shows `clinic.redditScore`, shows `—` when null
- `GooglePlacesView` — shows `clinic.googleScore`, shows raw star rating alongside it, shows `—` when null
- `HRNView` — shows `clinic.hrnScore`, shows `—` when null (expected in production without live HRN signals)
- `InstagramView` — shows `clinic.instagramScore`, shows `—` when null

**`ClinicRow` score pill tests (`CompareClinicPage`):**
- Google Places tab renders `googleScore` in the pill
- Reddit tab renders `redditScore` in the pill
- Instagram tab renders `instagramScore` in the pill
- Null score renders `—` in the pill

> **Note on dual-pane rendering**: `CompareClinicPage` renders two identical clinic lists (Clinic A and Clinic B panes), so the same score value appears twice in the DOM. Tests use `getAllByText(...).length > 0` rather than `getByText`.

---

## Mock strategy

`useClinicCompareSignals` is stubbed to return `{ data: null, loading: false }` in all component tests. This means:
- Score cards are tested against server-loaded `clinic.xScore` props only
- The detailed signal sections (thread counts, sentiment, reviews) show their empty/no-data states
- Tests are fast and deterministic — no async signal fetches

If you want to test signal-section rendering (e.g. Reddit's sentiment bars, Google's review list), pass mock data through the `useClinicCompareSignals` stub:
```ts
vi.mocked(useClinicCompareSignals).mockReturnValue({
  data: { reddit: { score: 7.5, threadCount: 12, ... }, ... },
  loading: false,
})
```

---

---

## Sorting tests — `CompareClinicPage — sorting`

Three clinics are passed to `CompareClinicPage`: Zeta (score 9.5), Mira (7.0), Aria (null). The `next/navigation` mock uses `vi.hoisted()` so `mockGetParam` is a stable reference that each test configures before render — this lets the `useState` initialiser read the correct sort value from `searchParams.get("sort")`.

| Test | Sort param | Asserts DOM order |
|------|-----------|-------------------|
| Highest Rated | `?sort=highest` | Zeta → Mira → Aria (null treated as 0) |
| Lowest Rated | `?sort=lowest` | Aria → Mira → Zeta |
| Alphabetical | _(none)_ | Aria → Mira → Zeta (by name, ignores score) |

> **Implementation note**: `CompareClinicPage` renders two identical panes, so each clinic row appears twice in the DOM. Tests use `button.textContent.includes(clinicName)` with `findIndex` on the first occurrence (Pane A) to check order.

---

## What's not covered yet

| Gap | Priority | Notes |
|-----|----------|-------|
| URL sync (`?left=&right=&sort=`) | Medium | Test that `router.replace` is called with correct params on selection |
| `AllSourcesView` composite score display | Low | Shows `trustScore / 10`, Band badge, and per-source score badges |
| `useClinicCompareSignals` hook | Low | Already indirectly covered by existing signal-section tests elsewhere; would benefit from dedicated hook tests |
| Source tab navigation | Low | Confirm `router.push` is called with correct route when switching tabs |
