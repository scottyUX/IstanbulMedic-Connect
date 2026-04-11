import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { UserProfileDashboard } from '@/components/istanbulmedic-connect/user-profile/UserProfileDashboard'

// ─── Mock fetch globally ───────────────────────────────────────────────────────

const mockFetch = vi.fn()
global.fetch = mockFetch

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockApiSuccess(qualificationComplete: boolean, treatmentComplete: boolean) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      success: true,
      data: { qualificationComplete, treatmentComplete },
    }),
  })
}

function mockApiFail() {
  mockFetch.mockResolvedValue({ ok: false, json: async () => ({ success: false }) })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('UserProfileDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockApiFail()
  })

  // --- Rendering ---

  it('renders the page title and subtitle', async () => {
    render(<UserProfileDashboard />)
    expect(screen.getByText('Digital Treatment Passport')).toBeInTheDocument()
    expect(screen.getByText(/Complete your profile/)).toBeInTheDocument()
  })

  it('renders all four phase labels', async () => {
    render(<UserProfileDashboard />)
    // Each label appears in both the stepper node and the phase card heading
    expect(screen.getAllByText('Get Started').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Treatment Profile').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('AI Insights').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Share & Connect').length).toBeGreaterThanOrEqual(1)
  })

  it('renders phase number labels in the stepper', async () => {
    render(<UserProfileDashboard />)
    await waitFor(() => {
      expect(screen.getByText('Phase 1')).toBeInTheDocument()
      expect(screen.getByText('Phase 2')).toBeInTheDocument()
      expect(screen.getByText('Phase 3')).toBeInTheDocument()
      expect(screen.getByText('Phase 4')).toBeInTheDocument()
    })
  })

  // --- Initial state (nothing complete) ---

  it('shows 0% overall progress when nothing is complete', async () => {
    render(<UserProfileDashboard />)
    await waitFor(() => {
      expect(screen.getByText('0%')).toBeInTheDocument()
    })
  })

  it('shows Phase 1 as "Not started" and phases 2–4 as "Locked" initially', async () => {
    render(<UserProfileDashboard />)
    await waitFor(() => {
      expect(screen.getAllByText('Not started')).toHaveLength(1)
      expect(screen.getAllByText('Locked')).toHaveLength(3)
    })
  })

  it('Phase 1 links to /profile/get-started', async () => {
    render(<UserProfileDashboard />)
    const link = await waitFor(() => screen.getByRole('link', { name: /Get Started/i }))
    expect(link).toHaveAttribute('href', '/profile/get-started')
  })

  it('locked phases do not render as links', async () => {
    render(<UserProfileDashboard />)
    await waitFor(() => {
      // Only phase 1 should be a link at the start — 3 locked phases have no <a>
      const links = screen.getAllByRole('link')
      // One link per unlocked phase (just phase 1)
      const phaseLinks = links.filter((l) =>
        ['/profile/get-started', '/profile/treatment-profile', '/profile/ai-insights', '/profile/share-connect']
          .includes(l.getAttribute('href') ?? '')
      )
      expect(phaseLinks).toHaveLength(1)
    })
  })

  // --- Phase 1 complete ---

  it('shows 25% overall progress when phase 1 is complete', async () => {
    mockApiSuccess(true, false)
    render(<UserProfileDashboard />)
    await waitFor(() => {
      expect(screen.getByText('25%')).toBeInTheDocument()
    })
  })

  it('shows "Complete" badge on phase 1 when qualificationComplete is true', async () => {
    mockApiSuccess(true, false)
    render(<UserProfileDashboard />)
    await waitFor(() => {
      expect(screen.getByText('Complete')).toBeInTheDocument()
    })
  })

  it('phase 2 becomes "Not started" (available) once phase 1 is complete', async () => {
    mockApiSuccess(true, false)
    render(<UserProfileDashboard />)
    await waitFor(() => {
      // Phase 1 is "complete", phase 2 is "available" → "Not started"
      // Phases 3 and 4 remain locked
      expect(screen.getAllByText('Not started')).toHaveLength(1)
      expect(screen.getAllByText('Locked')).toHaveLength(2)
    })
  })

  it('phase 2 links to /profile/treatment-profile once phase 1 is complete', async () => {
    mockApiSuccess(true, false)
    render(<UserProfileDashboard />)
    await waitFor(() => {
      const link = screen.getByRole('link', { name: /Treatment Profile/i })
      expect(link).toHaveAttribute('href', '/profile/treatment-profile')
    })
  })

  // --- Both phases complete ---

  it('shows 50% overall progress when phases 1 and 2 are complete', async () => {
    mockApiSuccess(true, true)
    render(<UserProfileDashboard />)
    await waitFor(() => {
      expect(screen.getByText('50%')).toBeInTheDocument()
    })
  })

  it('shows two "Complete" badges when phases 1 and 2 are done', async () => {
    mockApiSuccess(true, true)
    render(<UserProfileDashboard />)
    await waitFor(() => {
      expect(screen.getAllByText('Complete')).toHaveLength(2)
    })
  })

  // --- localStorage fallback ---

  it('falls back to localStorage for phase 1 when API request fails', async () => {
    localStorage.setItem('im.qualification.complete', 'true')
    mockFetch.mockRejectedValue(new Error('Network error'))
    render(<UserProfileDashboard />)
    await waitFor(() => {
      expect(screen.getByText('Complete')).toBeInTheDocument()
    })
  })

  it('falls back to localStorage for both phases when API returns non-ok status', async () => {
    localStorage.setItem('im.qualification.complete', 'true')
    localStorage.setItem('im.treatment-profile.complete', 'true')
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({ success: false }) })
    render(<UserProfileDashboard />)
    await waitFor(() => {
      expect(screen.getAllByText('Complete')).toHaveLength(2)
    })
  })

  it('localStorage without phase 2 complete shows phase 2 as available after fallback', async () => {
    localStorage.setItem('im.qualification.complete', 'true')
    mockFetch.mockRejectedValue(new Error('Network error'))
    render(<UserProfileDashboard />)
    await waitFor(() => {
      expect(screen.getByText('Complete')).toBeInTheDocument()
      expect(screen.getByText('Not started')).toBeInTheDocument()
    })
  })

  // --- Phase 3 unlock chain ---

  it('phase 3 remains locked when only phase 1 is complete', async () => {
    mockApiSuccess(true, false)
    render(<UserProfileDashboard />)
    await waitFor(() => {
      // Phase 3 and 4 are still locked; only phase 2 unlocks
      expect(screen.getAllByText('Locked')).toHaveLength(2)
    })
  })

  it('phase 3 becomes available once phases 1 and 2 are complete', async () => {
    mockApiSuccess(true, true)
    render(<UserProfileDashboard />)
    await waitFor(() => {
      // Phases 1 and 2 are "complete"; phase 3 is now "Not started"; only phase 4 is "Locked"
      expect(screen.getAllByText('Complete')).toHaveLength(2)
      expect(screen.getAllByText('Not started')).toHaveLength(1)
      expect(screen.getAllByText('Locked')).toHaveLength(1)
    })
  })

  it('phase 3 links to /profile/ai-insights once unlocked', async () => {
    mockApiSuccess(true, true)
    render(<UserProfileDashboard />)
    await waitFor(() => {
      const link = screen.getByRole('link', { name: /AI Insights/i })
      expect(link).toHaveAttribute('href', '/profile/ai-insights')
    })
  })

  // --- Calls the status API ---

  it('fetches /api/profile/status on mount', async () => {
    render(<UserProfileDashboard />)
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/profile/status')
    })
  })
})
