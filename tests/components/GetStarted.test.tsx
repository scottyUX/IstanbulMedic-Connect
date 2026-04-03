import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, initial, animate, exit, variants, custom, transition, ...props }: any) =>
      <div {...props}>{children}</div>,
  },
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => null),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

import { GetStarted } from '@/components/istanbulmedic-connect/user-profile/GetStarted'

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Options with sub-text have accessible names that include the sub-text,
// so we need regex partial matching for those.
const clickOption = (label: string) =>
  fireEvent.click(screen.getByRole('button', { name: new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }))

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GetStarted', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    window.scrollTo = vi.fn() as any
  })

  // Navigate through n steps by selecting a valid option then clicking Continue.
  async function goToStep(n: number) {
    const actions: Array<() => void> = [
      () => clickOption('18 – 24'),
      () => clickOption('Male'),
      () => clickOption('Early stages'),
      () => fireEvent.change(screen.getByPlaceholderText('e.g. United Kingdom'), { target: { value: 'UK' } }),
      () => clickOption('Under £2,000'),
      () => clickOption('Within 3 Months'),
      () => {
        fireEvent.change(screen.getByPlaceholderText('John Smith'), { target: { value: 'Jane Doe' } })
        fireEvent.change(screen.getByPlaceholderText('john@example.com'), { target: { value: 'jane@example.com' } })
      },
    ]

    const nextTitles = [
      'How do you identify?',
      'How would you describe your hair loss?',
      'Where are you based?',
      "What's your budget for treatment?",
      'When would you like your procedure?',
      'Create Your Treatment Passport',
      'Almost there.',
    ]

    for (let i = 0; i < n; i++) {
      actions[i]()
      fireEvent.click(screen.getByRole('button', { name: /Continue|Create my account/i }))
      await waitFor(() => screen.getByText(nextTitles[i]))
    }
  }

  // ─── Rendering ─────────────────────────────────────────────────────────────

  it('renders the age step on initial mount', () => {
    render(<GetStarted />)
    expect(screen.getByText('How old are you?')).toBeInTheDocument()
  })

  it('shows Step 1 of 8 on initial render', () => {
    render(<GetStarted />)
    expect(screen.getByText(/Step 1 of 8/)).toBeInTheDocument()
  })

  it('renders all age options', () => {
    render(<GetStarted />)
    expect(screen.getByText('18 – 24')).toBeInTheDocument()
    expect(screen.getByText('25 – 34')).toBeInTheDocument()
    expect(screen.getByText('65+')).toBeInTheDocument()
  })

  // ─── Continue button state ──────────────────────────────────────────────────

  it('Continue is disabled with no age selected', () => {
    render(<GetStarted />)
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
  })

  it('Continue is enabled after selecting 18 – 24', () => {
    render(<GetStarted />)
    clickOption('18 – 24')
    expect(screen.getByRole('button', { name: 'Continue' })).not.toBeDisabled()
  })

  // ─── Step navigation ────────────────────────────────────────────────────────

  it('advances to the gender step after selecting age and clicking Continue', async () => {
    render(<GetStarted />)
    clickOption('18 – 24')
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() => expect(screen.getByText('How do you identify?')).toBeInTheDocument())
  })

  it('Back on step 0 calls router.push with /profile', async () => {
    const { useRouter } = await import('next/navigation')
    const router = useRouter()
    render(<GetStarted />)
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(router.push).toHaveBeenCalledWith('/profile')
  })

  it('Back from step 1 returns to step 0', async () => {
    render(<GetStarted />)
    clickOption('18 – 24')
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() => screen.getByText('How do you identify?'))
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    await waitFor(() => expect(screen.getByText('How old are you?')).toBeInTheDocument())
  })

  // ─── Country step ───────────────────────────────────────────────────────────

  it('Country step: Continue disabled with 1 char, enabled with 2+', async () => {
    render(<GetStarted />)
    await goToStep(3)
    const input = screen.getByPlaceholderText('e.g. United Kingdom')
    const btn = screen.getByRole('button', { name: 'Continue' })
    expect(btn).toBeDisabled()
    fireEvent.change(input, { target: { value: 'U' } })
    expect(btn).toBeDisabled()
    fireEvent.change(input, { target: { value: 'UK' } })
    expect(btn).not.toBeDisabled()
  })

  // ─── Contact step ───────────────────────────────────────────────────────────

  it('Contact step renders name, email, and phone inputs', async () => {
    render(<GetStarted />)
    await goToStep(6)
    expect(screen.getByPlaceholderText('John Smith')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('john@example.com')).toBeInTheDocument()
    expect(screen.getByTestId('phone-local-input')).toBeInTheDocument()
  })

  it('Contact step: Continue disabled with no data entered', async () => {
    render(<GetStarted />)
    await goToStep(6)
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
  })

  it('Contact step: Continue disabled with invalid email', async () => {
    render(<GetStarted />)
    await goToStep(6)
    fireEvent.change(screen.getByPlaceholderText('John Smith'), { target: { value: 'Jane Doe' } })
    fireEvent.change(screen.getByPlaceholderText('john@example.com'), { target: { value: 'notanemail' } })
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
  })

  it('Contact step: Continue enabled with valid name and valid email', async () => {
    render(<GetStarted />)
    await goToStep(6)
    fireEvent.change(screen.getByPlaceholderText('John Smith'), { target: { value: 'Jane Doe' } })
    fireEvent.change(screen.getByPlaceholderText('john@example.com'), { target: { value: 'jane@example.com' } })
    expect(screen.getByRole('button', { name: 'Continue' })).not.toBeDisabled()
  })

  it('Contact step: Continue disabled with valid name + email but invalid phone', async () => {
    render(<GetStarted />)
    await goToStep(6)
    fireEvent.change(screen.getByPlaceholderText('John Smith'), { target: { value: 'Jane Doe' } })
    fireEvent.change(screen.getByPlaceholderText('john@example.com'), { target: { value: 'jane@example.com' } })
    fireEvent.change(screen.getByTestId('phone-local-input'), { target: { value: 'abc' } })
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
  })

  it('Contact step: Continue enabled with valid name, email, and valid phone', async () => {
    render(<GetStarted />)
    await goToStep(6)
    fireEvent.change(screen.getByPlaceholderText('John Smith'), { target: { value: 'Jane Doe' } })
    fireEvent.change(screen.getByPlaceholderText('john@example.com'), { target: { value: 'jane@example.com' } })
    fireEvent.change(screen.getByTestId('phone-local-input'), { target: { value: '7700900123' } })
    expect(screen.getByRole('button', { name: 'Continue' })).not.toBeDisabled()
  })

  it('Contact step: email error not shown before blur', async () => {
    render(<GetStarted />)
    await goToStep(6)
    fireEvent.change(screen.getByPlaceholderText('john@example.com'), { target: { value: 'bademail' } })
    expect(screen.queryByText(/valid email/i)).not.toBeInTheDocument()
  })

  it('Contact step: email error shown after blur with invalid email', async () => {
    render(<GetStarted />)
    await goToStep(6)
    const emailInput = screen.getByPlaceholderText('john@example.com')
    fireEvent.change(emailInput, { target: { value: 'bademail' } })
    fireEvent.blur(emailInput)
    await waitFor(() => expect(screen.getByText(/valid email address/i)).toBeInTheDocument())
  })

  it('Contact step: touched state resets after navigating away and back', async () => {
    render(<GetStarted />)
    await goToStep(6)

    // Trigger email error
    const emailInput = screen.getByPlaceholderText('john@example.com')
    fireEvent.change(emailInput, { target: { value: 'bad' } })
    fireEvent.blur(emailInput)
    await waitFor(() => screen.getByText(/valid email address/i))

    // Go back to timeline
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    await waitFor(() => screen.getByText('When would you like your procedure?'))

    // Return to contact
    clickOption('Within 3 Months')
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() => screen.getByText('Create Your Treatment Passport'))

    // Error should be gone (touched reset)
    expect(screen.queryByText(/valid email address/i)).not.toBeInTheDocument()
  })

  // ─── localStorage ───────────────────────────────────────────────────────────

  it('restores ageTier from localStorage and pre-selects the option', async () => {
    localStorage.setItem('im.qualification', JSON.stringify({ ageTier: '18-24' }))
    render(<GetStarted />)
    await waitFor(() => {
      const btn = screen.getByText('18 – 24').closest('button')!
      expect(btn.className).toContain('border-[#17375B]')
    })
  })

  // ─── Terms step ─────────────────────────────────────────────────────────────

  it('Terms step: Create my account disabled before accepting terms', async () => {
    render(<GetStarted />)
    await goToStep(7)
    expect(screen.getByRole('button', { name: 'Create my account' })).toBeDisabled()
  })

  it('Terms step: Create my account enabled after clicking the terms button', async () => {
    render(<GetStarted />)
    await goToStep(7)
    // The terms checkbox is a <button type="button"> containing "I agree to the..."
    fireEvent.click(screen.getByText(/I agree to the/i).closest('button')!)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Create my account' })).not.toBeDisabled())
  })
})
