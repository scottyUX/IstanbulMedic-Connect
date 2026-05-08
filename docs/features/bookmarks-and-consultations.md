# Bookmarks & Consultations — Implementation Notes

**Branch:** `feature/consultations`  
**Spec:** `/docs/specs/consultation-cart-spec.md`  
**Status:** Built, untested. DB migration not yet applied locally.

---

## Overview

Two independent actions on every clinic:

| Action | UI | Storage |
|---|---|---|
| Bookmark | Bookmark icon (outline → filled) | `user_bookmarks` table |
| Request Consultation | "Request Free Consultation" text link | `consultations` table + email to team |

Both require Google sign-in. No profile wizard required. Emails go to the Istanbul Medic Connect team (concierge model) — not directly to clinics.

---

## Before you can test locally

```bash
# 1. Apply migration + reset local DB
supabase db reset

# 2. Regenerate TypeScript types (fixes TS errors in API routes)
supabase gen types typescript --local > lib/supabase/database.types.ts

# 3. Re-seed from production
npx tsx scripts/seedLocalDb.ts
```

---

## Files changed

### Deleted (Phase 1 cleanup)
- `contexts/ConsultationCartContext.tsx`
- `app/consultations/cart/page.tsx`

### New
| File | Purpose |
|---|---|
| `supabase/migrations/20260506000000_create_bookmarks_and_consultations.sql` | DB schema |
| `components/istanbulmedic-connect/BookmarkButton.tsx` | Shared bookmark icon component |
| `app/bookmarks/page.tsx` | Saved clinics page with bulk request |
| `app/api/bookmarks/route.ts` | GET / POST / DELETE bookmarks |
| `app/api/consultations/route.ts` | POST (submit) / GET (list) consultations |
| `lib/email/sendConsultationRequest.ts` | Resend email stub |

### Modified
| File | What changed |
|---|---|
| `app/auth/callback/route.ts` | Removed forced wizard redirect — always honours `next` cookie |
| `app/layout.tsx` | Removed `ConsultationCartProvider` |
| `components/istanbulmedic-connect/ConsultationConfirmModal.tsx` | Updated copy for new flows |
| `components/istanbulmedic-connect/ClinicCard.tsx` | Cart button → bookmark icon + consultation text link |
| `components/istanbulmedic-connect/profile/SummarySidebar.tsx` | Cart button → bookmark + consultation text link |
| `components/istanbulmedic-connect/TopNav.tsx` | Cart badge → bookmark icon link (auth-gated) |
| `components/istanbulmedic-connect/user-profile/sections/ProfileConsultations.tsx` | "Coming Soon" → real data table |
| `scripts/seedLocalDb.ts` | Added wipe step before upsert |

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
status consultation_status DEFAULT 'pending'
user_email TEXT NOT NULL   -- snapshotted at request time
user_name TEXT
created_at / updated_at TIMESTAMPTZ
```

**Partial unique index:** `(user_id, clinic_id) WHERE status = 'pending'` — prevents duplicate active requests but allows re-requesting after completion/cancellation.

### `consultation_status` enum
`pending` → `in_progress` → `completed` / `cancelled`

MVP only uses `pending`.

---

## Schema gotcha

The `clinics` table does NOT have `name`, `location`, `image`, `rating`, or `review_count` columns directly. The API routes account for this:

| Needed | Actual source |
|---|---|
| `name` | `clinics.display_name` |
| `location` | `${primary_city}, ${primary_country}` |
| `image` | `clinic_media` join (where `is_primary=true`, `media_type='image'`) |
| `rating` | `clinic_google_places.rating` |
| `reviewCount` | `clinic_google_places.user_ratings_total` |

---

## UI behaviour

### BookmarkButton
- Unauthenticated click → sets `auth_redirect_next` cookie → redirects to `/auth/login`
- Authenticated, not bookmarked → POST `/api/bookmarks` optimistically (reverts on error)
- Authenticated, already bookmarked → opens `ConsultationConfirmModal` (isRemoving=true) → DELETE `/api/bookmarks`
- Used in: `ClinicCard` (top-right image overlay), `SummarySidebar` (icon link row), `BookmarksPage` (inline)

### Consultation request
- Unauthenticated → same auth redirect flow
- Authenticated → opens `ConsultationConfirmModal` (isRemoving=false)
- On confirm → POST `/api/consultations` → shows "Consultation Requested ✓" state
- Bulk request on bookmarks page → single POST with `clinicIds: string[]` → one DB row per clinic, one email listing all

### Auth callback
Before: new users without `terms_accepted` were force-redirected to `/profile/get-started`.  
After: always redirects to `next` cookie value, falls back to `/profile`. Wizard is opt-in.

---

## Email (Resend)

Currently a stub — logs to console only. To activate:

```bash
npm install resend
```

`.env.local`:
```
RESEND_API_KEY=re_...
CONSULTATION_EMAIL=consultations@istanbulmedic.com
```

Uncomment the send block in `lib/email/sendConsultationRequest.ts`.

Email format:
```
Subject: [Istanbul Medic Connect] New Consultation Request — {User Name}

User: {name}
Email: {email}

Clinics requested:
- Clinic A
- Clinic B

---
Please follow up with the user and the relevant clinic(s).
```

---

## Testing checklist

- [ ] `supabase db reset` + regen types + `seedLocalDb.ts` runs clean
- [ ] TS errors gone in `app/api/bookmarks/route.ts` and `app/api/consultations/route.ts`
- [ ] ClinicCard: bookmark icon renders top-right on image, fills on click
- [ ] ClinicCard: "Request Free Consultation" link → modal → "Consultation Requested ✓"
- [ ] SummarySidebar: same flows, visually consistent with other icon links
- [ ] TopNav: bookmark icon visible only when authenticated, hidden when signed out
- [ ] Unauthenticated bookmark click → sign in → back to clinic page (check `next` cookie)
- [ ] Bookmarks page: empty state
- [ ] Bookmarks page: populated list with clinic name, location, rating
- [ ] Bookmarks page: per-clinic request button → "Requested" badge
- [ ] Bookmarks page: multi-select → bulk request → all show "Requested"
- [ ] Bookmarks page: remove bookmark via filled icon → confirmation modal
- [ ] ProfileConsultations tab: shows submitted requests with clinic + date + "Pending" badge
- [ ] ProfileConsultations tab: empty state links to /clinics and /bookmarks
- [ ] Console log confirms email stub fires on consultation request
