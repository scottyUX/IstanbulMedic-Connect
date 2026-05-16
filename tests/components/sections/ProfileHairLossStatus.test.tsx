import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

vi.mock('next/font/google', () => ({
  Merriweather: () => ({ className: 'mock-merriweather', style: {} }),
}))

import ProfileHairLossStatus from '@/components/istanbulmedic-connect/user-profile/sections/ProfileHairLossStatus'

const DEFAULT_TREATMENT = {
  success: true,
  data: {
    norwoodScale: 3,
    durationYears: 1,
    donorAreaQuality: 'good',
    donorAreaAvailability: 'adequate',
    desiredDensity: 'medium',
  },
}

function setupFetch(treatData: { success: boolean; data: Record<string, unknown> | null } = DEFAULT_TREATMENT, saveOk = true) {
  global.fetch = vi.fn().mockImplementation((_url: string, opts?: RequestInit) => {
    if (opts?.method === 'POST') {
      return Promise.resolve({
        ok: saveOk,
        json: async () => saveOk ? { success: true } : { success: false, error: 'Save failed' },
      })
    }
    return Promise.resolve({ ok: true, json: async () => treatData })
  })
}

/** Render and flush initial data fetch so assertions don't need waitFor. */
async function renderLoaded(treatData?: { success: boolean; data: Record<string, unknown> | null }) {
  setupFetch(treatData)
  await act(async () => { render(<ProfileHairLossStatus />) })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProfileHairLossStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  // ─── Loading state ──────────────────────────────────────────────────────────

  it('shows loading skeleton before data arrives', () => {
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}))
    const { container } = render(<ProfileHairLossStatus />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  // ─── Data loading ───────────────────────────────────────────────────────────

  it('renders all 7 Norwood stage options', async () => {
    await renderLoaded()
    expect(screen.getByText(/Stage 1 – Minimal or no recession/)).toBeInTheDocument()
    expect(screen.getByText(/Stage 7 – Most extensive pattern/)).toBeInTheDocument()
  })

  it('renders all 5 duration options', async () => {
    await renderLoaded()
    expect(screen.getByText('Less than 1 year')).toBeInTheDocument()
    expect(screen.getByText('10+ years')).toBeInTheDocument()
  })

  it('marks the loaded norwood stage as selected', async () => {
    await renderLoaded() // norwoodScale: 3
    const stage3Btn = screen.getByText(/Stage 3 – Deepening temples/).closest('button')!
    expect(stage3Btn.className).toContain('border-[#17375B]')
  })

  it('marks the loaded duration as selected', async () => {
    await renderLoaded() // durationYears: 1
    const durationBtn = screen.getByText('1–3 years').closest('button')!
    expect(durationBtn.className).toContain('border-[#17375B]')
  })

  it('unselected stages use muted text color', async () => {
    await renderLoaded() // norwoodScale: 3 — stages 1,2,4-7 are unselected
    const stage1 = screen.getByText(/Stage 1 – Minimal or no recession/)
    expect(stage1.className).toContain('text-muted-foreground')
  })

  // ─── Autosave on selection ──────────────────────────────────────────────────

  it('triggers a POST to /api/profile/treatment when a norwood stage is clicked', async () => {
    await renderLoaded()

    fireEvent.click(screen.getByText(/Stage 4 – Significant crown thinning/).closest('button')!)
    act(() => { vi.advanceTimersByTime(900) })

    const fetchMock = global.fetch as ReturnType<typeof vi.fn>
    const postCalls = fetchMock.mock.calls.filter(([, opts]) => opts?.method === 'POST')
    expect(postCalls.length).toBeGreaterThanOrEqual(1)
    const body = JSON.parse(postCalls[0][1].body)
    expect(body.norwoodScale).toBe(4)
  })

  it('triggers a POST when a duration is clicked', async () => {
    await renderLoaded()

    fireEvent.click(screen.getByText('5–10 years').closest('button')!)
    act(() => { vi.advanceTimersByTime(900) })

    const fetchMock = global.fetch as ReturnType<typeof vi.fn>
    const postCalls = fetchMock.mock.calls.filter(([, opts]) => opts?.method === 'POST')
    expect(postCalls.length).toBeGreaterThanOrEqual(1)
    const body = JSON.parse(postCalls[0][1].body)
    expect(body.durationYears).toBe(5)
  })

  // ─── Save states ────────────────────────────────────────────────────────────

  it('shows "Saving…" then "Saved" after successful save', async () => {
    await renderLoaded()

    fireEvent.click(screen.getByText(/Stage 2 – Minor temple recession/).closest('button')!)

    // Sync act: fires the debounce and flushes saving=true state
    act(() => { vi.advanceTimersByTime(900) })
    expect(screen.getByText(/Saving/i)).toBeInTheDocument()

    // Async act: resolves the fetch promise and flushes saved=true state
    await act(async () => {})
    expect(screen.getByText(/Saved/i)).toBeInTheDocument()
  })

  it('shows "Save failed" on error response', async () => {
    setupFetch(DEFAULT_TREATMENT, false)
    await act(async () => { render(<ProfileHairLossStatus />) })

    fireEvent.click(screen.getByText(/Stage 5 – Moderate to significant loss/).closest('button')!)

    act(() => { vi.advanceTimersByTime(900) })
    await act(async () => {})
    expect(screen.getByText(/Save failed/i)).toBeInTheDocument()
  })

  // ─── Empty state ─────────────────────────────────────────────────────────────

  it('renders all options without any pre-selection when DB returns null', async () => {
    await renderLoaded({ success: true, data: null })
    screen.getAllByRole('radio', { name: /Stage \d/ }).forEach((btn) => {
      // Split into individual classes to avoid matching hover:border-[#17375B]/40 as a false positive
      expect(btn.className.split(' ')).not.toContain('border-[#17375B]')
    })
  })
})
