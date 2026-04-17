import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, initial: _i, animate: _a, exit: _e, variants: _v, custom: _c, transition: _t, ...props }: { children?: React.ReactNode; initial?: unknown; animate?: unknown; exit?: unknown; variants?: unknown; custom?: unknown; transition?: unknown } & Record<string, unknown>) =>
      <div {...(props as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>,
  },
}))

vi.mock('lucide-react', () => ({
  // ArrowLeft is the only content of the back button — give it a name so it's findable
  ArrowLeft: () => <span>Back</span>,
  // ArrowRight and CheckCircle2 are decorative; rendering them as null keeps
  // button accessible names clean (e.g. "Continue" not "Continue →")
  ArrowRight: () => null,
  CheckCircle2: () => null,
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => null),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href?: string; children?: React.ReactNode } & Record<string, unknown>) => <a href={href} {...(props as React.HTMLAttributes<HTMLAnchorElement>)}>{children}</a>,
}))

import { GetStarted } from '@/components/istanbulmedic-connect/user-profile/GetStarted'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const clickOption = (label: string) =>
  fireEvent.click(screen.getByRole('button', { name: new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }))

// Navigate through n steps by selecting a valid option then clicking Continue.
// After goToStep(6) the component is on the contact step (the last step).
async function goToStep(n: number) {
  const actions: Array<() => void> = [
    () => clickOption('18 – 24'),                    // 0: age
    () => clickOption('Male'),                        // 1: gender
    () => clickOption('Stage 1'),                     // 2: norwood (hair_loss)
    () => fireEvent.change(screen.getByPlaceholderText('e.g. United Kingdom'), { target: { value: 'UK' } }), // 3: country
    () => clickOption('Under £2,000'),               // 4: budget
    () => clickOption('Within 3 Months'),            // 5: timeline
  ]

  const nextTitles = [
    'How do you identify?',
    'What is your Norwood scale?',
    'Where are you based?',
    "What's your budget for treatment?",
    'When would you like your procedure?',
    'Create Your Treatment Passport',
  ]

  for (let i = 0; i < n; i++) {
    actions[i]()
    fireEvent.click(screen.getByRole('button', { name: /Continue|Create my account/i }))
    await waitFor(() => screen.getByText(nextTitles[i]))
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GetStarted', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
  })

  // ─── Rendering ─────────────────────────────────────────────────────────────

  it('renders the age step on initial mount', () => {
    render(<GetStarted />)
    expect(screen.getByText('How old are you?')).toBeInTheDocument()
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

  it('Continue is enabled after selecting an age', () => {
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

  it('shows no back button on step 0 (renders placeholder span instead)', () => {
    render(<GetStarted />)
    // The component only renders the back button when step > 0.
    // On step 0 it renders a <span /> placeholder so the layout stays balanced.
    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument()
  })

  it('Back from step 1 returns to step 0', async () => {
    render(<GetStarted />)
    clickOption('18 – 24')
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() => screen.getByText('How do you identify?'))
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    await waitFor(() => expect(screen.getByText('How old are you?')).toBeInTheDocument())
  })

  // ─── Norwood / Hair loss step ───────────────────────────────────────────────

  it('advances to the Norwood scale step after selecting gender', async () => {
    render(<GetStarted />)
    // goToStep(2) selects age, clicks Continue → selects gender, clicks Continue → waits for Norwood title
    await goToStep(2)
    expect(screen.getByText('What is your Norwood scale?')).toBeInTheDocument()
  })

  it('Norwood step renders all 7 stage options', async () => {
    render(<GetStarted />)
    await goToStep(2)
    expect(screen.getByText(/Stage 1 – Minimal or no recession/)).toBeInTheDocument()
    expect(screen.getByText(/Stage 7 – Most extensive pattern/)).toBeInTheDocument()
  })

  it('Continue is disabled until a Norwood stage is selected', async () => {
    render(<GetStarted />)
    await goToStep(2)
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
  })

  it('Continue is enabled after selecting a Norwood stage', async () => {
    render(<GetStarted />)
    await goToStep(2)
    clickOption('Stage 3')
    expect(screen.getByRole('button', { name: 'Continue' })).not.toBeDisabled()
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

  it('Contact step renders name and phone inputs', async () => {
    render(<GetStarted />)
    await goToStep(6)
    expect(screen.getByPlaceholderText('John Smith')).toBeInTheDocument()
    expect(screen.getByTestId('phone-local-input')).toBeInTheDocument()
  })

  it('Contact step shows email display (not an editable input)', async () => {
    render(<GetStarted />)
    await goToStep(6)
    // Email placeholder input should NOT be present — email is read-only
    expect(screen.queryByPlaceholderText('john@example.com')).not.toBeInTheDocument()
  })

  it('Contact step: Create my account disabled with no data entered', async () => {
    render(<GetStarted />)
    await goToStep(6)
    expect(screen.getByRole('button', { name: 'Create my account' })).toBeDisabled()
  })

  it('Contact step: Create my account disabled with name but no consent', async () => {
    render(<GetStarted />)
    await goToStep(6)
    fireEvent.change(screen.getByPlaceholderText('John Smith'), { target: { value: 'Jane Doe' } })
    expect(screen.getByRole('button', { name: 'Create my account' })).toBeDisabled()
  })

  it('Contact step: Create my account disabled with consent but no name', async () => {
    render(<GetStarted />)
    await goToStep(6)
    fireEvent.click(screen.getByText(/I have read and agreed/i).closest('button')!)
    expect(screen.getByRole('button', { name: 'Create my account' })).toBeDisabled()
  })

  it('Contact step: Create my account enabled with valid name and consent', async () => {
    render(<GetStarted />)
    await goToStep(6)
    fireEvent.change(screen.getByPlaceholderText('John Smith'), { target: { value: 'Jane Doe' } })
    fireEvent.click(screen.getByText(/I have read and agreed/i).closest('button')!)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Create my account' })).not.toBeDisabled()
    )
  })

  it('Contact step: Create my account disabled with name, consent but invalid phone', async () => {
    render(<GetStarted />)
    await goToStep(6)
    fireEvent.change(screen.getByPlaceholderText('John Smith'), { target: { value: 'Jane Doe' } })
    fireEvent.click(screen.getByText(/I have read and agreed/i).closest('button')!)
    fireEvent.change(screen.getByTestId('phone-local-input'), { target: { value: 'abc' } })
    expect(screen.getByRole('button', { name: 'Create my account' })).toBeDisabled()
  })

  it('Contact step: Create my account enabled with name, consent, and valid phone', async () => {
    render(<GetStarted />)
    await goToStep(6)
    fireEvent.change(screen.getByPlaceholderText('John Smith'), { target: { value: 'Jane Doe' } })
    fireEvent.click(screen.getByText(/I have read and agreed/i).closest('button')!)
    fireEvent.change(screen.getByTestId('phone-local-input'), { target: { value: '7700900123' } })
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Create my account' })).not.toBeDisabled()
    )
  })

  it('Contact step: phone error shown after blur with invalid number', async () => {
    render(<GetStarted />)
    await goToStep(6)
    const phoneInput = screen.getByTestId('phone-local-input')
    fireEvent.change(phoneInput, { target: { value: 'abc' } })
    fireEvent.blur(phoneInput)
    await waitFor(() => expect(screen.getByText(/valid number/i)).toBeInTheDocument())
  })

  it('Contact step: phone error not shown before blur', async () => {
    render(<GetStarted />)
    await goToStep(6)
    fireEvent.change(screen.getByTestId('phone-local-input'), { target: { value: 'bad' } })
    expect(screen.queryByText(/valid number/i)).not.toBeInTheDocument()
  })

  it('Contact step: touched state resets after navigating away and back', async () => {
    render(<GetStarted />)
    await goToStep(6)

    // Trigger phone error
    const phoneInput = screen.getByTestId('phone-local-input')
    fireEvent.change(phoneInput, { target: { value: 'bad' } })
    fireEvent.blur(phoneInput)
    await waitFor(() => screen.getByText(/valid number/i))

    // Go back to timeline
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    await waitFor(() => screen.getByText('When would you like your procedure?'))

    // Return to contact
    clickOption('Within 3 Months')
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() => screen.getByText('Create Your Treatment Passport'))

    // Error should be gone (touched reset)
    expect(screen.queryByText(/valid number/i)).not.toBeInTheDocument()
  })

  // ─── Consent (within contact step) ──────────────────────────────────────────

  it('Consent checkbox toggles when clicked', async () => {
    render(<GetStarted />)
    await goToStep(6)
    const consentBtn = screen.getByText(/I have read and agreed/i).closest('button')!
    // Initially unchecked — Create my account is disabled
    expect(screen.getByRole('button', { name: 'Create my account' })).toBeDisabled()
    // Check
    fireEvent.change(screen.getByPlaceholderText('John Smith'), { target: { value: 'Jane' } })
    fireEvent.click(consentBtn)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Create my account' })).not.toBeDisabled()
    )
    // Uncheck
    fireEvent.click(consentBtn)
    expect(screen.getByRole('button', { name: 'Create my account' })).toBeDisabled()
  })

  // ─── localStorage ───────────────────────────────────────────────────────────

  it('skips the age step when ageTier is already in localStorage', async () => {
    localStorage.setItem('im.qualification', JSON.stringify({ ageTier: '18-24' }))
    render(<GetStarted />)
    // computeVisibleSteps skips steps whose data is already filled, so the
    // age step is excluded and the component starts on the gender step.
    await waitFor(() => {
      expect(screen.getByText('How do you identify?')).toBeInTheDocument()
      expect(screen.queryByText('How old are you?')).not.toBeInTheDocument()
    })
  })

  it('restores norwoodScale from localStorage and skips hair loss step', async () => {
    localStorage.setItem('im.qualification', JSON.stringify({
      ageTier: '25-34',
      gender: 'male',
      norwoodScale: 3,
    }))
    render(<GetStarted />)
    // All three fields are set, so hair_loss step should be skipped
    await waitFor(() => {
      // The hair_loss step should not be visible since norwoodScale is set
      expect(screen.queryByText('What is your Norwood scale?')).not.toBeInTheDocument()
    })
  })
})
