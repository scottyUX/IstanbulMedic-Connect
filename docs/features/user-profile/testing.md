# Test Suite — User Profile

This document explains the test suite for the User Profile / Digital Treatment Passport feature. Tests are written with **Vitest** and **@testing-library/react**.

---

## Running Tests

```bash
# Run all tests once
npx vitest run

# Watch mode (re-runs on file change)
npx vitest

# Run a specific file
npx vitest run tests/lib/userProfile.test.ts
npx vitest run tests/api/profileRoutes.test.ts
npx vitest run tests/components/UserProfileDashboard.test.tsx
```

---

## Test Files

| File | What it tests | Approach |
|------|--------------|----------|
| `tests/lib/userProfile.test.ts` | Supabase data layer (`lib/api/userProfile.ts`) | Unit — mocks Supabase client |
| `tests/api/profileRoutes.test.ts` | Next.js API route handlers | Unit — mocks lib functions |
| `tests/components/UserProfileDashboard.test.tsx` | Dashboard component | Component — mocks `fetch` |

---

## `tests/lib/userProfile.test.ts`

**What it covers:** Every exported function in `lib/api/userProfile.ts` — the layer that talks directly to Supabase.

### Mocking Strategy

Supabase is mocked at `@/lib/supabase/server`. Each test creates a fake client using a `makeClient()` factory that returns a mock `supabase` object. Query builders are created with a `qb(result)` helper that returns a chainable, **thenable** object — so `await supabase.from(...).select(...).eq(...)` resolves to `result` without calling `.maybeSingle()` or any terminal method.

```ts
// The qb() helper is thenable so direct await works
const qb = (result) => {
  const promise = Promise.resolve(result)
  const builder = { select: () => builder, eq: () => builder, ... }
  builder.then = promise.then.bind(promise)
  builder.catch = promise.catch.bind(promise)
  builder.finally = promise.finally.bind(promise)
  return builder
}
```

### Functions Tested

#### `getQualification()`

| Test | Scenario |
|------|----------|
| Returns `null` fields when no row exists | `maybeSingle()` returns `{ data: null }` |
| Maps DB column names to camelCase | `age_tier → ageTier`, etc. |
| Includes country and hair loss fields | Full field mapping verified |
| Throws `'Unauthenticated'` when no session | `getUser()` returns `{ data: { user: null } }` |

#### `getTreatmentProfile()`

| Test | Scenario |
|------|----------|
| Returns `null` when no DB record | `maybeSingle()` returns `{ data: null }` |
| Maps all treatment profile fields | `norwood_scale`, `donor_area_quality`, etc. |
| Returns populated `priorTransplants[]` | Joins transplant rows correctly |
| Returns empty arrays when no transplants/surgeries | No join rows |

#### `getProfileStatus()`

| Test | Scenario |
|------|----------|
| Returns `null` when unauthenticated | No session |
| Returns `{ qualificationComplete: false, treatmentComplete: false }` | No DB rows |
| Returns `qualificationComplete: true` when qualification row exists | Row present |
| Returns both `true` when both rows exist | Both rows present |

#### `upsertQualification(payload)`

| Test | Scenario |
|------|----------|
| Splits `fullName` into `firstName` and `lastName` | `"John Smith" → first: "John", last: "Smith"` |
| Calls `upsert` on `users`, `user_profiles`, `user_qualification` | All three tables written |
| Throws `'Unauthenticated'` when no session | Auth check |
| Returns `{ userId }` on success | Return value verified |

#### `upsertTreatmentProfile(payload)`

| Test | Scenario |
|------|----------|
| Throws `'Unauthenticated'` when no session | Auth check |
| Upserts `user_treatment_profiles` correctly | Main table written |
| Deletes and re-inserts `priorTransplants` | List replace strategy |
| Throws on DB constraint violation | Error propagated |

#### `getUserPhotos()`

| Test | Scenario |
|------|----------|
| Throws `'Unauthenticated'` when no session | Auth check |
| Returns `[]` when user has no photos | Empty result |
| Returns photo rows with `photo_view` and `storage_url` | Row mapping |
| Throws on storage error | Error propagated |

#### `deleteUserPhoto(view)`

| Test | Scenario |
|------|----------|
| Throws `'Unauthenticated'` when no session | Auth check |
| Calls delete with the correct `view` filter | Correct WHERE clause |
| Throws on delete failure | Error propagated |

---

## `tests/api/profileRoutes.test.ts`

**What it covers:** The HTTP layer — the Next.js route handlers in `app/api/profile/`.

### Mocking Strategy

All functions from `@/lib/api/userProfile` are mocked with `vi.mock()`. The route handlers are imported *after* the mock is set up so they pick up the fake implementations. A `makeRequest(body)` helper creates a minimal `Request`-like object for POST/DELETE handlers.

```ts
vi.mock('@/lib/api/userProfile', () => ({
  getQualification: vi.fn(),
  upsertQualification: vi.fn(),
  // ...
}))
```

### Routes and Tests

#### `GET /api/profile/qualification`

| Test | Expected |
|------|----------|
| Lib returns data | `200 { success: true, data }` |
| Lib throws `'Unauthenticated'` | `401 { success: false, error: 'Unauthenticated' }` |
| Lib throws unexpected error | `500 { success: false }` |

#### `POST /api/profile/qualification`

