import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OverviewSection } from '@/components/istanbulmedic-connect/profile/OverviewSection';

describe('OverviewSection', () => {
  const defaultProps = {
    specialties: ['Hair Transplant', 'Dental'],
    yearsInOperation: 15,
    proceduresPerformed: 50000,
    languages: ['English', 'Turkish'],
    description: 'A great clinic for medical tourism.',
  };

  it('renders with full data', () => {
    render(<OverviewSection {...defaultProps} />);

    expect(screen.getByText('Hair Transplant')).toBeInTheDocument();
    expect(screen.getByText('Dental')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('50,000')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // languages count
    expect(screen.getByText('A great clinic for medical tourism.')).toBeInTheDocument();
  });

  it('shows "Not available" for null yearsInOperation', () => {
    render(<OverviewSection {...defaultProps} yearsInOperation={null} />);

    const notAvailable = screen.getAllByText('Not available');
    expect(notAvailable.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Not available" for null proceduresPerformed', () => {
    render(<OverviewSection {...defaultProps} proceduresPerformed={null} />);

    const notAvailable = screen.getAllByText('Not available');
    expect(notAvailable.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Not available" for empty languages', () => {
    render(<OverviewSection {...defaultProps} languages={[]} />);

    const notAvailable = screen.getAllByText('Not available');
    expect(notAvailable.length).toBeGreaterThanOrEqual(1);
  });

  it('renders empty specialties without crashing', () => {
    render(<OverviewSection {...defaultProps} specialties={[]} />);

    // Should still render the section
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });
});
