/**
 * Tests for components/istanbulmedic-connect/BookmarkButton.tsx
 *
 * Covers:
 *   - Visual state: filled icon when bookmarked, outline when not
 *   - Guest (unauthenticated): saves locally via addId, shows tip, no API call
 *   - Guest remove: calls removeId without API call
 *   - Add (authenticated): calls POST /api/bookmarks, optimistic addId, reverts on failure
 *   - Remove (authenticated): calls DELETE /api/bookmarks, optimistic removeId, reverts on failure
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

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
    bookmarkedIds = new Set()
    isAuthenticated = false
    global.fetch = vi.fn()
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── Visual state ──────────────────────────────────────────────────────────────

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

  // ── Guest (unauthenticated) ───────────────────────────────────────────────────
  //
  // Clicking while signed out saves locally via addId (context handles LS),
  // shows a "Sign in to save permanently" tip, and never calls the API.

  it('calls addId and shows guest tip without calling the API when unauthenticated', async () => {
    isAuthenticated = false
    render(<BookmarkButton {...defaultProps} />)
    fireEvent.click(screen.getByRole('button'))

    expect(mockAddId).toHaveBeenCalledWith('clinic-1')
    expect(global.fetch).not.toHaveBeenCalled()

    await waitFor(() => {
      expect(screen.getByText('Sign in to save permanently')).toBeInTheDocument()
    })
  })

  it('guest tip disappears after 3 seconds', async () => {
    vi.useFakeTimers()
    isAuthenticated = false
    render(<BookmarkButton {...defaultProps} />)
    fireEvent.click(screen.getByRole('button'))

    expect(screen.getByText('Sign in to save permanently')).toBeInTheDocument()

    await act(async () => { vi.advanceTimersByTime(3000) })

    expect(screen.queryByText('Sign in to save permanently')).not.toBeInTheDocument()
  })

  it('calls removeId without calling the API when removing while unauthenticated', async () => {
    isAuthenticated = false
    bookmarkedIds = new Set(['clinic-1'])
    render(<BookmarkButton {...defaultProps} />)
    fireEvent.click(screen.getByRole('button'))

    expect(mockRemoveId).toHaveBeenCalledWith('clinic-1')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  // ── Add (optimistic + revert) — authenticated ─────────────────────────────────

  it('calls addId immediately and POSTs to /api/bookmarks when adding', async () => {
    isAuthenticated = true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({ ok: true })

    render(<BookmarkButton {...defaultProps} />)
    fireEvent.click(screen.getByRole('button'))

    expect(mockAddId).toHaveBeenCalledWith('clinic-1')

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/bookmarks',
        expect.objectContaining({ method: 'POST' })
      )
    })
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

  // ── Remove (optimistic + revert) — authenticated ──────────────────────────────

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