| Test | Expected |
|------|----------|
| Lib returns `{ userId }` | `200 { success: true, userId }` |
| Lib throws `'Unauthenticated'` | `401` |
| Lib throws unexpected error | `500` |

#### `GET /api/profile/treatment`

| Test | Expected |
|------|----------|
| No treatment profile yet | `200 { success: true, data: null }` |
| Full treatment data returned | `200` with `norwoodScale`, `allergies`, etc. |
| Lib throws `'Unauthenticated'` | `401` |
| Lib throws unexpected error | `500` |

#### `POST /api/profile/treatment`

| Test | Expected |
|------|----------|
| Lib returns `{ userId }` | `200 { success: true, userId }` |
| Lib throws `'Unauthenticated'` | `401` |

#### `GET /api/profile/status`

| Test | Expected |
|------|----------|
| Lib returns `null` (no session) | `401 { error: 'Unauthenticated' }` |
| Both phases false | `200 { data: { qualificationComplete: false, treatmentComplete: false } }` |
| Phase 1 complete | `200 { data: { qualificationComplete: true, treatmentComplete: false } }` |
| Both complete | `200 { data: { qualificationComplete: true, treatmentComplete: true } }` |
| Lib throws unexpected error | `500` |

#### `GET /api/profile/photos`

| Test | Expected |
|------|----------|
| No photos | `200 { success: true, data: [] }` |
| Has photos | `200` with `data` array of `{ photo_view, storage_url }` |
| Lib throws unexpected error | `500` |

#### `DELETE /api/profile/photos`

| Test | Expected |
|------|----------|
| Body missing `view` | `400 { error: 'view is required' }` |
| Successful deletion | `200 { success: true }` |
| Lib throws on delete | `500` |

---

## `tests/components/UserProfileDashboard.test.tsx`

**What it covers:** The `UserProfileDashboard` React component — rendering, phase state logic, API integration, and localStorage fallback.

### Mocking Strategy

`global.fetch` is replaced with a `vi.fn()` mock. Two helpers configure common scenarios:

```ts
mockApiSuccess(qualificationComplete, treatmentComplete)
// → fetch resolves with { ok: true, json: { success: true, data: { ... } } }

mockApiFail()
// → fetch resolves with { ok: false }
```

`beforeEach` clears all mocks, clears `localStorage`, and defaults to `mockApiFail()`.

### Test Groups

#### Rendering

| Test | Verifies |
|------|----------|
| Title and subtitle render | "Digital Treatment Passport" heading is present |
| All four phase labels render | "Get Started", "Treatment Profile", "AI Insights", "Share & Connect" |
| Phase number labels render | "Phase 1" through "Phase 4" in stepper |

#### Initial state (nothing complete)

| Test | Verifies |
|------|----------|
| Shows 0% overall progress | `{overallPct}%` in header |
| Phase 1 is "Not started", phases 2–4 are "Locked" | Badge text on each phase card |
| Phase 1 links to `/profile/get-started` | `<a href="/profile/get-started">` |
| Locked phases have no links | Only 1 phase link exists initially |

#### Phase 1 complete (`qualificationComplete: true`)

| Test | Verifies |
|------|----------|
| Shows 25% overall progress | `{overallPct}%` = "25%" |
| Phase 1 badge shows "Complete" | Badge text changes |
| Phase 2 becomes "Not started" (unlocked) | 1 "Not started", 2 "Locked" |
| Phase 2 links to `/profile/treatment-profile` | `<a href="/profile/treatment-profile">` |

#### Phases 1 and 2 complete (`qualificationComplete: true, treatmentComplete: true`)

| Test | Verifies |
|------|----------|
| Shows 50% overall progress | `{overallPct}%` = "50%" |
| Two "Complete" badges shown | Both phase 1 and 2 badges |
| Phase 3 unlocks (becomes "Not started") | 1 "Not started", 1 "Locked" |
| Phase 3 links to `/profile/ai-insights` | `<a href="/profile/ai-insights">` |

#### Phase 3 unlock chain

| Test | Verifies |
|------|----------|
| Phase 3 stays locked when only phase 1 done | 2 phases still "Locked" |
| Phase 3 unlocks only when phases 1 AND 2 are done | Sequential unlock enforced |
| Phase 3 href is `/profile/ai-insights` | Correct link when unlocked |

#### localStorage fallback

| Test | Verifies |
|------|----------|
| Phase 1 shows "Complete" from localStorage when API throws | Network error fallback |
| Both phases show "Complete" from localStorage when API returns non-ok | 401/500 fallback |
| Phase 2 shows as "available" when only `im.qualification.complete` set locally | Partial fallback state |

#### API call

| Test | Verifies |
|------|----------|
| Calls `/api/profile/status` on mount | `fetch` called with correct URL |

---

## What Is Not Tested

| Area | Reason |
|------|--------|
| `GetStarted.tsx` component | Form is complex and multi-step; covered by lib + route tests instead |
| `TreatmentProfile.tsx` component | Same as above |
| Photo file upload (Supabase Storage) | Requires integration test with real storage bucket |
| Real Supabase database | Integration tests need a live Supabase instance; not part of this CI suite |
| Phase 4 (Share & Connect) unlock | Phase 4 is not yet implemented |
| The per-phase progress bar | Only renders when a phase is 1–99% complete. The current API returns boolean completion (0% or 100%) so this state is not reachable with the current data model. |
