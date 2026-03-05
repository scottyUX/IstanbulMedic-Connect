import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PackagesSection } from '@/components/istanbulmedic-connect/profile/PackagesSection';
import type { ClinicDetail } from '@/lib/api/clinics';

type PackageRow = ClinicDetail['packages'][number];

describe('PackagesSection', () => {
  const createPackage = (overrides: Partial<PackageRow> = {}): PackageRow => ({
    id: 'pkg-1',
    clinic_id: 'clinic-1',
    package_name: 'Standard Hair Transplant Package',
    price_min: 2500,
    price_max: 3500,
    currency: 'USD',
    nights_included: 3,
    transport_included: true,
    aftercare_duration_days: 14,
    includes: ['FUE procedure', 'PRP treatment', 'Medications'],
    excludes: ['Flights', 'Travel insurance'],
    created_at: null,
    updated_at: null,
    ...overrides,
  } as PackageRow);

  it('renders section title', () => {
    render(<PackagesSection packages={[]} />);
    expect(screen.getByText('Packages')).toBeInTheDocument();
  });

  it('renders section description', () => {
    render(<PackagesSection packages={[]} />);
    expect(screen.getByText(/Structured packages with inclusions/)).toBeInTheDocument();
  });

  it('shows empty state when no packages', () => {
    render(<PackagesSection packages={[]} />);
    expect(screen.getByText(/Package details are not available yet/)).toBeInTheDocument();
  });

  it('renders package name', () => {
    const packages = [createPackage({ package_name: 'Premium VIP Package' })];
    render(<PackagesSection packages={packages} />);
    expect(screen.getByText('Premium VIP Package')).toBeInTheDocument();
  });

  it('formats price range correctly with USD', () => {
    const packages = [createPackage({ price_min: 2500, price_max: 3500, currency: 'USD' })];
    render(<PackagesSection packages={packages} />);
    expect(screen.getByText('$2,500 - $3,500')).toBeInTheDocument();
  });

  it('formats fixed price when min equals max', () => {
    const packages = [createPackage({ price_min: 3000, price_max: 3000, currency: 'USD' })];
    render(<PackagesSection packages={packages} />);
    expect(screen.getByText('$3,000')).toBeInTheDocument();
  });

  it('shows pricing upon request when no prices', () => {
    const packages = [createPackage({ price_min: null, price_max: null })];
    render(<PackagesSection packages={packages} />);
    expect(screen.getByText('Pricing upon request')).toBeInTheDocument();
  });

  it('handles EUR currency', () => {
    const packages = [createPackage({ price_min: 2000, price_max: 3000, currency: 'EUR' })];
    render(<PackagesSection packages={packages} />);
    expect(screen.getByText(/€2,000.*€3,000/)).toBeInTheDocument();
  });

  it('handles missing currency gracefully', () => {
    const packages = [createPackage({ price_min: 2500, price_max: 3500, currency: null })];
    render(<PackagesSection packages={packages} />);
    expect(screen.getByText('2,500 - 3,500')).toBeInTheDocument();
  });

  it('renders nights included badge', () => {
    const packages = [createPackage({ nights_included: 3 })];
    render(<PackagesSection packages={packages} />);
    expect(screen.getByText('3 nights included')).toBeInTheDocument();
  });

  it('renders transfers included badge when true', () => {
    const packages = [createPackage({ transport_included: true })];
    render(<PackagesSection packages={packages} />);
    expect(screen.getByText('Transfers included')).toBeInTheDocument();
  });

  it('renders no transfers badge when false', () => {
    const packages = [createPackage({ transport_included: false })];
    render(<PackagesSection packages={packages} />);
    expect(screen.getByText('No transfers')).toBeInTheDocument();
  });

  it('renders aftercare duration badge', () => {
    const packages = [createPackage({ aftercare_duration_days: 14 })];
    render(<PackagesSection packages={packages} />);
    expect(screen.getByText('14 days aftercare')).toBeInTheDocument();
  });

  it('renders includes list', () => {
    const packages = [createPackage({ includes: ['FUE procedure', 'PRP treatment', 'Medications'] })];
    render(<PackagesSection packages={packages} />);
    expect(screen.getByText('FUE procedure')).toBeInTheDocument();
    expect(screen.getByText('PRP treatment')).toBeInTheDocument();
    expect(screen.getByText('Medications')).toBeInTheDocument();
  });

  it('renders excludes list', () => {
    const packages = [createPackage({ excludes: ['Flights', 'Travel insurance'] })];
    render(<PackagesSection packages={packages} />);
    expect(screen.getByText('Flights')).toBeInTheDocument();
    expect(screen.getByText('Travel insurance')).toBeInTheDocument();
  });

  it('shows no inclusions message when empty', () => {
    const packages = [createPackage({ includes: [] })];
    render(<PackagesSection packages={packages} />);
    expect(screen.getByText('No inclusions listed.')).toBeInTheDocument();
  });

  it('shows no exclusions message when empty', () => {
    const packages = [createPackage({ excludes: [] })];
    render(<PackagesSection packages={packages} />);
    expect(screen.getByText('No exclusions listed.')).toBeInTheDocument();
  });

  it('renders multiple packages', () => {
    const packages = [
      createPackage({ id: 'p1', package_name: 'Basic Package' }),
      createPackage({ id: 'p2', package_name: 'Premium Package' }),
    ];
    render(<PackagesSection packages={packages} />);
    expect(screen.getByText('Basic Package')).toBeInTheDocument();
    expect(screen.getByText('Premium Package')).toBeInTheDocument();
  });

  it('handles only price_min without price_max', () => {
    const packages = [createPackage({ price_min: 2000, price_max: null, currency: 'USD' })];
    render(<PackagesSection packages={packages} />);
    expect(screen.getByText('$2,000')).toBeInTheDocument();
  });

  it('handles only price_max without price_min', () => {
    const packages = [createPackage({ price_min: null, price_max: 5000, currency: 'USD' })];
    render(<PackagesSection packages={packages} />);
    expect(screen.getByText('$5,000')).toBeInTheDocument();
  });

  it('handles null nights_included', () => {
    const packages = [createPackage({ nights_included: null })];
    render(<PackagesSection packages={packages} />);
    expect(screen.queryByText(/nights included/)).not.toBeInTheDocument();
  });

  it('handles null aftercare_duration_days', () => {
    const packages = [createPackage({ aftercare_duration_days: null })];
    render(<PackagesSection packages={packages} />);
    expect(screen.queryByText(/days aftercare/)).not.toBeInTheDocument();
  });

  it('handles non-array includes gracefully', () => {
    const packages = [createPackage({ includes: null })];
    render(<PackagesSection packages={packages} />);
    expect(screen.getByText('No inclusions listed.')).toBeInTheDocument();
  });
});
