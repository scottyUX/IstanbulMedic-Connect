# Test Suite — User Profile

Tests are written with **Vitest** and **@testing-library/react**. 121 tests across 7 files, all passing.

---

## Running tests

```bash
# Run all tests once
npx vitest run

# Watch mode
npx vitest

# Run a specific file
npx vitest run tests/lib/userProfile.test.ts
npx vitest run tests/components/GetStarted.test.tsx
npx vitest run tests/components/ProfileDashboard.test.tsx
```

---

## Test files

| File | What it tests | Tests |
|------|--------------|-------|
| `tests/lib/userProfile.test.ts` | Supabase data layer | 33 |
| `tests/api/authCallback.test.ts` | Auth callback route | — |
| `tests/components/GetStarted.test.tsx` | Onboarding wizard | — |
| `tests/components/ProfileDashboard.test.tsx` | Dashboard nav + auth | — |
| `tests/components/sections/ProfileHome.test.tsx` | Home section | — |
| `tests/components/sections/ProfilePersonalInfo.test.tsx` | Personal info section | — |
| `tests/components/sections/ProfileHairLossStatus.test.tsx` | Hair loss section | — |

---

## `tests/lib/userProfile.test.ts`

Tests every exported function in `lib/api/userProfile.ts`.

### Mocking strategy

Supabase is mocked at `@/lib/supabase/server`. A `makeClient()` factory builds a fake client with per-table query builders. Each builder is a chainable, **thenable** object — so `await supabase.from('x').select().eq()` resolves without calling a terminal method.

```ts
const qb = (result) => {
  const p = Promise.resolve(result)
  const b = { select: () => b, eq: () => b, maybeSingle: () => p, ... }
  b.then = p.then.bind(p); b.catch = p.catch.bind(p); b.finally = p.finally.bind(p)
  return b
}
```

### Functions covered

#### `getQualification()`
- Returns `null` fields when no row exists
- Maps DB column names to camelCase (`age_tier → ageTier`, etc.)
- Throws when parallel supplementary queries fail (error propagation)
- Throws `'Unauthenticated'` when no session

#### `upsertQualification(payload)`
- Splits `fullName` into `firstName`/`lastName`
- Writes to `users`, `user_profiles`, `user_qualification`
- Omits `terms_accepted` from the upsert when not in the payload
- Throws `'Unauthenticated'` when no session

#### `getTreatmentProfile()`
- Returns `null` when no DB record
- Maps all fields including `priorTransplants[]` and `priorSurgeries[]`
- Returns empty arrays when no child rows

#### `upsertTreatmentProfile(payload)`
- Upserts `user_treatment_profiles`
- Deletes and re-inserts prior transplants and surgeries
- Maps `{ type }` payload field to `surgery_type` DB column
- Upserts photos with `onConflict: 'user_id,photo_view'` (parallel, one call per photo)
- Throws on DB constraint violations

#### `getUserPhotos()`
- Returns `[]` when user has no photos or is unauthenticated (soft auth)
- Returns rows with `photo_view` and `storage_url`

---

## `tests/api/authCallback.test.ts`

Tests the OAuth callback route at `app/api/auth/callback/route.ts`.

Covers: code exchange, first-time user bootstrap (insert into `users` + `user_profiles`), returning user (no re-insert), redirect targets (`/profile/get-started` vs `/profile`), and error cases.

---

## `tests/components/GetStarted.test.tsx`

Tests the 6-step onboarding wizard component.

### Mocking strategy

- `framer-motion` — `AnimatePresence` passes children through; `motion.div` strips animation props
- `lucide-react` — `ArrowLeft → <span>Back</span>`, `ArrowRight → null`, `CheckCircle2 → null` (null keeps button accessible names clean — "Continue" not "Continue →", "18 – 24" not "18 – 24 ✓")
- `@/lib/supabase/client` — `createClient` returns `null`
- `next/link` — renders as a plain `<a>`

### `goToStep(n)` helper

Navigates through `n` steps by selecting a valid option then clicking Continue. Used by most tests to reach a specific step without repeating setup.

### Test groups

