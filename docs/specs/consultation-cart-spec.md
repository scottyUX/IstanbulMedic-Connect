# Consultation & Bookmarks — Feature Spec

## Overview

Two distinct actions on every clinic: **bookmark** (save for later) and **request a free consultation** (fires immediately). Both require Google sign-in but nothing more — no profile wizard, no cart checkout flow.

Istanbul Medic Connect acts as the concierge layer. Consultation request emails go to the **Connect team**, not directly to clinics. The team coordinates with the relevant clinic(s) on the user's behalf.

---

## Mental Model

| Action | Intent | Where it goes |
|--------|--------|---------------|
| Bookmark | "I'm interested, save this for later" | `user_bookmarks` table, visible on Bookmarks page |
| Request Free Consultation | "I want to talk to this clinic now" | `consultations` table, email to Connect team |

These are independent — you can request without bookmarking, and bookmark without ever requesting. But the Bookmarks page doubles as a hub for bulk-requesting consultations across saved clinics.

---

## User Flows

### Direct Consultation Request (from any clinic surface)
1. User clicks **"Request Free Consultation"** text link on a clinic card or profile sidebar
2. If not signed in → Google sign-in → **redirected back to clinic page** (no wizard)
3. Confirmation modal: "Request a free consultation with [Clinic Name]?" → Confirm
4. Request fires immediately → stored in `consultations` table → email sent to Connect team
5. Success feedback (toast or inline) — no page change needed

### Bookmarking
1. User clicks **bookmark icon** on a clinic card or profile sidebar
2. If not signed in → Google sign-in → redirected back to clinic page
3. Clinic saved to `user_bookmarks` — icon fills to show saved state
4. Clicking again opens remove confirmation modal

### Bookmarks Page (`/bookmarks`)
1. Shows all saved clinics, each with:
   - Clinic card (name, image, location, rating)
   - "Requested" badge if consultation already submitted
   - "Request Consultation" button (disabled + badge if already requested)
   - Remove bookmark button
2. User can select multiple clinics and bulk-request consultations
3. Bulk request fires one email listing all selected clinics, creates one record per clinic

### Profile Consultations Tab
- Shows all submitted consultation requests
- Columns: Clinic, Date Submitted, Status
- Status (MVP): `Pending` only (yellow badge)
- Empty state: prompt to browse clinics or visit bookmarks

---

## Auth & Friction

### The fix (one change)
In `/app/auth/callback/route.ts`, the current logic forces new users to `/profile/get-started` if they haven't accepted terms. This breaks the "return to where you were" flow.

**Change:** Always honour the `next` cookie. Never redirect to the wizard automatically.

```ts
// Before
destination = hasConsented ? '/profile' : '/profile/get-started';

// After
destination = next ?? '/profile';
```

The wizard becomes fully opt-in — accessible from the profile dashboard, never forced.

### Profile data and consultation requests
Google OAuth already captures name + email. That's all we need for the consultation email. The wizard fields (budget, Norwood scale, timeline, etc.) are enrichment — useful but never required to submit a request.

### What requires auth
- Bookmarking a clinic
- Requesting a consultation
- Viewing bookmarks page
- Viewing consultations tab

### What does NOT require auth
- Browsing clinics
- Viewing clinic profiles
- Talking to Leila

---

## UI/UX

### "Request Free Consultation" button
- Style: **text link / hyperlink style** — not a teal pill button
- Label: "Request Free Consultation" (or "Request Consultation")
- Locations: `ClinicCard` (bottom of card) + `SummarySidebar` (replaces current teal button)
- States:
  - Default: text link, teal colour
  - Already requested: greyed out, "Consultation Requested" with a check

### Bookmark icon
- Style: bookmark icon (outline → filled when saved)
- Locations: `ClinicCard` (top-right corner overlay or bottom action row) + `SummarySidebar` (icon action link, replaces disabled "Save Clinic")
- States:
  - Default: outline bookmark icon
  - Saved: filled bookmark icon (teal)
  - Hover when saved: red tint to signal "click to remove"

### Confirmation modals (shared `ConsultationConfirmModal`)
Used for all add/remove actions. Already built — just update copy:
- **Request consultation**: "Request a free consultation with [Clinic Name]? The Istanbul Medic Connect team will be in touch."
- **Remove bookmark**: "Remove [Clinic Name] from your saved clinics?"

### Hover-to-reveal intent
Already implemented for the request button. Apply same pattern to bookmark icon.

---

## Phase 1 — What Was Built (to be refactored)

Phase 1 built a **cart-based** flow that is being replaced by the bookmark + direct request model. The following need to change:

| Built in Phase 1 | New direction |
|------------------|---------------|
| `ConsultationCartContext` (localStorage) | Remove — bookmarks are DB-backed |
| `/consultations/cart` page | Replace with `/bookmarks` page |
| "Consult" pill button on `ClinicCard` | Replace with "Request Free Consultation" text link |
| "Request Consultation" teal button on `SummarySidebar` | Replace with text link style |
| Cart badge in `TopNav` | Replace with bookmark icon/count in nav |
| `ConsultationCartProvider` in `layout.tsx` | Remove |

**Keep from Phase 1:**
- `ConsultationConfirmModal` component (reuse for both bookmark + request modals)
- `GET /api/clinics` route (used by bookmarks page browser)
- `bookConsultation` feature flag (stays `true`)

