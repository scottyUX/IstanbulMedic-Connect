import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('next/font/google', () => ({
  Merriweather: () => ({ className: 'mock-merriweather', style: {} }),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => null),
}))

import { useAuth } from '@/contexts/AuthContext'
import ProfileHome from '@/components/istanbulmedic-connect/user-profile/sections/ProfileHome'

const mockUseAuth = vi.mocked(useAuth)

function setupAuth(overrides: Record<string, unknown> = {}) {
  mockUseAuth.mockReturnValue({
    isAuthenticated: true,
    user: { email: 'jane@example.com' } as unknown as ReturnType<typeof useAuth>['user'],
    profile: {
      full_name: 'Jane Doe',
      given_name: 'Jane',
      family_name: 'Doe',
      email: 'jane@example.com',
      avatar_url: null,
    } as unknown as ReturnType<typeof useAuth>['profile'],
    loading: false,
    loginWithGoogle: vi.fn(), logout: vi.fn(), fetchUserProfile: vi.fn(),
    ...overrides,
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProfileHome', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: photos API returns empty
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    })
  })

  // ─── Loading state ──────────────────────────────────────────────────────────

  it('shows a loading skeleton while auth is loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false, user: null, profile: null, loading: true,
      loginWithGoogle: vi.fn(), logout: vi.fn(), fetchUserProfile: vi.fn(),
    })
    const { container } = render(<ProfileHome onNavigate={vi.fn()} />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  // ─── Welcome banner ──────────────────────────────────────────────────────────

  it('shows "Welcome back, Jane" using first name', async () => {
    setupAuth()
    render(<ProfileHome onNavigate={vi.fn()} />)
    await waitFor(() =>
      expect(screen.getByText(/Welcome back, Jane/i)).toBeInTheDocument()
    )
  })

  it('falls back to email prefix when given_name is missing', async () => {
    setupAuth({
      profile: { full_name: null, given_name: null, family_name: null, email: 'jane@example.com', avatar_url: null },
    })
    render(<ProfileHome onNavigate={vi.fn()} />)
    await waitFor(() =>
      expect(screen.getByText(/Welcome back, jane/i)).toBeInTheDocument()
    )
  })

  it('shows avatar img when profile has avatar_url', async () => {
    setupAuth({
      profile: { full_name: 'Jane', given_name: 'Jane', family_name: null, email: 'jane@example.com', avatar_url: 'https://example.com/avatar.jpg' },
    })
    render(<ProfileHome onNavigate={vi.fn()} />)
    await waitFor(() => {
      const imgs = screen.getAllByRole('img')
      const avatar = imgs.find((img) => img.getAttribute('src') === 'https://example.com/avatar.jpg')
      expect(avatar).toBeInTheDocument()
    })
  })

  // ─── Section cards ───────────────────────────────────────────────────────────

  it('renders the 4 section cards', async () => {
    setupAuth()
    render(<ProfileHome onNavigate={vi.fn()} />)
    await waitFor(() => screen.getByText('Personal info'))
    expect(screen.getByText('Medical history')).toBeInTheDocument()
    expect(screen.getByText('Hair loss status')).toBeInTheDocument()
    expect(screen.getByText('Consultations')).toBeInTheDocument()
  })

  it('Consultations card shows "Coming soon" badge and is disabled', async () => {
    setupAuth()
    render(<ProfileHome onNavigate={vi.fn()} />)
    await waitFor(() => screen.getByText('Coming soon'))
    const consultationsCard = screen.getByText('Consultations').closest('button')!
    expect(consultationsCard).toBeDisabled()
  })

  it('calls onNavigate when a non-disabled card is clicked', async () => {
    setupAuth()
    const onNavigate = vi.fn()
    render(<ProfileHome onNavigate={onNavigate} />)
    await waitFor(() => screen.getByText('Personal info'))
    fireEvent.click(screen.getByText('Personal info').closest('button')!)
    expect(onNavigate).toHaveBeenCalledWith('personal-info')
  })

  it('does NOT call onNavigate for Consultations card', async () => {
    setupAuth()
    const onNavigate = vi.fn()
    render(<ProfileHome onNavigate={onNavigate} />)
    await waitFor(() => screen.getByText('Consultations'))
    fireEvent.click(screen.getByText('Consultations').closest('button')!)
    expect(onNavigate).not.toHaveBeenCalled()
  })

  // ─── Photo counter ───────────────────────────────────────────────────────────

  it('shows "0/5 uploaded" when no photos exist', async () => {
    setupAuth()
    render(<ProfileHome onNavigate={vi.fn()} />)
    await waitFor(() => expect(screen.getByText('0/5 uploaded')).toBeInTheDocument())
  })

  it('shows correct photo count when photos are loaded', async () => {
    setupAuth()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          { photo_view: 'front', storage_url: 'https://example.com/front.jpg' },
          { photo_view: 'top', storage_url: 'https://example.com/top.jpg' },
        ],
      }),
    })
    render(<ProfileHome onNavigate={vi.fn()} />)
    await waitFor(() => expect(screen.getByText('2/5 uploaded')).toBeInTheDocument())
  })

  // ─── Photo upload validation ─────────────────────────────────────────────────

  it('shows error when non-image file is selected', async () => {
    setupAuth()
    render(<ProfileHome onNavigate={vi.fn()} />)
    await waitFor(() => screen.getByText('0/5 uploaded'))

    // Find a file input (one per photo view)
    const fileInputs = document.querySelectorAll('input[type="file"]')
    const pdfFile = new File(['content'], 'doc.pdf', { type: 'application/pdf' })
    Object.defineProperty(fileInputs[0], 'files', { value: [pdfFile] })
    fireEvent.change(fileInputs[0])

    await waitFor(() =>
      expect(screen.getByText(/Only JPEG, PNG, or WebP/i)).toBeInTheDocument()
    )
  })

  it('shows error when file exceeds 10 MB', async () => {
    setupAuth()
    render(<ProfileHome onNavigate={vi.fn()} />)
    await waitFor(() => screen.getByText('0/5 uploaded'))

    const fileInputs = document.querySelectorAll('input[type="file"]')
    const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' })
    Object.defineProperty(fileInputs[0], 'files', { value: [largeFile] })
    fireEvent.change(fileInputs[0])

    await waitFor(() =>
      expect(screen.getByText(/under 10 MB/i)).toBeInTheDocument()
    )
  })
})