- **Rendering** — age step shown on mount, all age options present
- **Continue button state** — disabled with no selection, enabled after selection
- **Step navigation** — advances on Continue, Back returns to previous step, no Back button on step 0
- **Norwood step** — all 7 stages rendered, Continue disabled until selection
- **Country step** — Continue disabled with < 2 chars, enabled at 2+
- **Contact step** — name + phone inputs, email is read-only, Create my account button disabled/enabled logic for name, consent, and phone validity
- **Consent checkbox** — toggles Create my account enabled state
- **localStorage** — skips age step when `ageTier` already in `im.qualification`, skips hair loss step when `norwoodScale` already set

---

## `tests/components/ProfileDashboard.test.tsx`

Tests the `ProfileDashboard` layout shell. All section components are stubbed with `data-testid` divs so these tests stay focused on nav logic.

### Test groups

- **Loading state** — renders nothing while `useAuth().loading` is true
- **Default section** — shows home section on mount
- **Sidebar navigation** — clicking each nav item renders the correct section
- **`onNavigate` callback** — `ProfileHome` calling `onNavigate('personal-info')` switches the active section
- **User identity strip** — displays full name, initials, email; falls back to email prefix when no name; shows avatar `<img>` when `avatar_url` is set
- **Nav item count** — all 5 nav items appear in both sidebar and mobile strip

---

## `tests/components/sections/ProfileHome.test.tsx`

Tests the home section: welcome banner, photo grid, and section nav cards.

Covers: loading skeleton, banner content, avatar vs initials fallback, photo grid renders all 5 views, upload triggers fetch, delete removes photo from state, file type and size validation errors, nav card clicks call `onNavigate`.

---

## `tests/components/sections/ProfilePersonalInfo.test.tsx`

Tests the personal info section.

### Mocking strategy

- `@/contexts/AuthContext` mocked; `useAuth()` returns a controllable value
- `global.fetch` mocked per test with a `setupFetch()` helper that handles GET (return qual data) and POST (return success or error)
- `vi.useFakeTimers()` + `await act(async () => { render() })` — flushes the `useEffect` data fetch via React's async act so state is settled before asserting

### Key pattern: fake timers + save state

```ts
// Trigger debounce
act(() => { vi.advanceTimersByTime(900) })
// saving=true is now flushed synchronously
expect(screen.getAllByText('Saving…').length).toBeGreaterThan(0)

// Resolve the fetch promise
await act(async () => {})
// saved=true is now flushed
expect(screen.getAllByText('Saved').length).toBeGreaterThan(0)
```

`getAllByText` (not `getByText`) is required because two `CardHeader` components share the same `saveState`.

### Test groups

- **Loading state** — skeleton shown before fetch resolves
- **Data loading** — first name, last name, country pre-filled; email is read-only
- **Gender select** — renders combobox with loaded value
- **Autosave** — changing a field triggers POST to `/api/profile/qualification` after debounce
- **Save states** — shows "Saving…" then "Saved" on success; "Save failed" on error response
- **Treatment preferences** — budget and timeline selects rendered

---

## `tests/components/sections/ProfileHairLossStatus.test.tsx`

Tests the hair loss status section.

Same fake-timer rendering pattern as `ProfilePersonalInfo`. Uses `setupFetch()` / `renderLoaded()` helpers.

### Test groups

- **Loading state** — skeleton shown while fetch is pending
- **Data loading** — all 7 Norwood stage options rendered, all 5 duration options rendered; loaded values marked as selected via `border-[#17375B]` class
- **Unselected style** — unselected stages use `text-muted-foreground`
- **Autosave on selection** — clicking a Norwood stage or duration triggers POST with correct field value
- **Save states** — "Saving…" → "Saved" on success; "Save failed" on error
- **Empty state** — no stage button has the selected-state class when DB returns `null`; uses `btn.className.split(' ')` to avoid false positive on `hover:border-[#17375B]/40`

---

## What is not tested

| Area | Reason |
|------|--------|
| Real Supabase database | Integration tests need a live instance; not part of this CI suite |
| Actual Supabase Storage uploads | Requires a real storage bucket |
| ProfileMedicalHistory component | No component test written yet — covered indirectly by `userProfile.test.ts` |
| ProfileConsultations component | Coming soon placeholder; nothing to test |
