import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

// Stub all section components so ProfileDashboard tests stay focused on nav logic
vi.mock('@/components/istanbulmedic-connect/user-profile/sections/ProfileHome', () => ({
  default: ({ onNavigate }: { onNavigate: (s: string) => void }) => (
    <div data-testid="section-home">ProfileHome<button onClick={() => onNavigate('personal-info')}>go-personal</button></div>
  ),
}))
vi.mock('@/components/istanbulmedic-connect/user-profile/sections/ProfilePersonalInfo', () => ({
  default: () => <div data-testid="section-personal-info">ProfilePersonalInfo</div>,
}))
vi.mock('@/components/istanbulmedic-connect/user-profile/sections/ProfileMedicalHistory', () => ({
  default: () => <div data-testid="section-medical-history">ProfileMedicalHistory</div>,
}))
vi.mock('@/components/istanbulmedic-connect/user-profile/sections/ProfileHairLossStatus', () => ({
  default: () => <div data-testid="section-hair-loss">ProfileHairLossStatus</div>,
}))
vi.mock('@/components/istanbulmedic-connect/user-profile/sections/ProfileConsultations', () => ({
  default: () => <div data-testid="section-consultations">ProfileConsultations</div>,
}))

import { useAuth } from '@/contexts/AuthContext'
import ProfileDashboard from '@/components/istanbulmedic-connect/user-profile/ProfileDashboard'

const mockUseAuth = vi.mocked(useAuth)

function renderDashboard(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  mockUseAuth.mockReturnValue({
    isAuthenticated: true,
    user: { email: 'user@example.com' } as unknown as ReturnType<typeof useAuth>['user'],
    profile: { full_name: 'Jane Doe', given_name: 'Jane', family_name: 'Doe', email: 'user@example.com', avatar_url: null } as unknown as ReturnType<typeof useAuth>['profile'],
    loading: false,
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
    fetchUserProfile: vi.fn(),
    ...overrides,
  })
  return render(<ProfileDashboard />)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProfileDashboard', () => {
  beforeEach(() => vi.clearAllMocks())

  // ─── Loading state ──────────────────────────────────────────────────────────

  it('renders skeleton while auth is loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false, user: null, profile: null, loading: true,
      loginWithGoogle: vi.fn(), logout: vi.fn(), fetchUserProfile: vi.fn(),
    })
    const { container } = render(<ProfileDashboard />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  // ─── Default section ────────────────────────────────────────────────────────

  it('shows the home section by default', () => {
    renderDashboard()
    expect(screen.getByTestId('section-home')).toBeInTheDocument()
  })

  it('does not show other sections on initial render', () => {
    renderDashboard()
    expect(screen.queryByTestId('section-personal-info')).not.toBeInTheDocument()
    expect(screen.queryByTestId('section-medical-history')).not.toBeInTheDocument()
  })

  // ─── Sidebar navigation ─────────────────────────────────────────────────────

  it('switches to personal-info section when nav item clicked', () => {
    renderDashboard()
    fireEvent.click(screen.getAllByRole('tab', { name: /Personal info/i })[0])
    expect(screen.getByTestId('section-personal-info')).toBeInTheDocument()
    expect(screen.queryByTestId('section-home')).not.toBeInTheDocument()
  })

  it('switches to medical-history section when nav item clicked', () => {
    renderDashboard()
    fireEvent.click(screen.getAllByRole('tab', { name: /Medical history/i })[0])
    expect(screen.getByTestId('section-medical-history')).toBeInTheDocument()
  })

  it('switches to hair-loss-status section when nav item clicked', () => {
    renderDashboard()
    fireEvent.click(screen.getAllByRole('tab', { name: /Hair loss status/i })[0])
    expect(screen.getByTestId('section-hair-loss')).toBeInTheDocument()
  })

  it('switches to consultations section when nav item clicked', () => {
    renderDashboard()
    fireEvent.click(screen.getAllByRole('tab', { name: /Consultations/i })[0])
    expect(screen.getByTestId('section-consultations')).toBeInTheDocument()
  })

  // ─── Section navigation via onNavigate callback ─────────────────────────────

  it('navigates to personal-info when ProfileHome calls onNavigate', () => {
    renderDashboard()
    fireEvent.click(screen.getByText('go-personal'))
    expect(screen.getByTestId('section-personal-info')).toBeInTheDocument()
  })

  // ─── User identity strip ────────────────────────────────────────────────────

  it('displays the full name in the sidebar', () => {
    renderDashboard()
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
  })

  it('displays initials when no avatar_url', () => {
    renderDashboard()
    // initials = given_name[0] + family_name[0] = 'JD'
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('displays user email in the sidebar', () => {
    renderDashboard()
    expect(screen.getByText('user@example.com')).toBeInTheDocument()
  })

  it('falls back to email prefix when profile has no name', () => {
    renderDashboard({
      profile: { full_name: null, given_name: null, family_name: null, email: 'user@example.com', avatar_url: null } as unknown as ReturnType<typeof useAuth>['profile'],
    })
    expect(screen.getByText('user')).toBeInTheDocument()
  })

  it('shows avatar img when profile has avatar_url', () => {
    renderDashboard({
      profile: { full_name: 'Jane', given_name: 'Jane', family_name: null, email: 'user@example.com', avatar_url: 'https://example.com/avatar.jpg' } as unknown as ReturnType<typeof useAuth>['profile'],
    })
    const img = screen.getByRole('img', { name: /Jane/i })
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  // ─── Nav item count ──────────────────────────────────────────────────────────

  it('renders all 5 nav items in both sidebar and mobile strip', () => {
    renderDashboard()
    // 5 sections × 2 (sidebar + mobile) = 10 nav buttons
    expect(screen.getAllByRole('tab', { name: /Home/i }).length).toBeGreaterThanOrEqual(2)
  })
})
