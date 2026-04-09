# User Profile — Architecture

This document explains how the Digital Treatment Passport feature is built: file structure, component logic, API contracts, data persistence, and the database schema.

---

## File Structure

```
app/profile/                              # Pages (Next.js App Router)
├── page.tsx                              # Dashboard page
├── get-started/page.tsx                  # Phase 1 page
└── treatment-profile/page.tsx            # Phase 2 page

components/istanbulmedic-connect/user-profile/
├── UserProfileDashboard.tsx              # Progress dashboard (4-phase stepper + cards)
├── GetStarted.tsx                        # Phase 1 multi-step form
└── TreatmentProfile.tsx                  # Phase 2 multi-step form

app/api/profile/
├── qualification/route.ts                # GET + POST — Phase 1 data
├── treatment/route.ts                    # GET + POST — Phase 2 data
├── status/route.ts                       # GET — Phase completion flags
└── photos/route.ts                       # GET + DELETE — Photo management

lib/api/userProfile.ts                    # All Supabase operations
types/patient-profile.ts                  # TypeScript types and enums
```

---

## Phase 1 — Get Started (`GetStarted.tsx`)

An 8-step form collecting qualification and contact information.

### Steps

| # | Step | Field(s) |
|---|------|----------|
| 1 | Age | `ageTier` |
| 2 | Gender | `gender` |
| 3 | Hair Loss Pattern | `hairLossPattern` |
| 4 | Country | `country` |
| 5 | Budget | `budgetTier` |
| 6 | Timeline | `timeline` |
| 7 | Contact Info | `fullName`, `email`, `whatsApp`, `preferredLanguage` |
| 8 | Terms & Review | `termsAccepted` |

### Enums

- **AgeTier**: `18_24`, `25_34`, `35_44`, `45_54`, `55_64`, `65_plus`
- **Gender**: `male`, `female`, `other`, `prefer_not_to_say`
- **BudgetTier**: `under_2000`, `2000_5000`, `5000_8000`, `8000_12000`, `12000_plus`
- **Timeline**: `asap`, `1_3_months`, `3_6_months`, `6_12_months`, `12_plus_months`

### Persistence Logic

The form uses a hybrid localStorage + database strategy:

1. **Every step** saves to `localStorage` under the key `im.qualification`
2. **On mount** for a signed-in user:
   - If `im.qualification.complete === "true"` and local data exists → keep local data, fire a background POST to sync it to the DB. This handles the case where a user fills out the form and then signs in with an existing account — their fresh local answers override old DB data.
   - Otherwise → fetch from DB and populate the form
3. **On final submit** → POST to `/api/profile/qualification`, set `im.qualification.complete = "true"`

### Database Tables Written

- `users` — `auth_id`, `name`, `email`
- `user_profiles` — `first_name`, `last_name`, `gender`, `preferred_language`
- `user_qualification` — `age_tier`, `country`, `hair_loss_pattern`, `budget_tier`, `timeline`, `whatsapp_number`, `terms_accepted`

---

## Phase 2 — Treatment Profile (`TreatmentProfile.tsx`)

An 11-step form collecting detailed medical and physical information.

### Steps

| # | Step | Field(s) |
|---|------|----------|
| 1 | Norwood Scale | `norwoodScale` (1–7) |
| 2 | Hair Loss Duration | `durationYears` |
| 3 | Donor Area Quality | `donorAreaQuality` |
| 4 | Donor Area Availability | `donorAreaAvailability` |
| 5 | Desired Density | `desiredDensity` |
| 6 | Prior Transplants | `hadPriorTransplant`, `priorTransplants[]` |
| 7 | Photos | 5 photo views uploaded to Supabase Storage |
| 8 | Allergies | `allergies[]` |
| 9 | Medications | `medications[]` |
| 10 | Prior Surgeries | `priorSurgeries[]` |
| 11 | Medical Conditions | `otherConditions[]` |

### Photo Uploads

Photos are stored in the `user-photos` Supabase Storage bucket. Five views are collected:

