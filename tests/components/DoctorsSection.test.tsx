import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DoctorsSection } from '@/components/istanbulmedic-connect/profile/DoctorsSection';
import type { Doctor } from '@/components/istanbulmedic-connect/profile/DoctorCard';

describe('DoctorsSection', () => {
  const createDoctor = (overrides: Partial<Doctor> = {}): Doctor => ({
    name: 'Dr. Mehmet Yilmaz',
    specialty: 'Hair Transplant Surgeon',
    photo: null,
    credentials: ['MD', 'ISHRS Member'],
    yearsOfExperience: 15,
    education: 'Istanbul University Medical School',
    ...overrides,
  });

  it('renders section title', () => {
    render(<DoctorsSection doctors={[]} />);
    expect(screen.getByText('Doctors')).toBeInTheDocument();
  });

  it('renders section description', () => {
    render(<DoctorsSection doctors={[]} />);
    expect(screen.getByText(/Meet the physicians and specialists/)).toBeInTheDocument();
  });

  it('renders a single doctor', () => {
    const doctors = [createDoctor({ name: 'Dr. Ayse Kaya' })];
    render(<DoctorsSection doctors={doctors} />);
    expect(screen.getByText('Dr. Ayse Kaya')).toBeInTheDocument();
  });

  it('renders multiple doctors', () => {
    const doctors = [
      createDoctor({ name: 'Dr. Mehmet Yilmaz' }),
      createDoctor({ name: 'Dr. Ayse Kaya' }),
      createDoctor({ name: 'Dr. Ali Ozturk' }),
    ];
    render(<DoctorsSection doctors={doctors} />);
    expect(screen.getByText('Dr. Mehmet Yilmaz')).toBeInTheDocument();
    expect(screen.getByText('Dr. Ayse Kaya')).toBeInTheDocument();
    expect(screen.getByText('Dr. Ali Ozturk')).toBeInTheDocument();
  });

  it('renders doctor specialty', () => {
    const doctors = [createDoctor({ specialty: 'Plastic Surgeon' })];
    render(<DoctorsSection doctors={doctors} />);
    expect(screen.getByText('Plastic Surgeon')).toBeInTheDocument();
  });

  it('renders doctor credentials', () => {
    const doctors = [createDoctor({ credentials: ['MD', 'ISHRS Member', 'Board Certified'] })];
    render(<DoctorsSection doctors={doctors} />);
    expect(screen.getByText('MD')).toBeInTheDocument();
    expect(screen.getByText('ISHRS Member')).toBeInTheDocument();
    expect(screen.getByText('Board Certified')).toBeInTheDocument();
  });

  it('renders years of experience badge', () => {
    const doctors = [createDoctor({ yearsOfExperience: 20 })];
    render(<DoctorsSection doctors={doctors} />);
    expect(screen.getByText('20+ yrs')).toBeInTheDocument();
  });

  it('renders education information', () => {
    const doctors = [createDoctor({ education: 'Harvard Medical School' })];
    render(<DoctorsSection doctors={doctors} />);
    expect(screen.getByText('Harvard Medical School')).toBeInTheDocument();
  });

  it('handles null doctor name', () => {
    const doctors = [createDoctor({ name: null })];
    render(<DoctorsSection doctors={doctors} />);
    expect(screen.getByText('Doctor')).toBeInTheDocument();
  });

  it('handles null years of experience', () => {
    const doctors = [createDoctor({ yearsOfExperience: null })];
    render(<DoctorsSection doctors={doctors} />);
    expect(screen.queryByText(/yrs/)).not.toBeInTheDocument();
  });

  it('handles null education', () => {
    const doctors = [createDoctor({ education: null })];
    render(<DoctorsSection doctors={doctors} />);
    // Education section should not be present
    expect(screen.queryByText(/Medical School/)).not.toBeInTheDocument();
  });

  it('handles empty credentials array', () => {
    const doctors = [createDoctor({ credentials: [] })];
    render(<DoctorsSection doctors={doctors} />);
    // Should still render the doctor without credentials
    expect(screen.getByText('Dr. Mehmet Yilmaz')).toBeInTheDocument();
  });

  it('renders placeholder when no photo', () => {
    const doctors = [createDoctor({ name: 'Dr. Mehmet Yilmaz', photo: null })];
    render(<DoctorsSection doctors={doctors} />);
    // Initials should be "DM" (Dr. Mehmet)
    expect(screen.getByText('DM')).toBeInTheDocument();
    expect(screen.getByText('No photo uploaded')).toBeInTheDocument();
  });

  it('renders photo when provided', () => {
    const doctors = [createDoctor({ name: 'Dr. Mehmet Yilmaz', photo: '/doctor.jpg' })];
    render(<DoctorsSection doctors={doctors} />);
    const img = screen.getByRole('img', { name: /Dr\. Mehmet Yilmaz/i });
    expect(img).toHaveAttribute('src', '/doctor.jpg');
  });

  describe('three render states', () => {
    const verifiedDoctor: Doctor = {
      name: 'Dr. Ali Emre Karadeniz',
      specialty: 'Surgeon',
      photo: null,
      credentials: ['Plastic Surgery'],
      yearsOfExperience: 14,
      education: null,
      verifiedQualifications: [
        { qualification: 'FISHRS', source: 'ishrs', verifiedAt: '2026-04-15T00:00:00Z' },
        { qualification: 'ABHRS Diplomate', source: 'ishrs', verifiedAt: '2026-04-15T00:00:00Z' },
      ],
      lastVerifiedAt: '2026-04-15T00:00:00Z',
    };

    it('State A (verified): shows qualifications and source badges', () => {
      render(<DoctorsSection doctors={[verifiedDoctor]} />);

      expect(screen.getByText('FISHRS')).toBeInTheDocument();
      expect(screen.getByText('ABHRS Diplomate')).toBeInTheDocument();
      expect(screen.getAllByText(/via ISHRS/i)).toHaveLength(2);

      expect(screen.queryByTestId('doctors-listed-unverified')).not.toBeInTheDocument();
      expect(screen.queryByTestId('doctors-not-disclosed')).not.toBeInTheDocument();
    });

    it('State A: surfaces last-verified date in human-readable form', () => {
      render(<DoctorsSection doctors={[verifiedDoctor]} />);
      expect(screen.getByText(/Last verified Apr 2026/)).toBeInTheDocument();
    });

    it('State B (listed but unverified): shows section-level note when no qualifications exist', () => {
      const doctors = [createDoctor({ name: 'Dr. Unverified' })];
      render(<DoctorsSection doctors={doctors} />);

      expect(screen.getByTestId('doctors-listed-unverified')).toBeInTheDocument();
      expect(screen.getByText('Dr. Unverified')).toBeInTheDocument();
      expect(screen.queryByText(/via ISHRS/i)).not.toBeInTheDocument();
    });

    it('State C (not disclosed): shows the booking-warning message for empty teams', () => {
      render(<DoctorsSection doctors={[]} />);

      expect(screen.getByTestId('doctors-not-disclosed')).toBeInTheDocument();
      expect(screen.getByText(/has not publicly disclosed/i)).toBeInTheDocument();
    });

    it('mixed team renders State A when at least one member is verified', () => {
      const unverified = createDoctor({ name: 'Dr. Other' });
      render(<DoctorsSection doctors={[verifiedDoctor, unverified]} />);

      expect(screen.queryByTestId('doctors-listed-unverified')).not.toBeInTheDocument();
      expect(screen.getByText('FISHRS')).toBeInTheDocument();
      expect(screen.getByText('Dr. Other')).toBeInTheDocument();
    });
  });
});
