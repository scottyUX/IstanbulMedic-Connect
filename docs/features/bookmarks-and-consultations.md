# Bookmarks & Consultations — Implementation Notes

**Branch:** `feature/consultations`  
**Status:** Complete for current scope. See [Out of scope](#out-of-scope) for what's intentionally deferred.

---

## Overview

Two independent actions on every clinic:

| Action | Who can do it | Storage |
|---|---|---|
| Bookmark | Anyone (guest or signed-in) | LS → `user_bookmarks` on sign-in |
| Request Consultation | Signed-in users only | `consultations` table + email to clinic |

Emails go to the Istanbul Medic Connect team (concierge model) — not directly to clinics.

---

## Bookmarking

### Guest flow
- Clicking bookmark saves the clinic ID to `im.bookmarks` in localStorage
- A "Sign in to save permanently" tooltip appears for 3 seconds
- `/bookmarks` page is accessible without sign-in — reads IDs from LS, calls `POST /api/bookmarks/guest` (no auth required), and renders the full clinic list with name/image/rating
- Consultation buttons on the bookmarks page show "Sign in to request" — clicking stores the clinic ID(s) as a consultation intent and redirects to login (see [Consultation intent flow](#consultation-intent-flow))

### Sign-in sync
On every page load with an active session, `syncLocalBookmarks()` in `AuthContext` fires via `checkSession`:
1. Reads `im.bookmarks` from LS
2. POSTs each clinic ID to `POST /api/bookmarks` in parallel
3. Clears the LS key once all requests complete
4. Duplicate constraint (unique violation) silently ignores already-saved clinics
5. Returns a count of **newly created** bookmarks only (duplicates don't count)
6. If count > 0, sets `bookmarkSyncCount` in context → ProfileDashboard shows a teal banner: "X clinic(s) have been added to your saved clinics. [View saved clinics →]"

Also fires on `SIGNED_IN` auth state change (covers non-OAuth sign-in paths).

### Login page notice
If the user arrives at `/auth/login` with local bookmarks, a teal notice is shown:
> "You have X saved clinic(s) — sign in to keep them linked to your account."

### Signed-in flow
- Bookmark click → `POST /api/bookmarks` (optimistic, reverts on error)
- Un-bookmark → `ConsultationConfirmModal` (isRemoving=true) → `DELETE /api/bookmarks`

---

## Consultation request flow

### Entry points
Consultation requests can be triggered from three places:

| Location | Component |
|---|---|
| Clinic card on `/clinics` dashboard | `ClinicCard.tsx` |
| Clinic detail page sidebar | `SummarySidebar.tsx` |
| `/bookmarks` page (individual or bulk) | `app/bookmarks/page.tsx` |

All three share the same post-auth intent flow described below.

### Authenticated flow
1. User selects one or more clinics and clicks request
2. Confirmation modal opens (`ConsultationConfirmModal`)
3. On confirm → `POST /api/consultations` with `{ clinicIds: string[] }`
4. API runs:
   - Deduplicates the input IDs
   - Pre-filters out clinics that already have a `pending` consultation for this user
   - Fetches the user's full "passport" (profile, hair loss info, medical history, photos)
   - Inserts one `consultations` row per new clinic
   - Sends a detailed passport email to the clinic team + a confirmation email to the user
   - Returns `{ created, skipped, createdNames, skippedNames, emailSent }`
5. UI switches to "Consultation Requested ✓" state

### Consultation intent flow (unauthenticated)
When an unauthenticated user clicks "Request Free Consultation":

1. Clinic ID(s) saved to `sessionStorage('consultation_intent')` as a JSON array
2. Auth redirect cookie set: `auth_redirect_next=/profile?section=consultations`
3. User redirected to `/auth/login?next=/profile?section=consultations`
4. After sign-in, OAuth callback reads cookie → redirects to `/profile?section=consultations`
5. `ProfileDashboard` initialises directly on the Consultations tab (no flash)
6. `checkSession` fires → `syncLocalBookmarks()` → `syncConsultationIntent()`:
   - Reads and removes `consultation_intent` from sessionStorage (prevents double-fire if both `checkSession` and `SIGNED_IN` handler run)
   - POSTs all clinic IDs to `/api/consultations`
   - Sets `consultationResult` in AuthContext with `{ createdNames, skippedNames }`
   - Calls `router.push('/profile?section=consultations')`
7. `ProfileDashboard` reads `consultationResult` from context, shows name-drop banner, clears context

### Post-auth banners (ProfileDashboard)

| Scenario | Banner |
|---|---|
| New consultation(s) submitted | Green: "Consultation(s) submitted for **Clinic A** and **Clinic B**. We'll be in touch soon!" |
| Mixed (some new, some duplicate) | Green banner with subline: "**Clinic C** was already requested." |
| All already requested | Blue: "You've already requested a consultation for **Clinic A**." |
| Bookmarks synced on sign-in | Teal: "X clinic(s) have been added to your saved clinics. [View saved clinics →]" |

Both the consultation banner and bookmark sync banner can appear simultaneously (independent state). The bookmark banner appears above the consultation banner.

### Double-fire prevention
`sessionStorage.removeItem('consultation_intent')` is called **before** the POST. Both `checkSession` and the `SIGNED_IN` handler call `syncConsultationIntent()` — whichever fires first removes the key; the second finds nothing and returns false.

### Email
Requires `RESEND_API_KEY` and `CONSULTATION_EMAIL` in `.env.local`.

The passport email includes: patient name/email/WhatsApp/age/gender/country/budget/timeline, Norwood scale, donor area quality, prior transplant history, medications/allergies, and any uploaded photos.

---

## Bookmarks page (`/bookmarks`)

- Accessible to guests (reads from localStorage) and signed-in users (reads from DB)
- Clinics are sorted: **unrequested first**, already-requested at the bottom (sorted client-side via `useMemo`)
- Bulk select — "Select all / Deselect all" toggle, "Request Consultation (N)" button
- Unauthenticated consultation requests (single or bulk) store intent in sessionStorage and redirect through login (see [Consultation intent flow](#consultation-intent-flow))

---

## Navigation

The "Consultations" button in the top nav links directly to `/profile?section=consultations`, opening the profile dashboard with the Consultations tab active on load.

`ProfileDashboard` reads `?section=<id>` from the URL on first render and initialises `active` state from it synchronously (no flash to the Home tab).

---

## Database schema

### `user_bookmarks`
```sql
id UUID PK
user_id UUID → users(id)
clinic_id UUID → clinics(id)
created_at TIMESTAMPTZ
UNIQUE(user_id, clinic_id)
```

### `consultations`
```sql
id UUID PK
user_id UUID → users(id)
clinic_id UUID → clinics(id)
status consultation_status DEFAULT 'pending'   -- enum: pending|in_progress|completed|cancelled
user_email TEXT NOT NULL
user_name TEXT
created_at / updated_at TIMESTAMPTZ
UNIQUE (user_id, clinic_id) WHERE status = 'pending'  -- partial index: allows re-request after completion
```

MVP only sets `pending`. Status transitions are out of scope.

---

## Schema gotcha

The `clinics` table has no `name`, `location`, `image`, or `rating` columns directly:

| Needed | Actual source |
|---|---|
| `name` | `clinics.display_name` |
| `location` | `${primary_city}, ${primary_country}` |
| `image` | `clinic_media` where `is_primary=true`, `media_type='image'` |
| `rating` | `clinic_google_places.rating` |
| `reviewCount` | `clinic_google_places.user_ratings_total` |

---

## Key files

| File | Purpose |
|---|---|
| `app/api/bookmarks/route.ts` | GET / POST / DELETE — authenticated bookmark operations |
| `app/api/bookmarks/guest/route.ts` | POST — fetch clinic details by IDs, no auth required |
| `app/api/consultations/route.ts` | POST (submit) / GET (list user's consultations) — returns `createdNames`/`skippedNames` |
| `app/api/consultations/pending-ids/route.ts` | GET — returns clinic IDs with pending consultations (used by ClinicCard/SummarySidebar state) |
| `app/bookmarks/page.tsx` | Saved clinics page — works for guests and signed-in users; sorted unrequested-first |
| `app/auth/login/LoginPageClient.tsx` | Shows saved clinic count notice when local bookmarks exist |
| `app/auth/callback/route.ts` | OAuth callback — reads `auth_redirect_next` cookie (supports query params e.g. `?section=consultations`) |
| `components/istanbulmedic-connect/ClinicCard.tsx` | "Request Free Consultation" — stores intent, redirects to login |
| `components/istanbulmedic-connect/profile/SummarySidebar.tsx` | Same intent flow from clinic detail page |
| `components/istanbulmedic-connect/BookmarkButton.tsx` | Shared bookmark icon, handles guest + auth flows |
| `components/istanbulmedic-connect/user-profile/ProfileDashboard.tsx` | Reads `?section` on init, shows consultation result + bookmark sync banners |
| `components/istanbulmedic-connect/TopNav.tsx` | "Consultations" nav button → `/profile?section=consultations` |
| `contexts/AuthContext.tsx` | `syncLocalBookmarks()`, `syncConsultationIntent()`, `consultationResult`, `bookmarkSyncCount` |
| `contexts/BookmarkCountContext.tsx` | Tracks bookmarked IDs in memory; reads/writes LS for guests |
| `lib/email/sendConsultationRequest.ts` | Builds and sends passport email via Resend |
| `supabase/migrations/20260506000000_create_bookmarks_and_consultations.sql` | DB schema |
| `tests/api/consultations.test.ts` | Unit tests covering the consultation API |

---

## Out of scope

The following are intentionally not implemented:

- **Status transitions** — `pending → in_progress → completed` workflow
- **Clinic dashboard** — no in-app interface for clinics to manage incoming requests
- **Payment** — consultations are free; no deposit or quote flow
- **Follow-up threading** — no notes, conversation history, or reply tracking
- **Cal.com integration with requests** — `ConsultationScheduler` (used in Leila) and the consultation request system are separate flows and are not connected

---

## Local setup

```bash
supabase db reset
supabase gen types typescript --local > lib/supabase/database.types.ts
npx tsx scripts/seedLocalDb.ts
```
