# Consultation Intent + Bookmark Sync Fix — Implementation Plan

## Background

Two bugs found during testing of the guest bookmarking feature:

1. **Bookmark sync not firing after OAuth redirect** — After signing in via Google OAuth, Supabase fires `INITIAL_SESSION` (not `SIGNED_IN`) on the destination page. `syncLocalBookmarks` is only wired to `SIGNED_IN`, so guest bookmarks are never transferred to the DB on the OAuth path.

2. **"Request Free Consultation" sign-in path** — When an unauthenticated user clicks "Request Free Consultation" on a ClinicCard, they're redirected to login. After signing in, they land back on the original page but the consultation was never actually submitted. There's no success feedback.

---

## Fix 1 — Bookmark sync bug

**File**: `contexts/AuthContext.tsx`

In `checkSession` (runs on every page load), add `syncLocalBookmarks()` call when an active session is found. This covers the INITIAL_SESSION case.

```ts
// Inside checkSession, after fetchUserProfile():
syncLocalBookmarks()
```

The function already returns early if `im.bookmarks` is empty, so calling it on every load is safe.

---

## Fix 2 — Consultation intent auto-trigger

### Step 1 — Store intent before redirect

**File**: `components/istanbulmedic-connect/ClinicCard.tsx`

In `handleConsultationClick`, when not authenticated:
- Store `sessionStorage.setItem('consultation_intent', id)` (the clinic ID)
- Change `auth_redirect_next` cookie destination from `window.location.pathname` to `/bookmarks`

```ts
if (!isAuthenticated) {
  sessionStorage.setItem('consultation_intent', id)
  document.cookie = `auth_redirect_next=${encodeURIComponent('/bookmarks')}; path=/; max-age=300`
  router.push("/auth/login")
  return
}
```

### Step 2 — Add `syncConsultationIntent` to AuthContext

**File**: `contexts/AuthContext.tsx`

New async function (similar pattern to `syncLocalBookmarks`):

```ts
const syncConsultationIntent = async (): Promise<boolean> => {
  try {
    const clinicId = sessionStorage.getItem('consultation_intent')
    if (!clinicId) return false
    sessionStorage.removeItem('consultation_intent')  // remove before POST to prevent double-fire
    const res = await fetch('/api/consultations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clinicIds: [clinicId] }),
    }).catch(() => null)
    window.location.href = res?.ok ? '/bookmarks?consulted=1' : '/bookmarks'
    return true
  } catch {
    return false
  }
}
```

Call sites:
- In `checkSession`, after `syncLocalBookmarks()`:
  ```ts
  const consultationRedirected = await syncConsultationIntent()
  if (!consultationRedirected) {
    // existing sessionStorage fallback redirect logic
  }
  ```
- In `onAuthStateChange` SIGNED_IN handler, after `syncLocalBookmarks()`:
  ```ts
  syncConsultationIntent()  // fire-and-forget — sessionStorage removal prevents double-fire
  ```

The `sessionStorage.removeItem` before the POST ensures only the first caller (checkSession OR onAuthStateChange, whichever runs first) actually processes the intent. The second caller finds the key already gone and returns false.

### Step 3 — Success banner on bookmarks page

**File**: `app/bookmarks/page.tsx`

- Add `useSearchParams` import from `next/navigation`
- Add `consultedSuccess` state + `useEffect` to read the `?consulted=1` param and strip it from the URL

```ts
const searchParams = useSearchParams()
const [consultedSuccess, setConsultedSuccess] = useState(false)

useEffect(() => {
  if (searchParams.get('consulted') === '1') {
    setConsultedSuccess(true)
    const url = new URL(window.location.href)
    url.searchParams.delete('consulted')
    window.history.replaceState({}, '', url.toString())
  }
}, [searchParams])
```

- Render banner above the clinic list (similar to the existing `emailWarning` amber banner):

```tsx
{consultedSuccess && (
  <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
    Your consultation request has been submitted. We&apos;ll be in touch soon!
  </div>
)}
```

---

## Execution order after sign-in (post-OAuth redirect)

1. OAuth callback → sets session cookies → redirects to `/bookmarks`
2. `/bookmarks` page loads → `AuthContext.checkSession` fires
3. `syncLocalBookmarks()` → POSTs guest bookmarks to DB, clears `im.bookmarks`
4. `syncConsultationIntent()` → POSTs consultation, clears `consultation_intent`, redirects to `/bookmarks?consulted=1`
5. Page reloads → `checkSession` fires again → both syncs find nothing → no redirect
6. Bookmarks page reads `?consulted=1` → shows green success banner, strips param from URL
7. Bookmarks API fetch → clinic shows "Requested ✓" state
