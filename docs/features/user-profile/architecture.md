# User Profile — Architecture

How the Treatment Passport feature is built: file structure, component logic, API contracts, and data persistence.

---

## File structure

```
app/profile/
├── page.tsx                              # Renders ProfileDashboard
└── get-started/page.tsx                  # Renders GetStarted wizard

components/istanbulmedic-connect/user-profile/
├── ProfileDashboard.tsx                  # Sidebar-nav shell, section router
├── GetStarted.tsx                        # Onboarding wizard (6 steps)
└── sections/
    ├── ProfileHome.tsx                   # Welcome banner + photo upload
    ├── ProfilePersonalInfo.tsx           # Contact details + treatment prefs
    ├── ProfileMedicalHistory.tsx         # Transplants, surgeries, allergies
    ├── ProfileHairLossStatus.tsx         # Norwood scale + duration
    └── ProfileConsultations.tsx          # Coming soon placeholder

app/api/profile/
├── qualification/route.ts                # GET + POST — qualification data
├── treatment/route.ts                    # GET + POST — treatment profile data
└── photos/route.ts                       # GET + DELETE — photo management

app/api/auth/
└── callback/route.ts                     # OAuth callback + user bootstrap

lib/api/userProfile.ts                    # All Supabase read/write logic
types/user.ts                             # UserProfile interface
```

---

## GetStarted wizard

A 6-step form at `/profile/get-started`. Each step saves its answer to `localStorage` under the key `im.qualification`. Steps whose data is already present in localStorage are skipped on re-entry (`computeVisibleSteps()`). See [README.md](./README.md) for the database tables written and how to verify data after submission.

### Steps

| Index | Question | Field |
|-------|----------|-------|
| 0 | Age | `ageTier` |
| 1 | Gender | `gender` |
| 2 | Norwood scale | `norwoodScale` |
| 3 | Country | `country` |
| 4 | Budget | `budgetTier` |
| 5 | Timeline | `timeline` |
| 6 | Contact (name, phone, consent) | Submitted on "Create my account" |

### Submission

On "Create my account": POST to `/api/profile/qualification` with the full payload including `termsAccepted: true`. On success, the user is redirected to `/profile`.

### Tables written on submit

- `users` — `auth_id`, `name`, `email`
- `user_profiles` — `given_name`, `family_name`, `preferred_language`
- `user_qualification` — all qualification fields + `terms_accepted`
- `user_treatment_profiles` — `norwood_scale` (duplicate write for quick clinic matching)

---

## ProfileDashboard

Layout shell at `/profile`. Renders a sticky sidebar (desktop) and a scrollable tab strip (mobile) with five nav items. Keeps the active section in `useState`; scrolls to top on section change.

```
ProfileDashboard
└── active state: 'home' | 'personal-info' | 'medical-history' | 'hair-loss-status' | 'consultations'
```

Shows user initials or avatar from `useAuth()`. Falls back to email prefix when no name is available.

---

## Section components

All editable sections follow the same autosave pattern:

1. Fetch existing data on mount via the relevant GET endpoint.
2. On any field change, cancel any pending debounce timer, set `saveState = 'pending'`, and start a new 800 ms timer.
3. When the timer fires, POST the full section payload. Update `saveState` to `'saving'`, then `'saved'` or `'error'`.
4. A `CardHeader` sub-component renders the section title and current `saveState` inline.

### ProfilePersonalInfo

- GET/POST `/api/profile/qualification`
- Fields: first name, last name, gender, birthday, phone (WhatsApp), country, preferred language, budget range, timeline
- Email is read-only (sourced from `useAuth().profile.email`)

### ProfileMedicalHistory

- GET/POST `/api/profile/treatment`
- Fields: prior transplants (year, grafts, country), prior surgeries (type, year, notes), allergies[], medications[], other conditions[]
- Each list is replaced in full on every save

### ProfileHairLossStatus

- GET/POST `/api/profile/treatment`
- Fields: Norwood scale (1–7), hair loss duration

### ProfileHome

- Fetches photos via GET `/api/profile/photos` on mount
- Uploads go directly to Supabase Storage (`user-photos` bucket), then the public URL is written to `user_photos` via POST `/api/profile/treatment`
- Renders section nav cards that call `onNavigate(sectionId)` to switch the dashboard view

---

## Photo uploads

- 5 views: `front`, `left_side`, `right_side`, `top`, `donor_area`
- Storage path: `{auth_user_id}/{view}.{ext}`
- Upserted to `user_photos` with `onConflict: 'user_id,photo_view'`
- Accepted types: `image/jpeg`, `image/png`, `image/webp` · Max size: 10 MB
- Old photo file is removed from Storage before the new one is uploaded

---

## Auth bootstrap (`/api/auth/callback`)

On first Google sign-in:
1. Supabase exchanges the OAuth code for a session.
2. Insert into `users` (`auth_id`, `name`, `email`).
3. Insert into `user_profiles` (`given_name`, `family_name`, `avatar_url`, `preferred_language`).
4. Redirect to `/profile/get-started`.

On subsequent sign-ins, existing rows are left unchanged and the user is redirected to `/profile`.

---

## API routes

| Method | Route | Lib function | Description |
|--------|-------|-------------|-------------|
| GET | `/api/profile/qualification` | `getQualification()` | Returns qualification data; `null` fields if no row |
| POST | `/api/profile/qualification` | `upsertQualification(payload)` | Upserts qualification data across 3 tables |
| GET | `/api/profile/treatment` | `getTreatmentProfile()` | Returns treatment profile including transplants/surgeries |
| POST | `/api/profile/treatment` | `upsertTreatmentProfile(payload)` | Upserts treatment data; replaces transplants/surgeries lists |
| GET | `/api/profile/photos` | `getUserPhotos()` | Returns `[{ photo_view, storage_url }]` |
| DELETE | `/api/profile/photos` | — | Deletes one photo by `view`. Body: `{ view }` |

All routes return `401` for `'Unauthenticated'` errors and `500` for unexpected errors.

---

For the full database table breakdown and environment variable setup, see [README.md](./README.md).
