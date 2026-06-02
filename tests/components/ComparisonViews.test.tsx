import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ClinicListItem } from '@/lib/api/clinics'

// ── Shared mocks ─────────────────────────────────────────────────────────────

vi.mock('next/font/google', () => ({
  Merriweather: () => ({ className: 'mocked-merriweather' }),
}))

vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}))

// Stable mock reference so sorting tests can configure searchParams per-test
const { mockGetParam } = vi.hoisted(() => ({
  mockGetParam: vi.fn().mockReturnValue(null),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => ({ get: mockGetParam }),
}))

// Stub out the client-side signals hook — we test score cards (server data) here,
// not the live signal fetch. mockCompareSignals can be overridden per-test.
const { mockCompareSignals } = vi.hoisted(() => ({
  mockCompareSignals: vi.fn((_id: unknown, _name: unknown): { data: unknown; loading: boolean } => ({ data: null, loading: false })),
}))

vi.mock(
  '@/components/istanbulmedic-connect/comparison/useClinicCompareSignals',
  () => ({
    useClinicCompareSignals: (id: unknown, name: unknown) => mockCompareSignals(id, name),
  })
)

vi.mock('@/lib/api/hrn.mock', () => ({
  getMockHRNSignals: vi.fn().mockReturnValue(null),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => null),
}))

// ComparePane calls useAuth() unconditionally (for the consultation button)
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false }),
}))

// BookmarkButton (rendered when a clinic is selected) needs the bookmark context
vi.mock('@/contexts/BookmarkCountContext', () => ({
  useBookmarkCount: () => ({ bookmarkedIds: new Set<string>(), addId: vi.fn(), removeId: vi.fn() }),
}))

// ── Shared fixture ────────────────────────────────────────────────────────────

const baseClinic: ClinicListItem = {
  id: 'clinic-test',
  name: 'Test Clinic',
  location: 'Istanbul, Turkey',
  image: null,
  specialties: ['Hair Transplant'],
  languages: ['English'],
  accreditations: [],
  trustScore: 82,
  trustBand: 'A',
  description: 'A test clinic.',
  rating: 4.7,
  reviewCount: 200,
  googleScore: 8.2,
  redditScore: 7.5,
  hrnScore: 6.9,
  instagramScore: 5.4,
}

const noop = vi.fn()

// ── RedditView ────────────────────────────────────────────────────────────────

describe('RedditView', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the Reddit score from clinic_source_scores', async () => {
    const { RedditView } = await import(
      '@/components/istanbulmedic-connect/comparison/RedditView'
    )
    render(<RedditView clinic={baseClinic} onDeselect={noop} accentClass="text-blue-600" />)
    expect(screen.getByText('7.5')).toBeInTheDocument()
    expect(screen.getByText('/ 10')).toBeInTheDocument()
  })

  it('shows — when redditScore is null', async () => {
    const { RedditView } = await import(
      '@/components/istanbulmedic-connect/comparison/RedditView'
    )
    render(
      <RedditView
        clinic={{ ...baseClinic, redditScore: null }}
        onDeselect={noop}
        accentClass="text-blue-600"
      />
    )
    // The score span should show — not a number
    const scoreSpan = screen.getAllByText('—')[0]
    expect(scoreSpan).toBeInTheDocument()
  })
})

// ── GooglePlacesView ──────────────────────────────────────────────────────────

describe('GooglePlacesView', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the Google score from clinic_source_scores', async () => {
    const { GooglePlacesView } = await import(
      '@/components/istanbulmedic-connect/comparison/GooglePlacesView'
    )
    render(
      <GooglePlacesView clinic={baseClinic} onDeselect={noop} accentClass="text-blue-600" />
    )
    expect(screen.getByText('8.2')).toBeInTheDocument()
  })

  it('also shows the raw Google star rating alongside the score', async () => {
    const { GooglePlacesView } = await import(
      '@/components/istanbulmedic-connect/comparison/GooglePlacesView'
    )
    render(
      <GooglePlacesView clinic={baseClinic} onDeselect={noop} accentClass="text-blue-600" />
    )
    expect(screen.getByText('4.7')).toBeInTheDocument()
  })

  it('shows — when googleScore is null', async () => {
    const { GooglePlacesView } = await import(
      '@/components/istanbulmedic-connect/comparison/GooglePlacesView'
    )
    render(
      <GooglePlacesView
        clinic={{ ...baseClinic, googleScore: null }}
        onDeselect={noop}
        accentClass="text-blue-600"
      />
    )
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })
})

// ── HRNView ───────────────────────────────────────────────────────────────────

