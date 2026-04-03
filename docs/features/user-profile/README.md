# User Profile — Digital Treatment Passport

The User Profile feature is the core onboarding flow for patients. It collects everything a hair transplant clinic needs to assess a patient — from basic preferences to a full medical history — and stores it as a **Digital Treatment Passport** that can later be shared with vetted clinics.

The profile is split into **4 sequential phases**. Each phase unlocks after the previous one is complete.

| Phase | Label | Route | Status |
|-------|-------|-------|--------|
| 1 | Get Started | `/profile/get-started` | Implemented |
| 2 | Treatment Profile | `/profile/treatment-profile` | Implemented |
| 3 | AI Insights | `/profile/ai-insights` | Planned |
| 4 | Share & Connect | `/profile/share-connect` | Planned |

For how the feature is built, see [architecture.md](./architecture.md).

---

## Running the Feature Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Fill in your Supabase credentials:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

You can find these in your Supabase project under **Settings → API**.

### 3. Apply database migrations

```bash
npx supabase db push
```

Or if running Supabase locally:

```bash
npx supabase start
npx supabase db reset
```

### 4. Start the dev server

```bash
npm run dev
```

### 5. Open the profile flow

| URL | What you'll see |
|-----|----------------|
| `http://localhost:3000/auth/login` | Sign in |
| `http://localhost:3000/profile` | Dashboard — shows phase progress |
| `http://localhost:3000/profile/get-started` | Phase 1 form |
| `http://localhost:3000/profile/treatment-profile` | Phase 2 form (unlocks after Phase 1) |

> **Phase 1** can be completed without being signed in — answers are saved to `localStorage` and synced to the database when you sign in or create an account at the end of the form.
>
> **Phase 2 requires being signed in.** Data saves directly to the database and photo uploads go to Supabase Storage, both of which need an active session.

---

## Verifying Data in the Database

After completing a phase, check these tables in your Supabase dashboard (**Table Editor** or **SQL Editor**).

### After completing Phase 1 (Get Started)

**`users`** — one row per signed-in user

| Column | What to check |
|--------|--------------|
| `auth_id` | Matches the Supabase Auth user ID |
| `name` | Full name entered in step 7 |
| `email` | Email entered in step 7 |

**`user_profiles`** — one row per user

| Column | What to check |
|--------|--------------|
| `user_id` | Foreign key → `users.id` |
| `first_name` / `last_name` | Split from the full name |
| `gender` | Selected in step 2 |
| `preferred_language` | Selected in step 7 |

**`user_qualification`** — one row per user

| Column | What to check |
|--------|--------------|
| `user_id` | Foreign key → `users.id` |
| `age_tier` | Selected in step 1 |
| `gender` | Selected in step 2 |
| `hair_loss_pattern` | Selected in step 3 |
| `country` | Selected in step 4 |
| `budget_tier` | Selected in step 5 |
| `timeline` | Selected in step 6 |
| `whatsapp_number` | Entered in step 7 |
| `terms_accepted` | Should be `true` after review step |

### After completing Phase 2 (Treatment Profile)

**`user_treatment_profiles`** — one row per user

| Column | What to check |
|--------|--------------|
| `user_id` | Foreign key → `users.id` |
| `norwood_scale` | Number 1–7 from step 1 |
| `hair_loss_duration_years` | Number from step 2 |
| `donor_area_quality` | `poor` / `adequate` / `good` / `excellent` |
| `donor_area_availability` | `limited` / `adequate` / `good` |
| `desired_density` | `low` / `medium` / `high` / `maximum` |
| `allergies` | Array of strings |
| `medications` | Array of strings |
| `other_conditions` | Array of strings |

**`user_prior_transplants`** — one row per past transplant (0 or more)

| Column | What to check |
|--------|--------------|
| `user_id` | Foreign key → `users.id` |
| `year` | Year of transplant |
| `estimated_grafts` | Graft count |
| `clinic_country` | Country name |

**`user_prior_surgeries`** — one row per past surgery (0 or more)

| Column | What to check |
|--------|--------------|
| `user_id` | Foreign key → `users.id` |
| `surgery_type` | Type of surgery |
| `year` | Year of surgery |
| `notes` | Optional notes |

**`user_photos`** — one row per uploaded photo view

| Column | What to check |
|--------|--------------|
| `user_id` | Foreign key → `users.id` |
| `photo_view` | `front`, `left_side`, `right_side`, `top`, or `donor_area` |
| `storage_url` | Public URL in the `user-photos` Supabase Storage bucket |
| `file_size_bytes` | Should match the uploaded file |
| `mime_type` | `image/jpeg`, `image/png`, or `image/webp` |

You can also verify photos appear in **Storage → user-photos** in the Supabase dashboard, organised by `userId/view.ext`.

### Quick SQL checks

Run these in the **Supabase SQL Editor** to verify a specific user's data:

```sql
-- Replace with the user's auth UUID from Auth → Users
SELECT * FROM users WHERE auth_id = 'your-auth-uuid';

-- Once you have the users.id:
SELECT * FROM user_qualification      WHERE user_id = 'users-id';
SELECT * FROM user_treatment_profiles WHERE user_id = 'users-id';
SELECT * FROM user_prior_transplants  WHERE user_id = 'users-id';
SELECT * FROM user_prior_surgeries    WHERE user_id = 'users-id';
SELECT * FROM user_photos             WHERE user_id = 'users-id';
```
