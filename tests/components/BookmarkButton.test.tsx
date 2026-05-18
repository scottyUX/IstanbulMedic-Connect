/**
 * Tests for components/istanbulmedic-connect/BookmarkButton.tsx
 *
 * Covers:
 *   - Visual state: filled icon when bookmarked, outline when not
 *   - Auth gate: unauthenticated click redirects to /auth/login
 *   - Add: calls POST /api/bookmarks, optimistic addId, reverts on failure
 *   - Remove: calls DELETE /api/bookmarks, optimistic removeId, reverts on failure
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

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
  // Clicking while signed out should NOT call the API — it should set a cookie
  // for post-login redirect and push to /auth/login.

  it('redirects unauthenticated user to /auth/login on click', () => {
    isAuthenticated = false
    render(<BookmarkButton {...defaultProps} />)
    fireEvent.click(screen.getByRole('button'))
    expect(mockPush).toHaveBeenCalledWith('/auth/login')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('sets auth_redirect_next cookie before redirecting', () => {
    isAuthenticated = false
    // jsdom doesn't implement cookie writing, so we spy on document.cookie setter
    let writtenCookie = ''
    const descriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie')!
    vi.spyOn(document, 'cookie', 'set').mockImplementation((val) => { writtenCookie = val })

    render(<BookmarkButton {...defaultProps} />)
    fireEvent.click(screen.getByRole('button'))

    expect(writtenCookie).toContain('auth_redirect_next')

    // Restore original cookie descriptor
    Object.defineProperty(document, 'cookie', descriptor)
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