describe('HRNView', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the HRN score from clinic_source_scores', async () => {
    const { HRNView } = await import(
      '@/components/istanbulmedic-connect/comparison/HRNView'
    )
    render(<HRNView clinic={baseClinic} onDeselect={noop} accentClass="text-blue-600" />)
    expect(screen.getByText('6.9')).toBeInTheDocument()
  })

  it('shows — when hrnScore is null (no live HRN data, mock flag off)', async () => {
    const { HRNView } = await import(
      '@/components/istanbulmedic-connect/comparison/HRNView'
    )
    render(
      <HRNView
        clinic={{ ...baseClinic, hrnScore: null }}
        onDeselect={noop}
        accentClass="text-blue-600"
      />
    )
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })

  it('falls back to mock hrnScore when clinic.hrnScore is null and mock flag is on', async () => {
    const { getMockHRNSignals } = await import('@/lib/api/hrn.mock')
    vi.mocked(getMockHRNSignals).mockReturnValueOnce({
      clinicName: 'Test Clinic', totalThreads: 10, lastUpdated: '2026-01-01T00:00:00Z',
      photoThreads: 3, longTermFollowups: 2, repairCases: 0,
      sentiment: { positive: 7, mixed: 2, negative: 1 },
      topTopics: ['density'], photoThreadsList: [], allThreads: [],
      hrnScore: 7.8,
    })
    const prev = process.env.NEXT_PUBLIC_USE_MOCK_HRN
    process.env.NEXT_PUBLIC_USE_MOCK_HRN = 'true'
    const { HRNView } = await import('@/components/istanbulmedic-connect/comparison/HRNView')
    render(<HRNView clinic={{ ...baseClinic, hrnScore: null }} onDeselect={noop} accentClass="text-blue-600" />)
    expect(screen.getByText('7.8')).toBeInTheDocument()
    process.env.NEXT_PUBLIC_USE_MOCK_HRN = prev
  })
})

// ── InstagramView ─────────────────────────────────────────────────────────────

describe('InstagramView', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the Instagram score from clinic_source_scores', async () => {
    const { InstagramView } = await import(
      '@/components/istanbulmedic-connect/comparison/InstagramView'
    )
    render(
      <InstagramView clinic={baseClinic} onDeselect={noop} accentClass="text-blue-600" />
    )
    expect(screen.getByText('5.4')).toBeInTheDocument()
  })

  it('shows — when instagramScore is null', async () => {
    const { InstagramView } = await import(
      '@/components/istanbulmedic-connect/comparison/InstagramView'
    )
    render(
      <InstagramView
        clinic={{ ...baseClinic, instagramScore: null }}
        onDeselect={noop}
        accentClass="text-blue-600"
      />
    )
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })
})

// ── AllSourcesView — HRN score fallback ──────────────────────────────────────

describe('AllSourcesView — HRN score fallback', () => {
  beforeEach(() => { vi.clearAllMocks(); mockCompareSignals.mockReset() })

  it('shows hrn score from signals when clinic.hrnScore is null', async () => {
    mockCompareSignals.mockReturnValue({
      data: {
        hrn: { hrnScore: 6.3, totalThreads: 8, photoThreads: 2, longTermFollowups: 1,
               repairCases: 0, sentiment: { positive: 5, mixed: 2, negative: 1 },
               topTopics: [], photoThreadsList: [], allThreads: [],
               clinicName: 'Test Clinic', lastUpdated: '2026-01-01T00:00:00Z' },
        reddit: null, googlePlaces: null, instagram: null, registryRecords: [], extraImages: [],
      },
      loading: false,
    })
    const { AllSourcesView } = await import('@/components/istanbulmedic-connect/comparison/AllSourcesView')
    render(<AllSourcesView clinic={{ ...baseClinic, hrnScore: null }} onDeselect={noop} accentClass="text-blue-600" />)
    expect(screen.getByText('6.3/10')).toBeInTheDocument()
  })
})

// ── Score pill in ClinicRow ───────────────────────────────────────────────────

describe('CompareClinicPage — ClinicRow score pill', () => {
  beforeEach(() => vi.clearAllMocks())

  // Helper: render the page with one clinic and check the pill text
  async function renderRow(clinic: ClinicListItem, source: string) {
    const { CompareClinicPage } = await import(
      '@/components/istanbulmedic-connect/comparison/CompareClinicPage'
    )
    render(<CompareClinicPage clinics={[clinic]} source={source as never} />)
  }

  // CompareClinicPage renders two panes so the same clinic row appears twice —
  // use getAllByText and assert at least one match exists.

  it('shows googleScore /10 on google_places tab', async () => {
    await renderRow(baseClinic, 'google_places')
    expect(screen.getAllByText('8.2').length).toBeGreaterThan(0)
  })

  it('shows redditScore /10 on reddit tab', async () => {
    await renderRow(baseClinic, 'reddit')
    expect(screen.getAllByText('7.5').length).toBeGreaterThan(0)
  })

  it('shows instagramScore /10 on instagram tab', async () => {
    await renderRow(baseClinic, 'instagram')
    expect(screen.getAllByText('5.4').length).toBeGreaterThan(0)
  })

  it('shows — when score is null for the active source', async () => {
    await renderRow({ ...baseClinic, googleScore: null }, 'google_places')
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })
})

// ── Mobile clinic switcher ───────────────────────────────────────────────────

