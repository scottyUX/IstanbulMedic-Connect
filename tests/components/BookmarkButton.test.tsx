/**
 * Tests for components/istanbulmedic-connect/BookmarkButton.tsx
 *
 * Covers:
 *   - Visual state: filled icon when bookmarked, outline when not
 *   - Auth gate: unauthenticated click opens sign-in modal (no redirect)
 *   - Sign-in intent: stores bookmark_intent in sessionStorage, redirects with ?next=
 *   - Auto-bookmark: useEffect fires bookmark API when intent matches on mount while authenticated
 *   - Add: calls POST /api/bookmarks, optimistic addId, reverts on failure
 *   - Remove: calls DELETE /api/bookmarks, optimistic removeId, reverts on failure
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

// ─── Context mocks ─────────────────────────────────────────────────────────────
//
// We expose mutable variables so individual tests can control the context state
// (e.g. put a clinicId in bookmarkedIds to simulate an already-bookmarked state).

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))

let bookmarkedIds = new Set<string>()
const mockAddId = vi.fn()
const mockRemoveId = vi.fn()

vi.mock('@/contexts/BookmarkCountContext', () => ({
  useBookmarkCount: () => ({ bookmarkedIds, addId: mockAddId, removeId: mockRemoveId }),
}))

let isAuthenticated = false
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated }),
}))

import { BookmarkButton } from '@/components/istanbulmedic-connect/BookmarkButton'

const defaultProps = {
  clinicId: 'clinic-1',
  clinicName: 'Test Clinic',
}

describe('BookmarkButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset shared state before each test
    bookmarkedIds = new Set()
    isAuthenticated = false
    global.fetch = vi.fn()
    sessionStorage.clear()
  })

  // ── Visual state ─────────────────────────────────────────────────────────────

  it('renders with "Bookmark" aria-label when not yet bookmarked', () => {
    render(<BookmarkButton {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Bookmark Test Clinic' })).toBeInTheDocument()
  })

  it('renders with "Remove" aria-label when already bookmarked', () => {
    bookmarkedIds = new Set(['clinic-1'])
    render(<BookmarkButton {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Remove Test Clinic from bookmarks' })).toBeInTheDocument()
  })

  it('renders optional label when provided', () => {
    render(<BookmarkButton {...defaultProps} label="Save Clinic" />)
    expect(screen.getByText('Save Clinic')).toBeInTheDocument()
  })

  it('renders labelSaved when already bookmarked and labelSaved is provided', () => {
    bookmarkedIds = new Set(['clinic-1'])
    render(<BookmarkButton {...defaultProps} label="Save Clinic" labelSaved="Saved" />)
    expect(screen.getByText('Saved')).toBeInTheDocument()
  })

  // ── Auth gate ─────────────────────────────────────────────────────────────────
  //
  // Clicking while signed out should open the sign-in modal, NOT redirect or
  // call the API directly.

  it('opens sign-in modal on click when unauthenticated', () => {
    isAuthenticated = false
    render(<BookmarkButton {...defaultProps} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Sign in to save clinics')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('does not open modal when authenticated', () => {
    isAuthenticated = true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({ ok: true })
    render(<BookmarkButton {...defaultProps} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByText('Sign in to save clinics')).not.toBeInTheDocument()
  })

  // ── Sign-in intent ────────────────────────────────────────────────────────────
  //
  // When the user clicks "Sign In" in the modal, we store the clinic ID in
  // sessionStorage and redirect to /auth/login?next=<currentPath> so the
  // login page passes the right destination to loginWithGoogle.

  it('stores bookmark_intent and redirects with ?next= when Sign In is clicked', () => {
    isAuthenticated = false
    render(<BookmarkButton {...defaultProps} />)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    expect(sessionStorage.getItem('bookmark_intent')).toBe('clinic-1')
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login?next=')
    )
    expect(global.fetch).not.toHaveBeenCalled()
  })

  // ── Auto-bookmark on return ───────────────────────────────────────────────────
  //
  // After sign-in the user lands back on the page. On mount, if isAuthenticated
  // is true and sessionStorage has a matching bookmark_intent, the button should
  // fire the POST automatically and clear the intent.

  it('auto-bookmarks and clears intent when mounted authenticated with matching intent', async () => {
    isAuthenticated = true
    sessionStorage.setItem('bookmark_intent', 'clinic-1')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({ ok: true })

    await act(async () => {
      render(<BookmarkButton {...defaultProps} />)
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/bookmarks',
        expect.objectContaining({ method: 'POST' })
      )
    })
    expect(sessionStorage.getItem('bookmark_intent')).toBeNull()
    expect(mockAddId).toHaveBeenCalledWith('clinic-1')
  })

  it('does not auto-bookmark when intent is for a different clinic', async () => {
    isAuthenticated = true
    sessionStorage.setItem('bookmark_intent', 'clinic-999')

    await act(async () => {
      render(<BookmarkButton {...defaultProps} />)
    })

    expect(global.fetch).not.toHaveBeenCalled()
    // Intent should remain untouched since it wasn't ours to clear
    expect(sessionStorage.getItem('bookmark_intent')).toBe('clinic-999')
  })

  // ── Add (optimistic + revert) ─────────────────────────────────────────────────
  //
  // addId is called immediately (optimistic). If the API call fails, removeId
  // is called to roll back.

  it('calls addId immediately and POSTs to /api/bookmarks when adding', async () => {
    isAuthenticated = true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({ ok: true })

    render(<BookmarkButton {...defaultProps} />)
    fireEvent.click(screen.getByRole('button'))

    // Optimistic update happens synchronously
    expect(mockAddId).toHaveBeenCalledWith('clinic-1')

    // API call happens asynchronously
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/bookmarks',
        expect.objectContaining({ method: 'POST' })
      )
    })
    // No revert on success
    expect(mockRemoveId).not.toHaveBeenCalled()
  })

  it('reverts optimistic add by calling removeId when the API returns non-ok', async () => {
    isAuthenticated = true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({ ok: false })

    render(<BookmarkButton {...defaultProps} />)
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => expect(mockRemoveId).toHaveBeenCalledWith('clinic-1'))
  })

  it('reverts optimistic add by calling removeId when fetch throws', async () => {
    isAuthenticated = true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockRejectedValueOnce(new Error('network error'))

    render(<BookmarkButton {...defaultProps} />)
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => expect(mockRemoveId).toHaveBeenCalledWith('clinic-1'))
  })

  // ── Remove (optimistic + revert) ──────────────────────────────────────────────

  it('calls removeId immediately and DELETEs from /api/bookmarks when removing', async () => {
    isAuthenticated = true
    bookmarkedIds = new Set(['clinic-1'])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({ ok: true })

    render(<BookmarkButton {...defaultProps} />)
    fireEvent.click(screen.getByRole('button'))

    expect(mockRemoveId).toHaveBeenCalledWith('clinic-1')

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/bookmarks',
        expect.objectContaining({ method: 'DELETE' })
      )
    })
    expect(mockAddId).not.toHaveBeenCalled()
  })

  it('reverts optimistic remove by calling addId when the API returns non-ok', async () => {
    isAuthenticated = true
    bookmarkedIds = new Set(['clinic-1'])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({ ok: false })

    render(<BookmarkButton {...defaultProps} />)
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => expect(mockAddId).toHaveBeenCalledWith('clinic-1'))
  })
})
