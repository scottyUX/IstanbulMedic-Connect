import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PricingSection } from '@/components/istanbulmedic-connect/profile/PricingSection';
import type { ClinicDetail } from '@/lib/api/clinics';

type PricingRow = ClinicDetail['pricing'][number];

describe('PricingSection', () => {
  const createPricingRow = (overrides: Partial<PricingRow> = {}): PricingRow => ({
    id: 'price-1',
    clinic_id: 'clinic-1',
    service_name: 'Hair Transplant',
    service_type: null,
    price_min: 2500,
    price_max: 4000,
    currency: 'USD',
    pricing_model: 'per_graft',
    pricing_type: 'range',
    graft_count_min: 2000,
    graft_count_max: 4000,
    includes_accommodation: null,
    includes_transport: null,
    includes_aftercare: null,
    notes: null,
    created_at: null,
    updated_at: null,
    ...overrides,
  } as PricingRow);

  it('renders section title', () => {
    render(<PricingSection pricing={[]} />);
    expect(screen.getByText('Pricing')).toBeInTheDocument();
  });

  it('shows empty state when no pricing', () => {
    render(<PricingSection pricing={[]} />);
    expect(screen.getByText(/Pricing details are not available yet/)).toBeInTheDocument();
  });

  it('renders service name', () => {
    const pricing = [createPricingRow({ service_name: 'FUE Hair Transplant' })];
    render(<PricingSection pricing={pricing} />);
    expect(screen.getByText('FUE Hair Transplant')).toBeInTheDocument();
  });

  it('formats price range correctly', () => {
    const pricing = [createPricingRow({ price_min: 2500, price_max: 4000, currency: 'USD' })];
    render(<PricingSection pricing={pricing} />);
    expect(screen.getByText('$2,500 - $4,000')).toBeInTheDocument();
  });

  it('formats fixed price when min equals max', () => {
    const pricing = [createPricingRow({ price_min: 3000, price_max: 3000, currency: 'USD' })];
    render(<PricingSection pricing={pricing} />);
    expect(screen.getByText('$3,000')).toBeInTheDocument();
  });

  it('shows quote only for quote_only pricing type', () => {
    const pricing = [createPricingRow({ pricing_type: 'quote_only' })];
    render(<PricingSection pricing={pricing} />);
    // Quote only appears both in price and in badge
    const elements = screen.getAllByText(/Quote only/i);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('shows Contact for pricing when no prices provided', () => {
    const pricing = [createPricingRow({ price_min: null, price_max: null })];
    render(<PricingSection pricing={pricing} />);
    expect(screen.getByText('Contact for pricing')).toBeInTheDocument();
  });

  it('renders pricing type badge', () => {
    const pricing = [createPricingRow({ pricing_type: 'range' })];
    render(<PricingSection pricing={pricing} />);
    expect(screen.getByText('Range')).toBeInTheDocument();
  });

  it('renders pricing type badge for fixed', () => {
    const pricing = [createPricingRow({ pricing_type: 'fixed' })];
    render(<PricingSection pricing={pricing} />);
    expect(screen.getByText('Fixed')).toBeInTheDocument();
  });

  it('renders notes when provided', () => {
    const pricing = [createPricingRow({ notes: 'Includes 3 nights hotel' })];
    render(<PricingSection pricing={pricing} />);
    expect(screen.getByText('Includes 3 nights hotel')).toBeInTheDocument();
  });

  it('renders multiple pricing items', () => {
    const pricing = [
      createPricingRow({ id: 'p1', service_name: 'Hair Transplant' }),
      createPricingRow({ id: 'p2', service_name: 'Beard Transplant' }),
    ];
    render(<PricingSection pricing={pricing} />);
    expect(screen.getByText('Hair Transplant')).toBeInTheDocument();
    expect(screen.getByText('Beard Transplant')).toBeInTheDocument();
  });

  it('handles EUR currency', () => {
    const pricing = [createPricingRow({ price_min: 2000, price_max: 3500, currency: 'EUR' })];
    render(<PricingSection pricing={pricing} />);
    expect(screen.getByText(/€2,000.*€3,500/)).toBeInTheDocument();
  });

  it('handles TRY currency', () => {
    const pricing = [createPricingRow({ price_min: 50000, price_max: 80000, currency: 'TRY' })];
    render(<PricingSection pricing={pricing} />);
    // TRY formats with some symbol or abbreviation
    expect(screen.getByText(/50,000.*80,000/)).toBeInTheDocument();
  });

  it('handles missing currency gracefully', () => {
    const pricing = [createPricingRow({ price_min: 2500, price_max: 4000, currency: null })];
    render(<PricingSection pricing={pricing} />);
    expect(screen.getByText('2,500 - 4,000')).toBeInTheDocument();
  });
});
