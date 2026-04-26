# User Profile — Treatment Passport

The User Profile feature lets patients build a detailed Treatment Passport — the information a hair transplant clinic needs to assess their case. It has two parts: a guided onboarding wizard and a persistent dashboard where the profile is maintained over time.

---

## User flow

```
Sign in (Google OAuth)
    ↓
/api/auth/callback  — bootstrap users + user_profiles rows
    ↓
First visit     → /profile/get-started  (GetStarted wizard, 6 steps)
Returning visit → /profile              (ProfileDashboard)
```

---

## Feature overview

| Area | What it does |
|------|-------------|
| **GetStarted wizard** | 6-step form collecting the minimum data to match clinics. Saves to `localStorage` per step; submits to the database on the final "Create my account" step. Steps whose data is already saved are skipped on re-entry. |
| **ProfileDashboard** | Persistent sidebar-nav shell at `/profile`. Houses five section components. Autosaves on every field change via a debounced POST. |
| **ProfileHome** | Welcome banner, 5-view hair photo upload (Supabase Storage), and quick-nav cards to other sections. |
| **ProfilePersonalInfo** | Name, gender, birthday, phone, country, language, budget range, treatment timeline. |
| **ProfileMedicalHistory** | Prior hair transplants, prior surgeries, allergies, medications, and other conditions. |
| **ProfileHairLossStatus** | Norwood scale (1–7) and hair loss duration. |
| **ProfileConsultations** | Coming soon placeholder — clinic shortlisting and booking. |

---

## Running locally

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Apply database migrations

```bash
npx supabase db push
```

Or with a local Supabase instance:

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
| `http://localhost:3000/auth/login` | Sign in with Google |
| `http://localhost:3000/profile/get-started` | Onboarding wizard |
| `http://localhost:3000/profile` | Full profile dashboard |

---

## Verifying data in the database

After completing the wizard, check these tables in your Supabase dashboard.

### After the GetStarted wizard

**`users`**

| Column | What to check |
|--------|--------------|
| `auth_id` | Matches the Supabase Auth user ID |
| `name` | Full name entered in the contact step |
| `email` | Email from Google OAuth |

**`user_profiles`**

| Column | What to check |
|--------|--------------|
| `user_id` | FK → `users.id` |
| `given_name` / `family_name` | From Google OAuth |
| `preferred_language` | Written here and also to `user_qualification` |

**`user_qualification`**

| Column | What to check |
|--------|--------------|
| `user_id` | FK → `users.id` |
| `age_tier` | Selected in step 1 |
| `gender` | Selected in step 2 |
| `norwood_scale` | Selected in step 3 (also written to `user_treatment_profiles`) |
| `country` | Entered in step 4 |
| `budget_tier` | Selected in step 5 |
| `timeline` | Selected in step 6 |
| `full_name` | Entered in contact step |
| `whats_app` | Phone number entered in contact step |
| `terms_accepted` | Should be `true` |

### After using the dashboard sections

**`user_treatment_profiles`**

| Column | What to check |
|--------|--------------|
| `norwood_scale` | Set in Hair loss status section |
| `hair_loss_duration_years` | Set in Hair loss status section |
| `allergies` | Array from Medical history |
| `medications` | Array from Medical history |
| `other_conditions` | Array from Medical history |

**`user_prior_transplants`** — one row per past transplant

| Column | What to check |
|--------|--------------|
| `user_id` | FK → `users.id` |
| `year` | Year of transplant |
| `estimated_grafts` | Graft count |
| `clinic_country` | Country name |

**`user_prior_surgeries`** — one row per past surgery

| Column | What to check |
|--------|--------------|
| `user_id` | FK → `users.id` |
| `surgery_type` | Type of surgery |
| `year` | Year |
| `notes` | Optional notes |

**`user_photos`** — one row per uploaded photo view

| Column | What to check |
|--------|--------------|
| `user_id` | FK → `users.id` |
| `photo_view` | `front`, `left_side`, `right_side`, `top`, or `donor_area` |
| `storage_url` | Public URL in the `user-photos` bucket |
| `file_size_bytes` | Should match uploaded file |
| `mime_type` | `image/jpeg`, `image/png`, or `image/webp` |

### Quick SQL checks

```sql
-- Replace with the user's auth UUID (Auth → Users in Supabase dashboard)
SELECT * FROM users WHERE auth_id = 'your-auth-uuid';

-- Once you have users.id:
SELECT * FROM user_qualification      WHERE user_id = 'users-id';
SELECT * FROM user_treatment_profiles WHERE user_id = 'users-id';
SELECT * FROM user_prior_transplants  WHERE user_id = 'users-id';
SELECT * FROM user_prior_surgeries    WHERE user_id = 'users-id';
SELECT * FROM user_photos             WHERE user_id = 'users-id';
```
