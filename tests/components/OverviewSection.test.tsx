/**
 * tests/unit/components/OverviewSection.test.tsx
 *
 * Tests for OverviewSection component.
 * Updated for website-scraping feature — yearsInOperation, proceduresPerformed,
 * and languages have been removed from the UI. Techniques from clinic_scraped_data
 * now replace procedures performed.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/font/google', () => ({
  Merriweather: () => ({ className: 'mocked-merriweather' }),
}));

import { OverviewSection } from '@/components/istanbulmedic-connect/profile/OverviewSection';

describe('OverviewSection', () => {
  const defaultProps = {
    specialties: ['Hair Transplant'],
    yearsInOperation: null,
    proceduresPerformed: null,
    languages: [],
    description: 'Located in Turkey, AEK Hair Clinic specializes in high-quality hair transplants using FUT and FUE techniques.',
    techniques: ['FUE', 'FUT'],
  };

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders the overview heading', () => {
    render(<OverviewSection {...defaultProps} />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  it('renders specialties as badges', () => {
    render(<OverviewSection {...defaultProps} specialties={['Hair Transplant', 'Beard Transplant']} />);
    expect(screen.getByText('Hair Transplant')).toBeInTheDocument();
    expect(screen.getByText('Beard Transplant')).toBeInTheDocument();
  });

  // ── Description ────────────────────────────────────────────────────────────

  it('renders description from clinic_scraped_data', () => {
    render(<OverviewSection {...defaultProps} />);
    expect(
      screen.getByText(
        'Located in Turkey, AEK Hair Clinic specializes in high-quality hair transplants using FUT and FUE techniques.'
      )
    ).toBeInTheDocument();
  });

  it('renders AHD Clinic description correctly', () => {
    render(
      <OverviewSection
        {...defaultProps}
        description="AHD Clinic, founded by Dr. Hakan Doğanay, is a pioneer in hair transplant Turkey with 22 years of experience."
      />
    );
    expect(screen.getByText(/AHD Clinic, founded by Dr. Hakan/)).toBeInTheDocument();
  });

  it('does not crash when description is null', () => {
    render(<OverviewSection {...defaultProps} description={null} />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  // ── Techniques ─────────────────────────────────────────────────────────────

  it('renders techniques joined as a string', () => {
    render(<OverviewSection {...defaultProps} techniques={['FUE', 'DHI', 'Sapphire FUE']} />);
    expect(screen.getByText('FUE, DHI, Sapphire FUE')).toBeInTheDocument();
  });

  it('renders single technique without comma', () => {
    render(<OverviewSection {...defaultProps} techniques={['DHI']} />);
    expect(screen.getByText('DHI')).toBeInTheDocument();
  });

  it('does not render techniques stat block when techniques is empty', () => {
    render(<OverviewSection {...defaultProps} techniques={[]} />);
    expect(screen.queryByText('Techniques')).not.toBeInTheDocument();
  });
  // ── Empty state ────────────────────────────────────────────────────────────

  it('renders without crashing when specialties is empty', () => {
    render(<OverviewSection {...defaultProps} specialties={[]} />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  it('renders without crashing for a fully unscraped clinic', () => {
    render(
      <OverviewSection
        {...defaultProps}
        description={null}
        techniques={[]}
        specialties={[]}
      />
    );
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });
});
