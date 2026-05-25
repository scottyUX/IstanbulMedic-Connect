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
    expect(screen.queryByText(/Medical School/)).not.toBeInTheDocument();
  });

  it('handles empty credentials array', () => {
    const doctors = [createDoctor({ credentials: [] })];
    render(<DoctorsSection doctors={doctors} />);
    expect(screen.getByText('Dr. Mehmet Yilmaz')).toBeInTheDocument();
  });

  it('renders empty placeholder when no photo', () => {
    const doctors = [createDoctor({ name: 'Dr. Mehmet Yilmaz', photo: null })];
    render(<DoctorsSection doctors={doctors} />);
    expect(screen.queryByText('No photo uploaded')).not.toBeInTheDocument();
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
        {
          qualification: 'ISHRS member',
          source: 'ishrs',
          sourceUrl: 'https://ishrs.org/doctor/50809/',
          verifiedAt: '2026-04-15T00:00:00Z',
        },
        {
          qualification: 'TPRECD member (Turkish board-certified plastic surgeon)',
          source: 'tprecd',
          sourceUrl: 'https://www.plastikcerrahi.org.tr/Doktor-Bilgileri/47',
          verifiedAt: '2026-04-15T00:00:00Z',
        },
      ],
      lastVerifiedAt: '2026-04-15T00:00:00Z',
    };

    it('State A (verified): renders one badge per registry, each linking to the source profile', () => {
      render(<DoctorsSection doctors={[verifiedDoctor]} />);

      const ishrsLink = screen.getByRole('link', { name: /ISHRS member/i });
      expect(ishrsLink).toHaveAttribute('href', 'https://ishrs.org/doctor/50809/');
      expect(ishrsLink).toHaveAttribute('target', '_blank');
      expect(ishrsLink).toHaveAttribute('rel', expect.stringContaining('noopener'));

      // Badge label is the full qualification string from the row, including
      // TPRECD's parenthetical detail. Earlier code used a hardcoded source-→
      // -label map that dropped the parenthetical; the new code renders
      // q.qualification verbatim.
      const tprecdLink = screen.getByRole('link', {
        name: /TPRECD member \(Turkish board-certified plastic surgeon\)/i,
      });
      expect(tprecdLink).toHaveAttribute(
        'href',
        'https://www.plastikcerrahi.org.tr/Doktor-Bilgileri/47',
      );

      expect(screen.queryByTestId('doctors-listed-unverified')).not.toBeInTheDocument();
      expect(screen.queryByTestId('doctors-not-disclosed')).not.toBeInTheDocument();
    });

    it('State A: surfaces last-verified date in human-readable form', () => {
      render(<DoctorsSection doctors={[verifiedDoctor]} />);
      expect(screen.getByText(/last verified Apr 2026/i)).toBeInTheDocument();
    });

    it('State A: renders a single IAHRS badge when only IAHRS is the source', () => {
      const iahrsOnly: Doctor = {
        ...verifiedDoctor,
        verifiedQualifications: [
          {
            qualification: 'IAHRS member',
            source: 'iahrs',
            sourceUrl: 'https://www.iahrs.org/hair-transplant/koray-erdogan',
            verifiedAt: '2026-04-15T00:00:00Z',
          },
        ],
      };
      render(<DoctorsSection doctors={[iahrsOnly]} />);
      const link = screen.getByRole('link', { name: /IAHRS member/i });
      expect(link).toHaveAttribute(
        'href',
        'https://www.iahrs.org/hair-transplant/koray-erdogan',
      );
    });

    it('State B (listed but unverified): shows section-level note when no qualifications exist', () => {
      const doctors = [createDoctor({ name: 'Dr. Unverified' })];
      render(<DoctorsSection doctors={doctors} />);

      expect(screen.getByTestId('doctors-listed-unverified')).toBeInTheDocument();
      expect(screen.getByText('Dr. Unverified')).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /ISHRS member/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /TPRECD member/i })).not.toBeInTheDocument();
    });

    it('State B: explains that absence of a badge means the doctor is not in any registry', () => {
      render(<DoctorsSection doctors={[createDoctor({ name: 'Dr. Unverified' })]} />);
      const note = screen.getByTestId('doctors-listed-unverified');
      expect(note).toHaveTextContent(/ISHRS/);
      expect(note).toHaveTextContent(/IAHRS/);
      expect(note).toHaveTextContent(/TPRECD/);
      // The framing must be "doctor is not listed", not "we failed to verify".
      expect(note).toHaveTextContent(/not (currently )?listed/i);
    });

    it('State C (not disclosed): shows the booking-warning message for empty teams', () => {
      render(<DoctorsSection doctors={[]} />);

      expect(screen.getByTestId('doctors-not-disclosed')).toBeInTheDocument();
      expect(screen.getByText(/isn't available yet/i)).toBeInTheDocument();
    });

    it('mixed team renders State A when at least one member is verified', () => {
      const unverified = createDoctor({ name: 'Dr. Other' });
      render(<DoctorsSection doctors={[verifiedDoctor, unverified]} />);

      expect(screen.queryByTestId('doctors-listed-unverified')).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: /ISHRS member/i })).toBeInTheDocument();
      expect(screen.getByText('Dr. Other')).toBeInTheDocument();
    });
  });
});