describe('CompareClinicPage — mobile switcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetParam.mockReset()
    mockGetParam.mockReturnValue(null)
  })

  it('lets small-screen users switch between Clinic A and Clinic B panes', async () => {
    const { CompareClinicPage } = await import(
      '@/components/istanbulmedic-connect/comparison/CompareClinicPage'
    )
    render(<CompareClinicPage clinics={[baseClinic]} source="all" />)

    const clinicA = screen.getByRole('button', { name: /switch to clinic a/i })
    const clinicB = screen.getByRole('button', { name: /switch to clinic b/i })

    expect(clinicA).toHaveAttribute('aria-pressed', 'true')
    expect(clinicB).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(clinicB)

    expect(clinicA).toHaveAttribute('aria-pressed', 'false')
    expect(clinicB).toHaveAttribute('aria-pressed', 'true')
  })
})

// ── Sorting ───────────────────────────────────────────────────────────────────

describe('CompareClinicPage — sorting', () => {
  // Three clinics: high score, mid score, null score
  // Names chosen so alphabetical order ≠ score order, making each test meaningful
  const clinicHigh: ClinicListItem = {
    ...baseClinic, id: 'sort-high', name: 'Zeta Clinic',
    googleScore: 9.5, redditScore: 9.0, instagramScore: 8.8,
  }
  const clinicMid: ClinicListItem = {
    ...baseClinic, id: 'sort-mid', name: 'Mira Clinic',
    googleScore: 7.0, redditScore: 7.0, instagramScore: 7.0,
  }
  const clinicNull: ClinicListItem = {
    ...baseClinic, id: 'sort-null', name: 'Aria Clinic',
    googleScore: null, redditScore: null, instagramScore: null,
  }
  const threeClinics = [clinicHigh, clinicMid, clinicNull]

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset any per-test implementation back to "return null for everything"
    mockGetParam.mockReset()
    mockGetParam.mockReturnValue(null)
  })

  // Helper: returns textContent of all <button> elements whose text includes "Clinic".
  // CompareClinicPage renders two identical panes so each clinic appears twice;
  // findIndex on this list gives the first occurrence (Pane A), which is sufficient
  // to verify order.
  function getClinicButtonTexts(container: HTMLElement): string[] {
    return Array.from(container.querySelectorAll('button'))
      .map(b => b.textContent ?? '')
      .filter(t => t.includes('Clinic'))
  }

  it('Highest Rated puts highest score first and null score last (google_places)', async () => {
    mockGetParam.mockImplementation((key: string) =>
      key === 'sort' ? 'highest' : null
    )
    const { CompareClinicPage } = await import(
      '@/components/istanbulmedic-connect/comparison/CompareClinicPage'
    )
    const { container } = render(
      <CompareClinicPage clinics={threeClinics} source="google_places" />
    )
    const texts = getClinicButtonTexts(container)
    const zetaIdx = texts.findIndex(t => t.includes('Zeta')) // 9.5
    const miraIdx = texts.findIndex(t => t.includes('Mira')) // 7.0
    const ariaIdx = texts.findIndex(t => t.includes('Aria')) // null → treated as 0
    expect(zetaIdx).toBeLessThan(miraIdx) // 9.5 before 7.0
    expect(miraIdx).toBeLessThan(ariaIdx) // 7.0 before null
  })

  it('Lowest Rated puts null score first and highest score last (google_places)', async () => {
    mockGetParam.mockImplementation((key: string) =>
      key === 'sort' ? 'lowest' : null
    )
    const { CompareClinicPage } = await import(
      '@/components/istanbulmedic-connect/comparison/CompareClinicPage'
    )
    const { container } = render(
      <CompareClinicPage clinics={threeClinics} source="google_places" />
    )
    const texts = getClinicButtonTexts(container)
    const zetaIdx = texts.findIndex(t => t.includes('Zeta')) // 9.5
    const miraIdx = texts.findIndex(t => t.includes('Mira')) // 7.0
    const ariaIdx = texts.findIndex(t => t.includes('Aria')) // null → treated as 0
    expect(ariaIdx).toBeLessThan(miraIdx) // null before 7.0
    expect(miraIdx).toBeLessThan(zetaIdx) // 7.0 before 9.5
  })

  it('Alphabetical sorts by name regardless of score (google_places)', async () => {
    // mockGetParam returns null for all keys → sortBy initialises as "Alphabetical"
    const { CompareClinicPage } = await import(
      '@/components/istanbulmedic-connect/comparison/CompareClinicPage'
    )
    const { container } = render(
      <CompareClinicPage clinics={threeClinics} source="google_places" />
    )
    const texts = getClinicButtonTexts(container)
    const zetaIdx = texts.findIndex(t => t.includes('Zeta'))
    const miraIdx = texts.findIndex(t => t.includes('Mira'))
    const ariaIdx = texts.findIndex(t => t.includes('Aria'))
    expect(ariaIdx).toBeLessThan(miraIdx) // "Aria" < "Mira"
    expect(miraIdx).toBeLessThan(zetaIdx) // "Mira" < "Zeta"
  })
})