---

## Frontend — To Build

### 1. Auth callback fix
**File:** `/app/auth/callback/route.ts`
- Remove forced redirect to `/profile/get-started`
- Always use `next` cookie or fall back to `/profile`

### 2. Bookmark button component
**File:** `/components/istanbulmedic-connect/BookmarkButton.tsx`
- Shared component used in `ClinicCard` and `SummarySidebar`
- Handles auth gate, optimistic UI, DB call, confirmation modal on remove
- Props: `clinicId`, `clinicName`

### 3. Update `ClinicCard`
- Remove cart button + `ConsultationCartContext` usage
- Add `BookmarkButton` (icon style)
- Add "Request Free Consultation" text link

### 4. Update `SummarySidebar`
- Remove cart button + context usage
- Add `BookmarkButton` (icon action link style, alongside Visit Website etc.)
- Replace teal button with "Request Free Consultation" text link

### 5. Update `TopNav`
- Remove cart badge/icon
- Add bookmark count indicator (if user is signed in and has bookmarks)

### 6. Bookmarks page
**Route:** `/bookmarks`
- List of saved clinics (fetched from `GET /api/bookmarks`)
- Per-clinic: image, name, location, rating, "Requested" badge, "Request Consultation" button, remove bookmark
- Multi-select + bulk request CTA
- Empty state

### 7. Update `layout.tsx`
- Remove `ConsultationCartProvider`

### 8. Profile Consultations tab
**File:** `/components/istanbulmedic-connect/user-profile/sections/ProfileConsultations.tsx`
- Replace "Coming Soon" stub with real data from `GET /api/consultations`
- For now: mock data (swap in Phase 2)

---

## Backend — To Build

### 1. Database migrations

**File:** `/supabase/migrations/20260506000000_create_bookmarks_and_consultations.sql`

```sql
-- Bookmarks
CREATE TABLE user_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, clinic_id)
);

-- Consultations
CREATE TYPE consultation_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  status consultation_status NOT NULL DEFAULT 'pending',
  user_email TEXT NOT NULL,
  user_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX consultations_pending_unique
  ON consultations(user_id, clinic_id)
  WHERE status = 'pending';

CREATE TRIGGER update_consultations_updated_at
  BEFORE UPDATE ON consultations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Bookmarks API
**File:** `/app/api/bookmarks/route.ts`

- `GET /api/bookmarks` — returns all bookmarks for logged-in user, joined with clinic name/location/image/rating
- `POST /api/bookmarks` — `{ clinicId }` → insert, return bookmark
- `DELETE /api/bookmarks` — `{ clinicId }` → delete

### 3. Consultations API
**File:** `/app/api/consultations/route.ts`

- `POST /api/consultations` — `{ clinicIds: string[] }` → insert records, fire email, return `{ created, skipped }`
- `GET /api/consultations` — returns all consultation records for logged-in user

### 4. Email (Resend)
**File:** `/lib/email/sendConsultationRequest.ts`

- Install: `npm install resend`
- Env vars: `RESEND_API_KEY`, `CONSULTATION_EMAIL` (team inbox)

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

## File Plan

| Action | File | Notes |
|--------|------|-------|
| MODIFY | `/app/auth/callback/route.ts` | Remove forced wizard redirect |
| CREATE | `/components/istanbulmedic-connect/BookmarkButton.tsx` | Shared bookmark component |
| MODIFY | `/components/istanbulmedic-connect/ClinicCard.tsx` | Replace cart button with bookmark + text link |
| MODIFY | `/components/istanbulmedic-connect/profile/SummarySidebar.tsx` | Replace cart button with bookmark + text link |
| MODIFY | `/components/istanbulmedic-connect/TopNav.tsx` | Replace cart badge with bookmark indicator |
| MODIFY | `/app/layout.tsx` | Remove `ConsultationCartProvider` |
| DELETE | `/contexts/ConsultationCartContext.tsx` | Replaced by DB-backed bookmarks |
| REPLACE | `/app/consultations/cart/page.tsx` → `/app/bookmarks/page.tsx` | New bookmarks page |
| CREATE | `/app/api/bookmarks/route.ts` | Bookmarks CRUD |
| CREATE | `/app/api/consultations/route.ts` | Consultation submit + list |
| CREATE | `/lib/email/sendConsultationRequest.ts` | Resend email stub |
| CREATE | `/supabase/migrations/20260506000000_create_bookmarks_and_consultations.sql` | DB schema |
| MODIFY | `/components/istanbulmedic-connect/user-profile/sections/ProfileConsultations.tsx` | Replace stub |
| KEEP | `/components/istanbulmedic-connect/ConsultationConfirmModal.tsx` | Reused for both flows |
| KEEP | `/app/api/clinics/route.ts` | Used by bookmarks page |

---

## Phase Summary

| Phase | Status |
|-------|--------|
| Phase 1 frontend (cart model) | Built — being refactored |
| Auth callback fix | Not started |
| Bookmark button + DB | Not started |
| Bookmarks page | Not started |
| Consultation text link + direct request | Not started |
| Profile Consultations tab (mock) | Not started |
| Backend: DB migration, API routes, email | Not started |
