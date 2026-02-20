import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DoctorCard } from '@/components/istanbulmedic-connect/profile/DoctorCard';

describe('DoctorCard', () => {
  const defaultDoctor = {
    name: 'Dr. John Smith',
    specialty: 'Hair Transplant Surgeon',
    photo: 'https://example.com/photo.jpg',
    credentials: ['ISHRS Member', 'Board Certified'],
    yearsOfExperience: 15,
    education: 'Harvard Medical School',
  };

  it('renders with full data', () => {
    render(<DoctorCard doctor={defaultDoctor} />);

    expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
    expect(screen.getByText('Hair Transplant Surgeon')).toBeInTheDocument();
    expect(screen.getByText('ISHRS Member')).toBeInTheDocument();
    expect(screen.getByText('Board Certified')).toBeInTheDocument();
    expect(screen.getByText('15+ yrs')).toBeInTheDocument();
    expect(screen.getByText('Harvard Medical School')).toBeInTheDocument();
  });

  it('shows "Doctor" for null name', () => {
    render(<DoctorCard doctor={{ ...defaultDoctor, name: null }} />);

    expect(screen.getByText('Doctor')).toBeInTheDocument();
  });

  it('hides years badge when yearsOfExperience is null', () => {
    render(<DoctorCard doctor={{ ...defaultDoctor, yearsOfExperience: null }} />);

    expect(screen.queryByText(/yrs$/)).not.toBeInTheDocument();
  });

  it('hides education section when education is null', () => {
    render(<DoctorCard doctor={{ ...defaultDoctor, education: null }} />);

    expect(screen.queryByText('Harvard Medical School')).not.toBeInTheDocument();
  });

  it('renders with empty credentials', () => {
    render(<DoctorCard doctor={{ ...defaultDoctor, credentials: [] }} />);

    // Should still render without crashing
    expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
  });

  it('uses name for alt text, falls back to "Doctor"', () => {
    const { rerender } = render(<DoctorCard doctor={defaultDoctor} />);
    expect(screen.getByAltText('Dr. John Smith')).toBeInTheDocument();

    rerender(<DoctorCard doctor={{ ...defaultDoctor, name: null }} />);
    expect(screen.getByAltText('Doctor')).toBeInTheDocument();
  });
});