| View Key | Label |
|----------|-------|
| `front` | Front view |
| `left_side` | Left side |
| `right_side` | Right side |
| `top` | Top/crown |
| `donor_area` | Donor area |

Accepted formats: JPG, PNG, WebP. Max size: 10 MB per photo.

### Enums

- **DonorAreaQuality**: `poor`, `adequate`, `good`, `excellent`
- **DonorAreaAvailability**: `limited`, `adequate`, `good`
- **DesiredDensity**: `low`, `medium`, `high`, `maximum`

### Persistence Logic

On mount for a signed-in user:
1. Restore form state from `localStorage`
2. Fetch DB record and override localStorage (DB is source of truth for Phase 2)
3. Load existing photos from DB

On final submit → POST to `/api/profile/treatment`, set `im.treatment-profile.complete = "true"`

### Database Tables Written

- `user_treatment_profiles` — main medical fields
- `user_prior_transplants` — list of past transplants (deleted and re-inserted on each save)
- `user_prior_surgeries` — list of past surgeries (deleted and re-inserted on each save)
- `user_photos` — photo metadata (storage URL, view, file size, MIME type)

---

## Dashboard — `UserProfileDashboard.tsx`

The dashboard at `/profile` gives users an overview of their progress.

### Progress

Overall progress is calculated as `completedPhases / 4 * 100`. With 4 phases each worth 25%:

| Phases complete | Overall % |
|----------------|-----------|
| 0 | 0% |
| 1 | 25% |
| 2 | 50% |
| 3 | 75% |
| 4 | 100% |

### Phase States

Each phase card and stepper node can be in one of four states:

| State | Condition | Visual |
|-------|-----------|--------|
| `locked` | Previous phase not complete | Grey, no link |
| `available` | Previous phase complete, not yet started | Blue outline, links to phase route |
| `in-progress` | Started but not complete (future use) | Dark blue, shows progress bar |
| `complete` | 100% done | Teal, check icon |

### Data Loading

On mount, the dashboard fetches `/api/profile/status`. If the request fails (network error or non-OK response), it falls back to reading `im.qualification.complete` and `im.treatment-profile.complete` from `localStorage`.

```
/api/profile/status
  → { qualificationComplete: boolean, treatmentComplete: boolean }
  → maps to: get-started: 0 or 100, treatment-profile: 0 or 100
```

---

## API Routes

All routes are thin wrappers around `lib/api/userProfile.ts`. They handle auth errors (401) and unexpected errors (500) uniformly.

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/profile/qualification` | Returns Phase 1 data, or `null` fields if not yet saved |
| POST | `/api/profile/qualification` | Saves Phase 1 data. Returns `{ success: true, userId }` |
| GET | `/api/profile/treatment` | Returns Phase 2 data including `priorTransplants[]` and `priorSurgeries[]`, or `null` |
| POST | `/api/profile/treatment` | Saves Phase 2 data. Replaces all transplants and surgeries. Returns `{ success: true, userId }` |
| GET | `/api/profile/status` | Returns `{ qualificationComplete: boolean, treatmentComplete: boolean }`. 401 if unauthenticated |
| GET | `/api/profile/photos` | Returns `[{ photo_view, storage_url }]` for the signed-in user |
| DELETE | `/api/profile/photos` | Body: `{ view }`. Deletes the photo for that view. 400 if `view` is missing |

---

## localStorage Keys

| Key | Type | Purpose |
|-----|------|---------|
| `im.qualification` | JSON string | Phase 1 form draft |
| `im.qualification.complete` | `"true"` | Phase 1 completion flag |
| `im.treatment-profile` | JSON string | Phase 2 form draft |
| `im.treatment-profile.complete` | `"true"` | Phase 2 completion flag |

These keys are written after a successful submit and read on mount as a fallback when the user is unauthenticated or the API is unreachable.

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

These are used by the Supabase server client in `lib/supabase/server.ts` to authenticate API requests server-side using the user's session cookie.
