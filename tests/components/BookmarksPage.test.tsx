/**
 * Tests for app/bookmarks/page.tsx
 *
 * Covers:
 *   - Empty state: "no saved clinics" message and browse link
 *   - Populated list: clinic rows render correctly
 *   - Single consultation request: happy path → marks clinic as requested
 *   - emailSent:false → amber warning banner appears
 *   - API failure → UI stays unchanged (clinic remains requestable)
 *   - Bulk select + request: selection state, button label, confirm flow
 *   - Remove bookmark: clinic removed from the list
 *   - Guest (unauthenticated): reads from localStorage, calls guest endpoint
 *   - Guest: shows "Sign in to request" instead of "Request Consultation"
 *   - Guest: empty localStorage shows empty state without calling the API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('next/font/google', () => ({
  Merriweather: () => ({ className: 'mocked-merriweather' }),
}))

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/bookmarks',
}))

// useAuth controls whether the page considers the user signed in.
// isAuthenticated=true prevents the redirect effect from firing.
let isAuthenticated = true
let authLoading = false
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated, loading: authLoading }),
}))

// BookmarkCountContext — the page only uses removeId from this context
const mockRemoveId = vi.fn()
vi.mock('@/contexts/BookmarkCountContext', () => ({
  useBookmarkCount: () => ({ removeId: mockRemoveId }),
}))

import BookmarksPage from '@/app/bookmarks/page'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeClinic(overrides: Partial<{
  bookmarkId: string
  clinicId: string
  name: string
  location: string
  image: string | null
  rating: number | null
  reviewCount: number
  consultationRequested: boolean
}> = {}) {
  return {
    bookmarkId: 'bm-1',
    clinicId: 'clinic-1',
    name: 'Clinic One',
    location: 'Istanbul, Turkey',
    image: null,
    rating: 4.5,
    reviewCount: 120,
    consultationRequested: false,
    ...overrides,
  }
}

// Stub global.fetch to return a bookmarks list
function mockBookmarksFetch(clinics: ReturnType<typeof makeClinic>[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(global.fetch as any).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ bookmarks: clinics }),
  })
}

// ─────────────────────────────────────────────────────────────────────────────

describe('BookmarksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isAuthenticated = true
    authLoading = false
    global.fetch = vi.fn()
    localStorage.clear()
  })

  // ── Empty state ─────────────────────────────────────────────────────────────
  //
  // When /api/bookmarks returns an empty list, the page should show the
  // placeholder UI with a "Browse clinics" link — not a broken or blank page.

  it('shows the empty state when there are no bookmarks', async () => {
    mockBookmarksFetch([])
    render(<BookmarksPage />)

    await waitFor(() => {
      expect(screen.getByText(/no saved clinics yet/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('link', { name: /browse clinics/i })).toBeInTheDocument()
  })

  // ── Populated list ──────────────────────────────────────────────────────────

  it('renders a row for each bookmarked clinic', async () => {
    mockBookmarksFetch([
      makeClinic({ clinicId: 'clinic-1', name: 'Clinic One' }),
      makeClinic({ clinicId: 'clinic-2', name: 'Clinic Two', bookmarkId: 'bm-2' }),
    ])
    render(<BookmarksPage />)

    await waitFor(() => {
      expect(screen.getByText('Clinic One')).toBeInTheDocument()
      expect(screen.getByText('Clinic Two')).toBeInTheDocument()
    })
  })

  it('shows "Requested" for clinics that already have a consultation', async () => {
    mockBookmarksFetch([
      makeClinic({ consultationRequested: true }),
    ])
    render(<BookmarksPage />)

    await waitFor(() => {
      expect(screen.getByText(/requested/i)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /request consultation/i })).not.toBeInTheDocument()
    })
  })

  // ── Single consultation request ─────────────────────────────────────────────
  //
  // Clicking "Request Consultation" on a single clinic opens the confirm modal.
  // On confirm, POST /api/consultations is called and the row flips to "Requested".

  it('marks a clinic as requested after confirming the consultation modal', async () => {
    mockBookmarksFetch([makeClinic()])
    // The page fetches bookmarks on mount (first call), then the consultation POST
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ bookmarks: [makeClinic()] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ created: 1, emailSent: true }) })

    render(<BookmarksPage />)

    // Wait for the list to load, then open modal
    await waitFor(() => screen.getByText('Clinic One'))
    fireEvent.click(screen.getByRole('button', { name: /request consultation/i }))

    // Confirm in the modal
    fireEvent.click(screen.getByRole('button', { name: /^request consultation$/i }))

    await waitFor(() => {
      expect(screen.getByText(/requested/i)).toBeInTheDocument()
    })
  })

  // ── emailSent:false → amber warning banner ──────────────────────────────────
  //
  // If the API responds with emailSent:false (email sender threw), the UI shows
  // an amber banner telling the user the team will follow up within 24 hours.
  // This banner is the only user-visible feedback for the email failure path.

  it('shows the amber warning banner when emailSent is false', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ bookmarks: [makeClinic()] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ created: 1, emailSent: false }) })

    render(<BookmarksPage />)

    await waitFor(() => screen.getByText('Clinic One'))
    fireEvent.click(screen.getByRole('button', { name: /request consultation/i }))
    fireEvent.click(screen.getByRole('button', { name: /^request consultation$/i }))

    await waitFor(() => {
      expect(screen.getByText(/our team will be in touch within 24 hours/i)).toBeInTheDocument()
    })
  })

  // ── API failure → UI unchanged ──────────────────────────────────────────────
  //
  // If the consultation POST fails (non-ok response), the clinic should remain
  // in the "requestable" state — no error message, just stays as-is so the user
  // can retry.

  it('leaves the clinic requestable when the API call fails', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ bookmarks: [makeClinic()] }) })
      .mockResolvedValueOnce({ ok: false })

    render(<BookmarksPage />)

    await waitFor(() => screen.getByText('Clinic One'))
    fireEvent.click(screen.getByRole('button', { name: /request consultation/i }))
    fireEvent.click(screen.getByRole('button', { name: /^request consultation$/i }))

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2))

    // Button should still be present — clinic is still requestable
    expect(screen.getByRole('button', { name: /request consultation/i })).toBeInTheDocument()
    expect(screen.queryByText(/requested/i)).not.toBeInTheDocument()
  })

  // ── Bulk select + request ───────────────────────────────────────────────────
  //
  // Selecting clinics via checkbox shows the "Request Consultation (N)" bulk
  // button. Confirming the bulk modal POSTs all selected clinic IDs at once.

  it('shows the bulk request button with count when clinics are selected', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        bookmarks: [
          makeClinic({ clinicId: 'clinic-1', name: 'Clinic One' }),
          makeClinic({ clinicId: 'clinic-2', name: 'Clinic Two', bookmarkId: 'bm-2' }),
        ],
      }),
    })

    render(<BookmarksPage />)

    await waitFor(() => screen.getByText('Clinic One'))

    // Select the first clinic
    fireEvent.click(screen.getByRole('checkbox', { name: /select clinic one/i }))

    expect(screen.getByRole('button', { name: /request consultation \(1\)/i })).toBeInTheDocument()
  })

  it('marks all selected clinics as requested after bulk confirm', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          bookmarks: [
            makeClinic({ clinicId: 'clinic-1', name: 'Clinic One' }),
            makeClinic({ clinicId: 'clinic-2', name: 'Clinic Two', bookmarkId: 'bm-2' }),
          ],
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ created: 2, emailSent: true }) })

    render(<BookmarksPage />)

    await waitFor(() => screen.getByText('Clinic One'))

    // Select both clinics
    fireEvent.click(screen.getByRole('checkbox', { name: /select clinic one/i }))
    fireEvent.click(screen.getByRole('checkbox', { name: /select clinic two/i }))

    // Open bulk modal and confirm
    fireEvent.click(screen.getByRole('button', { name: /request consultation \(2\)/i }))
    fireEvent.click(screen.getByRole('button', { name: /^request consultation$/i }))

    await waitFor(() => {
      // Both clinics should now show "Requested"
      const requestedItems = screen.getAllByText(/requested/i)
      expect(requestedItems.length).toBeGreaterThanOrEqual(2)
    })
  })

  // ── Remove bookmark ─────────────────────────────────────────────────────────
  //
  // Clicking the bookmark icon opens a confirm modal. On confirm, the clinic is
  // removed from the list immediately (optimistic) and DELETE /api/bookmarks
  // is called. removeId is called on the context to sync the nav badge count.

  it('removes a clinic from the list after confirming the remove modal', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ bookmarks: [makeClinic()] }) })
      .mockResolvedValueOnce({ ok: true }) // DELETE response

    render(<BookmarksPage />)

    await waitFor(() => screen.getByText('Clinic One'))

    // Click the bookmark icon to trigger the remove modal
    fireEvent.click(screen.getByRole('button', { name: /remove clinic one from bookmarks/i }))
    // Confirm removal
    fireEvent.click(screen.getByRole('button', { name: /^remove$/i }))

    await waitFor(() => {
      expect(screen.queryByText('Clinic One')).not.toBeInTheDocument()
    })

    // Context badge count should be updated
    expect(mockRemoveId).toHaveBeenCalledWith('clinic-1')
  })

  it('refetches bookmarks when the DELETE returns a non-ok response', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ bookmarks: [makeClinic()] }) }) // initial fetch
      .mockResolvedValueOnce({ ok: false })                                                    // DELETE fails
      .mockResolvedValueOnce({ ok: true, json: async () => ({ bookmarks: [makeClinic()] }) }) // re-fetch after failure

    render(<BookmarksPage />)

    await waitFor(() => screen.getByText('Clinic One'))

    fireEvent.click(screen.getByRole('button', { name: /remove clinic one from bookmarks/i }))
    fireEvent.click(screen.getByRole('button', { name: /^remove$/i }))

    // Wait for the re-fetch triggered by the non-ok response
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(3))
  })

  // ── Guest (unauthenticated) ───────────────────────────────────────────────────
  //
  // Non-auth users have their saved clinic IDs in localStorage. The page reads
  // those IDs and calls POST /api/bookmarks/guest to fetch clinic details.

  it('fetches from the guest endpoint using localStorage IDs when not authenticated', async () => {
    isAuthenticated = false
    localStorage.setItem('im.bookmarks', JSON.stringify(['clinic-1']))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ bookmarks: [makeClinic()] }),
    })

    render(<BookmarksPage />)

    await waitFor(() => {
      expect(screen.getByText('Clinic One')).toBeInTheDocument()
    })
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/bookmarks/guest',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('shows "Sign in to request" button for guests instead of "Request Consultation"', async () => {
    isAuthenticated = false
    localStorage.setItem('im.bookmarks', JSON.stringify(['clinic-1']))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ bookmarks: [makeClinic()] }),
    })

    render(<BookmarksPage />)

    await waitFor(() => screen.getByText('Clinic One'))
    expect(screen.getByRole('button', { name: /sign in to request/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^request consultation$/i })).not.toBeInTheDocument()
  })

  it('shows empty state without calling the API when guest has no localStorage bookmarks', async () => {
    isAuthenticated = false

    render(<BookmarksPage />)

    await waitFor(() => {
      expect(screen.getByText(/no saved clinics yet/i)).toBeInTheDocument()
    })
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
