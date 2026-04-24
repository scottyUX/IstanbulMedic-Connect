# User Profile Dashboard — Architecture

Treatment Passport for IstanbulMedic Connect. Users build a profile through a guided onboarding wizard, then manage it through a persistent dashboard.

---

## User flow

```
/get-started  →  GetStarted wizard (6 steps)  →  /profile  →  ProfileDashboard
```

The wizard collects the minimum data needed to match clinics. The dashboard lets users complete and maintain their full profile over time.

---

## Dashboard structure

```
ProfileDashboard (layout shell)
├── sidebar nav (desktop) + mobile tab strip
└── section router
    ├── ProfileHome          — welcome banner, photo uploads, section nav cards
    ├── ProfilePersonalInfo  — contact details, treatment preferences
    ├── ProfileMedicalHistory— transplants, surgeries, allergies, medications
    ├── ProfileHairLossStatus— Norwood scale, duration, donor area assessment
    └── ProfileConsultations — coming soon placeholder
```

Route: `app/profile/page.tsx` renders `ProfileDashboard` directly.

---

## Database tables

| Table | Purpose |
|-------|---------|
| `users` | Internal user row (`id`, `auth_id`, `name`, `email`) |
| `user_profiles` | Google OAuth extras (`given_name`, `family_name`, `avatar_url`, `preferred_language`) |
| `user_qualification` | Onboarding + matching data (see below) |
| `user_treatment_profiles` | Clinical data: Norwood, donor area, allergies, surgeries, photos |
| `user_photos` | One row per uploaded photo view (`user_id`, `photo_view`, `storage_url`, …) |

The `users` table is the join key. `auth_id` links to `auth.users`; `id` (UUID) is the FK used in all other tables.

---

## user_qualification columns

| Column | Type | Source |
|--------|------|--------|
| `age_tier` | text | GetStarted step 0 |
| `gender` | text | GetStarted step 1 |
| `norwood_scale` | int | GetStarted step 2 (also written to `user_treatment_profiles`) |
| `country` | text | GetStarted step 3 / PersonalInfo |
| `budget_tier` | text | GetStarted step 4 / PersonalInfo |
| `timeline` | text | GetStarted step 5 / PersonalInfo |
| `full_name` | text | GetStarted contact step / PersonalInfo |
| `whats_app` | text | GetStarted contact step / PersonalInfo |
| `terms_accepted` | bool | GetStarted contact step only |
| `preferred_language` | text | PersonalInfo (also written to `user_profiles`) |
| `birthday` | date | PersonalInfo |
| `email` | text | GetStarted / PersonalInfo |

---

## API routes

| Route | Method | Handler |
|-------|--------|---------|
| `/api/profile/qualification` | GET | `getQualification()` |
| `/api/profile/qualification` | POST | `upsertQualification(payload)` |
| `/api/profile/treatment` | GET | `getTreatmentProfile()` |
| `/api/profile/treatment` | POST | `upsertTreatmentProfile(payload)` |
| `/api/profile/photos` | GET | `getUserPhotos()` |
| `/api/profile/photos` | DELETE | removes a photo by view |
| `/api/auth/callback` | GET | Supabase OAuth callback + profile bootstrap |

All handlers live in `lib/api/userProfile.ts`.

---

## GetStarted wizard steps

| Step index | Field | localStorage key |
|-----------|-------|-----------------|
| 0 | Age tier | `im.qualification.ageTier` |
| 1 | Gender | `im.qualification.gender` |
| 2 | Norwood scale | `im.qualification.norwoodScale` |
| 3 | Country | `im.qualification.country` |
| 4 | Budget tier | `im.qualification.budgetTier` |
| 5 | Timeline | `im.qualification.timeline` |
| 6 | Contact (name, phone, consent) | submitted on "Create my account" |

Steps whose data is already present in `localStorage` are skipped via `computeVisibleSteps()`. This lets returning users jump straight to incomplete steps.

---

## Autosave pattern

Every editable section component follows the same pattern:

1. Fetch existing data on mount via the relevant GET endpoint.
2. On any field change, debounce 800 ms then POST the full section payload.
3. A `saveState` (`idle | pending | saving | saved | error`) is shown in each `CardHeader`.

Photo uploads go directly to Supabase Storage, then the public URL is written to `user_photos` via POST `/api/profile/treatment`.

---

## Photo uploads

- 5 views: `front`, `left_side`, `right_side`, `top`, `donor_area`
- Storage bucket: `user-photos`
- Path pattern: `{auth_user_id}/{view}.{ext}`
- Upserted to `user_photos` with `onConflict: 'user_id,photo_view'`
- Max size: 10 MB · Accepted types: JPEG, PNG, WebP

---

## Auth bootstrap

On first Google sign-in (`/api/auth/callback`):
1. Supabase exchanges the OAuth code for a session.
2. A row is inserted into `users` (`auth_id`, `name`, `email`).
3. A row is inserted into `user_profiles` (`given_name`, `family_name`, `avatar_url`, `preferred_language`).
4. The user is redirected to `/profile/get-started`.

On subsequent sign-ins, the existing rows are left unchanged and the user is redirected to `/profile`.

---

## Related files

- [lib/api/userProfile.ts](../../lib/api/userProfile.ts) — all DB read/write logic
- [components/istanbulmedic-connect/user-profile/ProfileDashboard.tsx](../../components/istanbulmedic-connect/user-profile/ProfileDashboard.tsx) — layout shell
- [components/istanbulmedic-connect/user-profile/GetStarted.tsx](../../components/istanbulmedic-connect/user-profile/GetStarted.tsx) — onboarding wizard
- [tests/lib/userProfile.test.ts](../../tests/lib/userProfile.test.ts) — API layer tests (33 tests)
- [tests/components/ProfileDashboard.test.tsx](../../tests/components/ProfileDashboard.test.tsx) — nav/auth tests
