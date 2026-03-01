import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock the Google Font before importing ClinicCard
vi.mock('next/font/google', () => ({
  Merriweather: () => ({
    className: 'mocked-merriweather',
  }),
}));

import { ClinicCard } from '@/components/istanbulmedic-connect/ClinicCard';

describe('ClinicCard', () => {
  const defaultProps = {
    name: 'Test Clinic',
    location: 'Istanbul, Turkey',
    image: 'https://example.com/clinic.jpg',
    specialties: ['Hair Transplant', 'Dental'],
    trustScore: 85,
    description: 'A quality healthcare clinic in Istanbul.',
    onViewProfile: vi.fn(),
  };

  it('renders clinic name', () => {
    render(<ClinicCard {...defaultProps} />);
    expect(screen.getByText('Test Clinic')).toBeInTheDocument();
  });

  it('renders location with icon', () => {
    render(<ClinicCard {...defaultProps} />);
    expect(screen.getByText('Istanbul, Turkey')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<ClinicCard {...defaultProps} />);
    expect(screen.getByText('A quality healthcare clinic in Istanbul.')).toBeInTheDocument();
  });

  // TODO: Unskip when clinic_scores data is populated and trust score display is added back to ClinicCard
  it.skip('renders trust score', () => {
    render(<ClinicCard {...defaultProps} />);
    expect(screen.getByText(/Trust 85/)).toBeInTheDocument();
  });

  it('renders specialties as tags', () => {
    render(<ClinicCard {...defaultProps} />);
    // SpecialtyTag component renders as lowercase 'transplant'
    expect(screen.getByText(/Hair transplant/i)).toBeInTheDocument();
    expect(screen.getByText(/Dental/i)).toBeInTheDocument();
  });

  it('limits specialties to 4 items', () => {
    const manySpecialties = ['Spec 1', 'Spec 2', 'Spec 3', 'Spec 4', 'Spec 5', 'Spec 6'];
    render(<ClinicCard {...defaultProps} specialties={manySpecialties} />);

    expect(screen.getByText('Spec 1')).toBeInTheDocument();
    expect(screen.getByText('Spec 4')).toBeInTheDocument();
    expect(screen.queryByText('Spec 5')).not.toBeInTheDocument();
    expect(screen.queryByText('Spec 6')).not.toBeInTheDocument();
  });

  it('renders rating when provided', () => {
    render(<ClinicCard {...defaultProps} rating={4.5} />);
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  // TODO: Unskip when clinic_scores data is populated and trust score display is added back to ClinicCard
  it.skip('shows trust score when no rating provided', () => {
    render(<ClinicCard {...defaultProps} />);
    // Trust score should appear without rating
    expect(screen.getByText('Trust 85')).toBeInTheDocument();
    expect(screen.queryByText('4.5')).not.toBeInTheDocument();
  });

  it('renders AI insight when provided', () => {
    render(<ClinicCard {...defaultProps} aiInsight="This clinic has great reviews" />);
    expect(screen.getByText('AI insight:')).toBeInTheDocument();
    expect(screen.getByText(/This clinic has great reviews/)).toBeInTheDocument();
  });

  it('does not render AI insight when not provided', () => {
    render(<ClinicCard {...defaultProps} />);
    expect(screen.queryByText('AI insight:')).not.toBeInTheDocument();
  });

  it('calls onViewProfile when card is clicked', () => {
    const onViewProfile = vi.fn();
    render(<ClinicCard {...defaultProps} onViewProfile={onViewProfile} />);

    // Find the clinic name and get the clickable card container
    const clinicName = screen.getByText('Test Clinic');
    const card = clinicName.closest('[class*="cursor-pointer"]');
    expect(card).not.toBeNull();
    fireEvent.click(card!);
    expect(onViewProfile).toHaveBeenCalledTimes(1);
  });

  it('renders image with correct alt text', () => {
    render(<ClinicCard {...defaultProps} />);
    const image = screen.getByAltText('Test Clinic clinic photo');
    expect(image).toBeInTheDocument();
  });

  it('shows placeholder when no image provided', () => {
    render(<ClinicCard {...defaultProps} image={null} />);
    expect(screen.getByText('No clinic photo uploaded')).toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.compare is enabled
  it.skip('renders compare checkbox', () => {
    render(<ClinicCard {...defaultProps} />);
    expect(screen.getByLabelText(`Compare ${defaultProps.name}`)).toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.compare is enabled
  it.skip('does not trigger onViewProfile when compare checkbox is clicked', () => {
    const onViewProfile = vi.fn();
    render(<ClinicCard {...defaultProps} onViewProfile={onViewProfile} />);

    const checkbox = screen.getByLabelText(`Compare ${defaultProps.name}`);
    fireEvent.click(checkbox);

    // onViewProfile should not be called because click is stopped
    expect(onViewProfile).not.toHaveBeenCalled();
  });

  it('handles description not provided', () => {
    const propsWithoutDesc = { ...defaultProps, description: '' };
    render(<ClinicCard {...propsWithoutDesc} />);

    // Should still render without crashing
    expect(screen.getByText('Test Clinic')).toBeInTheDocument();
  });
});
