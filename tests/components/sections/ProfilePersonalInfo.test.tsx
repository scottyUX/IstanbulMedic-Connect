import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

vi.mock('next/font/google', () => ({
  Merriweather: () => ({ className: 'mock-merriweather', style: {} }),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '@/contexts/AuthContext'
import ProfilePersonalInfo from '@/components/istanbulmedic-connect/user-profile/sections/ProfilePersonalInfo'

const mockUseAuth = vi.mocked(useAuth)

const DEFAULT_QUAL_DATA = {
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  gender: 'female',
  birthday: '1990-05-15',
  country: 'United Kingdom',
  whatsApp: '+447700900123',
  preferredLanguage: 'en',
  budgetTier: '5000-8000',
  timeline: '3-6-months',
  ageTier: '25-34',
  norwoodScale: null,
  termsAccepted: true,
}

function setupFetch(qualData = DEFAULT_QUAL_DATA, saveOk = true) {
  global.fetch = vi.fn().mockImplementation((_url: string, opts?: RequestInit) => {
    if (opts?.method === 'POST') {
      return Promise.resolve({
        ok: saveOk,
        json: async () => saveOk ? { success: true } : { success: false, error: 'Save failed' },
      })
    }
    return Promise.resolve({
      ok: true,
      json: async () => ({ success: true, data: qualData }),
    })
  })
}

async function renderLoaded() {
  mockUseAuth.mockReturnValue({
    isAuthenticated: true,
    user: { email: 'jane@example.com' } as unknown as ReturnType<typeof useAuth>['user'],
    profile: { email: 'jane@example.com', full_name: 'Jane Doe' } as unknown as ReturnType<typeof useAuth>['profile'],
    loading: false,
    loginWithGoogle: vi.fn(), logout: vi.fn(), fetchUserProfile: vi.fn(),
  })
  // Wrap in async act so the useEffect fetch and subsequent state updates
  // are fully flushed before we assert. Required when vi.useFakeTimers() is
  // active because waitFor relies on setInterval which is faked.
  await act(async () => { render(<ProfilePersonalInfo />) })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProfilePersonalInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  // ─── Loading state ──────────────────────────────────────────────────────────

  it('shows loading skeleton before data arrives', () => {
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {})) // never resolves
    mockUseAuth.mockReturnValue({
      isAuthenticated: true, user: null, profile: null, loading: false,
      loginWithGoogle: vi.fn(), logout: vi.fn(), fetchUserProfile: vi.fn(),
    })
    const { container } = render(<ProfilePersonalInfo />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  // ─── Data loading ───────────────────────────────────────────────────────────

  it('renders first name input pre-filled from API', async () => {
    setupFetch()
    await renderLoaded()
    expect(screen.getByDisplayValue('Jane')).toBeInTheDocument()
  })

  it('renders last name input pre-filled from API', async () => {
    setupFetch()
    await renderLoaded()
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
  })

  it('renders country input pre-filled from API', async () => {
    setupFetch()
    await renderLoaded()
    expect(screen.getByDisplayValue('United Kingdom')).toBeInTheDocument()
  })

  it('displays email as read-only text, not an editable input', async () => {
    setupFetch()
    await renderLoaded()
    expect(screen.getByText('Email')).toBeInTheDocument()
    const emailInputs = screen.queryAllByDisplayValue('jane@example.com')
    emailInputs.forEach((el) => expect(el.tagName).not.toBe('INPUT'))
  })

  // ─── Gender select ──────────────────────────────────────────────────────────

  it('renders the gender select with loaded value', async () => {
    setupFetch()
    await renderLoaded()
    expect(screen.getAllByRole('combobox')[0]).toBeInTheDocument()
  })

  // ─── Autosave ───────────────────────────────────────────────────────────────

  it('triggers a POST to /api/profile/qualification after a field change', async () => {
    setupFetch()
    await renderLoaded()

    fireEvent.change(screen.getByDisplayValue('Jane'), { target: { value: 'Julia' } })

    // Sync act: fires the 800 ms debounce timer and flushes React state
    act(() => { vi.advanceTimersByTime(900) })

    const fetchMock = global.fetch as ReturnType<typeof vi.fn>
    const postCalls = fetchMock.mock.calls.filter(([, opts]) => opts?.method === 'POST')
    expect(postCalls.length).toBeGreaterThanOrEqual(1)
    expect(postCalls[0][0]).toBe('/api/profile/qualification')
  })

  // ─── Save states ────────────────────────────────────────────────────────────

  it('shows "Saving…" then "Saved" after a successful save', async () => {
    setupFetch()
    await renderLoaded()

    fireEvent.change(screen.getByDisplayValue('Jane'), { target: { value: 'Julia' } })

    // Sync act: fires the debounce and flushes saving=true state
    act(() => { vi.advanceTimersByTime(900) })
    // Two CardHeaders share the same saveState — use getAllByText
    expect(screen.getAllByText('Saving…').length).toBeGreaterThan(0)

    // Async act: resolves the fetch promise and flushes saved=true state
    await act(async () => {})
    expect(screen.getAllByText('Saved').length).toBeGreaterThan(0)
  })

  it('shows "Save failed" on a server error response', async () => {
    setupFetch(DEFAULT_QUAL_DATA, false)
    await renderLoaded()

    fireEvent.change(screen.getByDisplayValue('Jane'), { target: { value: 'Julia' } })

    act(() => { vi.advanceTimersByTime(900) })
    await act(async () => {})
    expect(screen.getAllByText(/Save failed/i).length).toBeGreaterThan(0)
  })

  // ─── Treatment preferences ──────────────────────────────────────────────────

  it('renders budget and timeline selects', async () => {
    setupFetch()
    await renderLoaded()
    expect(screen.getByText('Budget range')).toBeInTheDocument()
    expect(screen.getByText('Treatment timeline')).toBeInTheDocument()
  })
})
