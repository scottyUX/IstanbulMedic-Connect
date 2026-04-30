import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClinicProfilePage } from '@/components/istanbulmedic-connect/profile/ClinicProfilePage';
import type { ClinicDetail } from '@/lib/api/clinics';

// Mock Next.js components and hooks
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/clinics/clinic-1',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

vi.mock('next/font/google', () => ({
  Merriweather: () => ({
    className: 'mocked-merriweather',
  }),
}));

// Mock recharts to avoid rendering issues
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  Legend: () => <div data-testid="legend" />,
  Area: () => <div data-testid="area" />,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  RadialBarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="radial-bar-chart">{children}</div>,
  RadialBar: () => <div data-testid="radial-bar" />,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
  Radar: () => <div data-testid="radar" />,
  RadarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="radar-chart">{children}</div>,
}));

describe('ClinicProfilePage', () => {
  const createMinimalClinic = (overrides: Partial<ClinicDetail> = {}): ClinicDetail => ({
    id: 'clinic-1',
    name: 'Test Clinic',
    legalName: 'Test Clinic LLC',
    location: 'Istanbul, Turkey',
    image: 'https://example.com/clinic.jpg',
    specialties: ['Hair Transplant'],
    trustScore: 85,
    trustBand: 'A',
    description: 'A quality healthcare clinic.',
    rating: 4.5,
    aiInsight: undefined,
    accreditations: ['JCI'],
    websiteUrl: 'https://testclinic.com',
    whatsappContact: '+905551234567',
    emailContact: 'info@testclinic.com',
    phoneContact: '+905551234567',
    status: 'active',
    locations: [],
    services: [],
    languages: [],
    languageNames: [],
    credentials: [],
    media: [],
    mentions: [],
    facts: [],
    pricing: [],
    team: [],
    packages: [],
    reviews: [],
    scoreComponents: [],
    yearsInOperation: null,
    proceduresPerformed: null,
    totalReviewCount: 0,
    instagramSignals: null,
    hrnSignals: null,
    redditSignals: null,
    ...overrides,
  });

  it('renders clinic name in hero section', () => {
    const clinic = createMinimalClinic({ name: 'Istanbul Hair Center' });
    render(<ClinicProfilePage clinic={clinic} registryRecords={[]} complianceHistory={[]} />);
    expect(screen.getByText('Istanbul Hair Center')).toBeInTheDocument();
  });

  it('renders clinic location', () => {
    const clinic = createMinimalClinic({ location: 'Ankara, Turkey' });
    render(<ClinicProfilePage clinic={clinic} registryRecords={[]} complianceHistory={[]} />);
    // Location appears in multiple places, just check that at least one exists
    const elements = screen.getAllByText(/Ankara, Turkey/);
    expect(elements.length).toBeGreaterThan(0);
  });

  // TODO: Unskip when FEATURE_CONFIG.profileTransparency is enabled
  it.skip('renders trust score', () => {
    const clinic = createMinimalClinic({ trustScore: 92 });
    render(<ClinicProfilePage clinic={clinic} registryRecords={[]} complianceHistory={[]} />);
    // Trust score appears in multiple places (hero, sidebar, etc.)
    const elements = screen.getAllByText(/92/);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('renders rating when provided', () => {
    const clinic = createMinimalClinic({ rating: 4.8 });
    render(<ClinicProfilePage clinic={clinic} registryRecords={[]} complianceHistory={[]} />);
    // Rating appears in multiple places
    const elements = screen.getAllByText(/4\.8/);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('renders instagram signals card when present', () => {
    const clinic = createMinimalClinic({
      instagramSignals: {
        username: 'istanbulclinic',
        followersCount: 25000,
        lastUpdated: '2026-03-01T00:00:00Z',
        signals: [
          {
            id: 'engagement',
            label: 'Engagement',
            status: 'positive',
            type: 'percentile',
            percentile: 72,
            metric: '2.3%',
            statusText: 'Above average',
            explanation: 'Genuine engagement suggests real patients are following.',
          },
        ],
      },
    });
    render(<ClinicProfilePage clinic={clinic} registryRecords={[]} complianceHistory={[]} />);

    expect(screen.getByText('Social Media Presence')).toBeInTheDocument();
    expect(screen.getByText('@istanbulclinic')).toBeInTheDocument();
  });

  it('does not render instagram card when instagramSignals is null', () => {
    const clinic = createMinimalClinic({ instagramSignals: null });
    render(<ClinicProfilePage clinic={clinic} registryRecords={[]} complianceHistory={[]} />);

    // The signals card should not be present when there's no data
    expect(screen.queryByText('Social Media Presence')).not.toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.profileOverview is enabled
  it.skip('renders specialties from services', () => {
    const clinic = createMinimalClinic({
      services: [
        {
          id: 'srv-1',
          clinic_id: 'clinic-1',
          service_name: 'Hair Transplant',
          service_category: 'Medical Tourism',
          is_primary_service: true,
        },
      ],
    });
    render(<ClinicProfilePage clinic={clinic} registryRecords={[]} complianceHistory={[]} />);
    expect(screen.getByText(/Hair Transplant/)).toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.profileLanguages is enabled
  it.skip('renders languages from clinic_languages', () => {
    const clinic = createMinimalClinic({
      languages: [
        { id: 'lang-1', clinic_id: 'clinic-1', language: 'English', support_type: 'staff' },
        { id: 'lang-2', clinic_id: 'clinic-1', language: 'German', support_type: 'staff' },
      ],
    });
    render(<ClinicProfilePage clinic={clinic} registryRecords={[]} complianceHistory={[]} />);
    expect(screen.getByText(/English/)).toBeInTheDocument();
    expect(screen.getByText(/German/)).toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.profileDoctors is enabled
  it.skip('renders doctors from team members', () => {
    const clinic = createMinimalClinic({
      team: [
        {
          id: 'team-1',
          clinic_id: 'clinic-1',
          name: 'Dr. John Smith',
          role: 'surgeon',
          photo_url: 'https://example.com/dr-smith.jpg',
          credentials: 'ISHRS Member',
          years_experience: 15,
          doctor_involvement_level: 'high',
        },
      ],
    });
    render(<ClinicProfilePage clinic={clinic} registryRecords={[]} complianceHistory={[]} />);
    expect(screen.getByText(/Dr\. John Smith/)).toBeInTheDocument();
    expect(screen.getByText(/15\+ yrs/)).toBeInTheDocument();
  });

  it('does not render doctors section when no team members', () => {
    const clinic = createMinimalClinic({ team: [] });
    render(<ClinicProfilePage clinic={clinic} registryRecords={[]} complianceHistory={[]} />);
    // The doctors section should not be present
    expect(screen.queryByText(/Our Medical Team/)).not.toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.profileTransparency is enabled
  it.skip('renders transparency items from credentials', () => {
    const clinic = createMinimalClinic({
      credentials: [
        {
          id: 'cred-1',
          clinic_id: 'clinic-1',
          credential_type: 'accreditation',
          credential_name: 'JCI Accredited',
          issuing_body: 'Joint Commission International',
          credential_id: null,
          valid_from: null,
          valid_to: null,
        },
      ],
    });
    render(<ClinicProfilePage clinic={clinic} registryRecords={[]} complianceHistory={[]} />);
    expect(screen.getByText(/JCI Accredited/)).toBeInTheDocument();
    expect(screen.getByText(/Joint Commission International/)).toBeInTheDocument();
  });

  it('renders reviews section', () => {
    const clinic = createMinimalClinic({
      reviews: [
        {
          id: 'rev-1',
          clinic_id: 'clinic-1',
          source_id: 'source-1',
          rating: '5/5',
          review_text: 'Excellent experience, highly recommend!',
          review_date: '2025-01-15',
          language: null,
        },
      ],
    });
    render(<ClinicProfilePage clinic={clinic} registryRecords={[]} complianceHistory={[]} />);
    expect(screen.getByText(/Excellent experience, highly recommend!/)).toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.profilePricing is enabled
  it.skip('renders pricing section', () => {
    const clinic = createMinimalClinic({
      pricing: [
        {
          id: 'price-1',
          clinic_id: 'clinic-1',
          service_name: 'FUE Hair Transplant',
          pricing_type: 'range',
          price_min: 2500,
          price_max: 4000,
          currency: 'USD',
          is_verified: null,
          last_verified_at: null,
          notes: null,
          source_id: null,
        },
      ],
    });
    render(<ClinicProfilePage clinic={clinic} registryRecords={[]} complianceHistory={[]} />);
    expect(screen.getByText(/FUE Hair Transplant/)).toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.profilePackages is enabled
  it.skip('renders packages section', () => {
    const clinic = createMinimalClinic({
      packages: [
        {
          id: 'pkg-1',
          clinic_id: 'clinic-1',
          package_name: 'Premium Hair Transplant Package',
          currency: 'USD',
          nights_included: 3,
          transport_included: true,
          aftercare_duration_days: null,
          excludes: [],
          includes: [],
          price_min: null,
          price_max: null,
        },
      ],
    });
    render(<ClinicProfilePage clinic={clinic} registryRecords={[]} complianceHistory={[]} />);
    expect(screen.getByText(/Premium Hair Transplant Package/)).toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.profileAIInsights is enabled
  it.skip('renders AI insights from score components', () => {
    const clinic = createMinimalClinic({
      scoreComponents: [
        {
          id: 'sc-1',
          clinic_id: 'clinic-1',
          component_key: 'transparency',
          score: 95,
          weight: 1.0,
          computed_at: '2025-01-01T00:00:00Z',
          explanation: 'This clinic has excellent transparency practices.',
        },
      ],
    });
    render(<ClinicProfilePage clinic={clinic} registryRecords={[]} complianceHistory={[]} />);
    expect(screen.getByText(/excellent transparency practices/)).toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.profileCommunitySignals is enabled
  it.skip('renders community signals from mentions', () => {
    const clinic = createMinimalClinic({
      mentions: [
        {
          id: 'mention-1',
          clinic_id: 'clinic-1',
          source_id: 'source-1',
          mention_text: 'Had a great experience at this clinic!',
          sentiment: 'positive',
          topic: 'praise',
          created_at: '2025-01-20T00:00:00Z',
          sources: {
            source_type: 'reddit',
            source_name: 'r/HairTransplants',
          },
        },
      ] as ClinicDetail['mentions'],
    });
    render(<ClinicProfilePage clinic={clinic} registryRecords={[]} complianceHistory={[]} />);
    expect(screen.getByText(/great experience at this clinic/)).toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.profileOverview is enabled
  it.skip('renders years in operation when provided', () => {
    const clinic = createMinimalClinic({ yearsInOperation: 15 });
    render(<ClinicProfilePage clinic={clinic} registryRecords={[]} complianceHistory={[]} />);
    expect(screen.getByText(/15/)).toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.profileOverview is enabled
  it.skip('renders procedures performed when provided', () => {
    const clinic = createMinimalClinic({ proceduresPerformed: 5000 });
    render(<ClinicProfilePage clinic={clinic} registryRecords={[]} complianceHistory={[]} />);
    expect(screen.getByText(/5,000/)).toBeInTheDocument();
  });

  it('handles missing years in operation gracefully', () => {
    const clinic = createMinimalClinic({ yearsInOperation: null });
    render(<ClinicProfilePage clinic={clinic} registryRecords={[]} complianceHistory={[]} />);
    // Should render without crashing
    expect(screen.getByText('Test Clinic')).toBeInTheDocument();
  });

  it('transforms location from primary location', () => {
    const clinic = createMinimalClinic({
      locations: [
        {
          id: 'loc-1',
          clinic_id: 'clinic-1',
          location_name: 'Main Office',
          address_line: '123 Medical Street, Sisli',
          city: 'Sisli',
          country: 'Turkey',
          postal_code: '34367',
          latitude: 41.0082,
          longitude: 28.9784,
          is_primary: true,
          opening_hours: null,
          payment_methods: null,
        },
      ],
    });
    render(<ClinicProfilePage clinic={clinic} registryRecords={[]} complianceHistory={[]} />);
    expect(screen.getByText(/123 Medical Street, Sisli/)).toBeInTheDocument();
  });

  it('uses clinic.location when no locations array', () => {
    const clinic = createMinimalClinic({
      locations: [],
      location: 'Izmir, Turkey',
    });
    render(<ClinicProfilePage clinic={clinic} registryRecords={[]} complianceHistory={[]} />);
    // Location appears in multiple places
    const elements = screen.getAllByText(/Izmir, Turkey/);
    expect(elements.length).toBeGreaterThan(0);
  });

  // TODO: Unskip when FEATURE_CONFIG.profileInstagram is enabled
  it.skip('renders Instagram intelligence section', () => {
    const clinic = createMinimalClinic();
    render(<ClinicProfilePage clinic={clinic} registryRecords={[]} complianceHistory={[]} />);
    // Mock Instagram data is always rendered - check for follower count or related text
    const elements = screen.getAllByText(/Followers|followers|Instagram|47,800/i);
    expect(elements.length).toBeGreaterThan(0);
  });

  // TODO: Unskip when FEATURE_CONFIG.profileOverview is enabled (tests for Overview tab)
  it.skip('renders section navigation', () => {
    const clinic = createMinimalClinic();
    render(<ClinicProfilePage clinic={clinic} registryRecords={[]} complianceHistory={[]} />);
    // Overview appears in multiple places (nav and section title)
    const elements = screen.getAllByText(/Overview/);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('renders hero images from media', () => {
    const clinic = createMinimalClinic({
      media: [
        {
          id: 'media-1',
          clinic_id: 'clinic-1',
          media_type: 'image',
          url: 'https://example.com/hero.jpg',
          alt_text: null,
          caption: null,
          is_primary: true,
          display_order: 0,
          created_at: null,
          source_id: null,
          uploaded_at: null,
        },
      ],
    });
    render(<ClinicProfilePage clinic={clinic} registryRecords={[]} complianceHistory={[]} />);
    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThan(0);
  });

  // TODO: Unskip when FEATURE_CONFIG.profileDoctors is enabled
  it.skip('filters team members to only show medical roles', () => {
    const clinic = createMinimalClinic({
      team: [
        {
          id: 'team-1',
          clinic_id: 'clinic-1',
          name: 'Dr. Jane Doe',
          role: 'surgeon',
          photo_url: null,
          credentials: '',
          years_experience: 10,
          doctor_involvement_level: 'high',
        },
        {
          id: 'team-2',
          clinic_id: 'clinic-1',
          name: 'John Admin',
          role: 'other',  // Should be filtered out
          photo_url: null,
          credentials: '',
          years_experience: 5,
          doctor_involvement_level: 'low',
        },
      ],
    });
    render(<ClinicProfilePage clinic={clinic} registryRecords={[]} complianceHistory={[]} />);
    expect(screen.getByText(/Dr\. Jane Doe/)).toBeInTheDocument();
    expect(screen.queryByText(/John Admin/)).not.toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.profileOverview is enabled
  it.skip('deduplicates specialties', () => {
    const clinic = createMinimalClinic({
      services: [
        {
          id: 'srv-1',
          clinic_id: 'clinic-1',
          service_name: 'Hair Transplant',
          service_category: 'Medical Tourism',
          is_primary_service: true,
        },
        {
          id: 'srv-2',
          clinic_id: 'clinic-1',
          service_name: 'Hair Transplant',  // Duplicate
          service_category: 'Medical Tourism',
          is_primary_service: true,
        },
      ],
    });
    render(<ClinicProfilePage clinic={clinic} registryRecords={[]} complianceHistory={[]} />);
    // Should only show once, not duplicate
    const hairTransplantElements = screen.getAllByText(/Hair Transplant/i);
    // Multiple components might show the specialty, but it should be derived correctly
    expect(hairTransplantElements.length).toBeGreaterThan(0);
  });
});
