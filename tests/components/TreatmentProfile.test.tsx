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

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => null),
}))

vi.mock('@/components/ui/container', () => ({
  default: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => <div {...(props as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>,
}))

import { TreatmentProfile } from '@/components/istanbulmedic-connect/user-profile/TreatmentProfile'

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Options with sub-text have accessible names that include the sub-text,
// so we use regex partial matching.
const clickOption = (label: string) =>
  fireEvent.click(screen.getByRole('button', { name: new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }))

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TreatmentProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    global.fetch = vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) })
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
    URL.createObjectURL = vi.fn(() => 'blob:mock')
    URL.revokeObjectURL = vi.fn()
  })

  // Navigate through n steps. For steps 0–5 (required), selects a valid option.
  // For steps 6–10 (optional), clicks Continue without selecting anything.
  async function goToStep(n: number) {
    const actions: Array<() => void> = [
      () => clickOption('Stage 3'),                              // 0 → norwood
      () => clickOption('1 – 2 years'),                         // 1 → duration
      () => clickOption('Excellent'),                            // 2 → donor_quality
      () => clickOption('Good availability'),                    // 3 → donor_availability
      () => clickOption('Maximum density'),                      // 4 → density
      () => clickOption('No, this would be my first'),           // 5 → prior_transplants
      () => {},                                                  // 6 → photos (optional)
      () => {},                                                  // 7 → allergies (optional)
      () => {},                                                  // 8 → medications (optional)
      () => {},                                                  // 9 → prior_surgeries (optional)
    ]

    const nextTitles = [
      'How long have you been experiencing hair loss?',
      'How would you describe your donor area quality?',
      'How available is your donor area?',
      'What level of coverage are you hoping to achieve?',
      'Have you had a hair transplant before?',
      'Upload photos of your hair',
      'Do you have any known allergies?',
      'Are you currently taking any medications?',
      'Have you had any prior surgeries?',
      'Any other relevant medical conditions?',
    ]

    for (let i = 0; i < n; i++) {
      actions[i]()
      fireEvent.click(screen.getByRole('button', { name: /Continue|Save & continue/i }))
      await waitFor(() => screen.getByText(nextTitles[i]))
    }
  }

  // ─── Rendering ─────────────────────────────────────────────────────────────

  it('renders the norwood step on initial mount', () => {
    render(<TreatmentProfile />)
    expect(screen.getByText('What best describes your current hair loss?')).toBeInTheDocument()
  })

  it('shows Step 1 of 11 on initial render', () => {
    render(<TreatmentProfile />)
    expect(screen.getByText(/Step 1 of 11/)).toBeInTheDocument()
  })

  it('renders all norwood stage options', () => {
    render(<TreatmentProfile />)
    expect(screen.getByText('Stage 1')).toBeInTheDocument()
    expect(screen.getByText('Stage 7')).toBeInTheDocument()
  })

  // ─── Continue button state ──────────────────────────────────────────────────

  it('Continue is disabled with no norwood stage selected', () => {
    render(<TreatmentProfile />)
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
  })

  it('Continue is enabled after selecting Stage 3', () => {
    render(<TreatmentProfile />)
    clickOption('Stage 3')
    expect(screen.getByRole('button', { name: 'Continue' })).not.toBeDisabled()
  })

  // ─── Step navigation ────────────────────────────────────────────────────────

  it('advances to the duration step after norwood selection and Continue', async () => {
    render(<TreatmentProfile />)
    clickOption('Stage 3')
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() =>
      expect(screen.getByText('How long have you been experiencing hair loss?')).toBeInTheDocument()
    )
  })

  it('Back on step 0 calls router.push with /profile', async () => {
    const { useRouter } = await import('next/navigation')
    const router = useRouter()
    render(<TreatmentProfile />)
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(router.push).toHaveBeenCalledWith('/profile')
  })

  it('Back from step 1 returns to step 0', async () => {
    render(<TreatmentProfile />)
    clickOption('Stage 3')
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() => screen.getByText('How long have you been experiencing hair loss?'))
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    await waitFor(() =>
      expect(screen.getByText('What best describes your current hair loss?')).toBeInTheDocument()
    )
  })

  it('Continue is disabled at donor_quality step before selection', async () => {
    render(<TreatmentProfile />)
    clickOption('Stage 3')
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() => screen.getByText('How long have you been experiencing hair loss?'))
    clickOption('1 – 2 years')
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() => screen.getByText('How would you describe your donor area quality?'))
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
  })

  // ─── Prior transplants step ────────────────────────────────────────────────

  it('Prior transplants: Continue is disabled when nothing is selected', async () => {
    render(<TreatmentProfile />)
    await goToStep(5)
    await waitFor(() => screen.getByText('Have you had a hair transplant before?'))
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
  })

  it('Prior transplants: selecting No enables Continue', async () => {
    render(<TreatmentProfile />)
    await goToStep(5)
    await waitFor(() => screen.getByText('Have you had a hair transplant before?'))
    clickOption('No, this would be my first')
    expect(screen.getByRole('button', { name: 'Continue' })).not.toBeDisabled()
  })

  it('Prior transplants: selecting Yes enables Continue and shows add-procedure form', async () => {
    render(<TreatmentProfile />)
    await goToStep(5)
    await waitFor(() => screen.getByText('Have you had a hair transplant before?'))
    clickOption("Yes, I've had a transplant before")
    expect(screen.getByRole('button', { name: 'Continue' })).not.toBeDisabled()
    expect(screen.getByPlaceholderText('e.g. 2019')).toBeInTheDocument()
  })

  it('Prior transplants: can add a transplant entry', async () => {
    render(<TreatmentProfile />)
    await goToStep(5)
    await waitFor(() => screen.getByText('Have you had a hair transplant before?'))
    clickOption("Yes, I've had a transplant before")
    fireEvent.change(screen.getByPlaceholderText('e.g. 2019'), { target: { value: '2020' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 2500'), { target: { value: '2500' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. Turkey'), { target: { value: 'Turkey' } })
    fireEvent.click(screen.getByRole('button', { name: /Add procedure/i }))
    await waitFor(() => expect(screen.getByText(/Turkey.*2020|2020/)).toBeInTheDocument())
  })

  // ─── Photos step ───────────────────────────────────────────────────────────

  it('Photos step: Continue is enabled with no photos uploaded (optional)', async () => {
    render(<TreatmentProfile />)
    await goToStep(6)
    await waitFor(() => screen.getByText('Upload photos of your hair'))
    expect(screen.getByRole('button', { name: 'Continue' })).not.toBeDisabled()
  })

  // ─── Allergies step ─────────────────────────────────────────────────────────

  it('Allergies step: Continue is enabled with no input (optional)', async () => {
    render(<TreatmentProfile />)
    await goToStep(7)
    await waitFor(() => screen.getByText('Do you have any known allergies?'))
    expect(screen.getByRole('button', { name: 'Continue' })).not.toBeDisabled()
  })

  it('Allergies step: Add button is disabled when input is empty', async () => {
    render(<TreatmentProfile />)
    await goToStep(7)
    await waitFor(() => screen.getByText('Do you have any known allergies?'))
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()
  })

  it('Allergies step: typing and clicking Add adds the tag', async () => {
    render(<TreatmentProfile />)
    await goToStep(7)
    await waitFor(() => screen.getByText('Do you have any known allergies?'))
    fireEvent.change(screen.getByPlaceholderText(/Penicillin/), { target: { value: 'Penicillin' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    await waitFor(() => expect(screen.getByText('Penicillin')).toBeInTheDocument())
  })

  it('Allergies step: an added tag can be removed', async () => {
    render(<TreatmentProfile />)
    await goToStep(7)
    await waitFor(() => screen.getByText('Do you have any known allergies?'))
    fireEvent.change(screen.getByPlaceholderText(/Penicillin/), { target: { value: 'Penicillin' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    await waitFor(() => screen.getByText('Penicillin'))
    fireEvent.click(screen.getByRole('button', { name: 'Remove Penicillin' }))
    await waitFor(() => expect(screen.queryByText('Penicillin')).not.toBeInTheDocument())
  })

  // ─── Medications step ───────────────────────────────────────────────────────

  it('Medications step: can add a medication', async () => {
    render(<TreatmentProfile />)
    await goToStep(8)
    await waitFor(() => screen.getByText('Are you currently taking any medications?'))
    fireEvent.change(screen.getByPlaceholderText(/Finasteride/), { target: { value: 'Finasteride' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    await waitFor(() => expect(screen.getByText('Finasteride')).toBeInTheDocument())
  })

  // ─── Prior surgeries step ───────────────────────────────────────────────────

  it('Prior surgeries: Add surgery button disabled until type and year are filled', async () => {
    render(<TreatmentProfile />)
    await goToStep(9)
    await waitFor(() => screen.getByText('Have you had any prior surgeries?'))
    const addBtn = screen.getByRole('button', { name: /Add surgery/i })
    expect(addBtn).toBeDisabled()
    fireEvent.change(screen.getByPlaceholderText('e.g. Appendectomy'), { target: { value: 'Appendectomy' } })
    expect(addBtn).toBeDisabled()
    fireEvent.change(screen.getByPlaceholderText('e.g. 2015'), { target: { value: '2015' } })
    expect(addBtn).not.toBeDisabled()
  })

  it('Prior surgeries: can add a surgery entry', async () => {
    render(<TreatmentProfile />)
    await goToStep(9)
    await waitFor(() => screen.getByText('Have you had any prior surgeries?'))
    fireEvent.change(screen.getByPlaceholderText('e.g. Appendectomy'), { target: { value: 'Appendectomy' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 2015'), { target: { value: '2015' } })
    fireEvent.click(screen.getByRole('button', { name: /Add surgery/i }))
    await waitFor(() => expect(screen.getByText(/Appendectomy/)).toBeInTheDocument())
  })

  // ─── Medical conditions step ────────────────────────────────────────────────

  it('Medical conditions step: can add a condition', async () => {
    render(<TreatmentProfile />)
    await goToStep(10)
    await waitFor(() => screen.getByText('Any other relevant medical conditions?'))
    fireEvent.change(screen.getByPlaceholderText(/Diabetes/), { target: { value: 'Diabetes' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    await waitFor(() => expect(screen.getByText('Diabetes')).toBeInTheDocument())
  })
})
