import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock the Google Font before importing ClinicCard
vi.mock('next/font/google', () => ({
  Merriweather: () => ({
    className: 'mocked-merriweather',
  }),
}));

// Stable router mock — shared across all tests so we can assert on `push`
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mutable so consultation tests can flip to authenticated
let isAuthenticated = false;
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated, loading: false }),
}));

import { ClinicCard } from '@/components/istanbulmedic-connect/ClinicCard';

// Shared across both describe blocks
const defaultProps = {
  id: 'clinic-test-id',
  name: 'Test Clinic',
  location: 'Istanbul, Turkey',
  image: 'https://example.com/clinic.jpg',
  specialties: ['Hair Transplant', 'Dental'],
  trustScore: 85,
  description: 'A quality healthcare clinic in Istanbul.',
  onViewProfile: vi.fn(),
};

describe('ClinicCard', () => {

  it('renders clinic name', () => {
    render(<ClinicCard {...defaultProps} />);
    expect(screen.getByText('Test Clinic')).toBeInTheDocument();
  });

  it('renders Ministry verification badge when verified', () => {
    render(<ClinicCard {...defaultProps} isMinistryVerified />);
    expect(screen.getByText('Ministry verified')).toBeInTheDocument();
  });

  it('explains Ministry verification without opening the clinic card', () => {
    const onViewProfile = vi.fn();
    render(<ClinicCard {...defaultProps} isMinistryVerified onViewProfile={onViewProfile} />);

    const badge = screen.getByRole('button', { name: /ministry verified/i });
    fireEvent.mouseEnter(badge);
    expect(screen.getByRole('tooltip')).toHaveTextContent(/official health registry/i);

    fireEvent.click(badge);
    expect(onViewProfile).not.toHaveBeenCalled();
  });

  it('does not render Ministry verification badge by default', () => {
    render(<ClinicCard {...defaultProps} />);
    expect(screen.queryByText('Ministry verified')).not.toBeInTheDocument();
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

  // Specialty tags are hidden until multiple clinic types are added to the platform.
  // Re-enable these tests when the tags section is uncommented in ClinicCard.tsx.
  it.skip('renders specialties as tags', () => {
    render(<ClinicCard {...defaultProps} />);
    expect(screen.getByText(/Hair transplant/i)).toBeInTheDocument();
    expect(screen.getByText(/Dental/i)).toBeInTheDocument();
  });

  it.skip('limits specialties to 4 items', () => {
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

// ─── Consultation behavior ─────────────────────────────────────────────────────
//
// FEATURE_CONFIG.bookConsultation is true, so the "Request Free Consultation"
// link and its modal are active. These tests cover the auth gate, modal trigger,
// happy-path confirm, and failure-stays-unchanged behaviour.

describe('ClinicCard — consultation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isAuthenticated = false;
    global.fetch = vi.fn();
    sessionStorage.clear();
  });

  it('shows "Request Free Consultation" button', () => {
    render(<ClinicCard {...defaultProps} />);
    expect(screen.getByRole('button', { name: /request free consultation/i })).toBeInTheDocument();
  });

  // ── Auth gate ──────────────────────────────────────────────────────────────
  //
  // When signed out, clicking the button should redirect — not open the modal.

  it('stores consultation_intent and redirects to /auth/login when unauthenticated', () => {
    isAuthenticated = false;
    render(<ClinicCard {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /request free consultation/i }));
    expect(sessionStorage.getItem('consultation_intent')).toBe(JSON.stringify(['clinic-test-id']));
    expect(mockPush).toHaveBeenCalledWith(
      `/auth/login?next=${encodeURIComponent('/profile?section=consultations')}`
    );
  });

  it('does not open the modal when user is unauthenticated', () => {
    isAuthenticated = false;
    render(<ClinicCard {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /request free consultation/i }));
    // The modal title should not be in the DOM
    expect(screen.queryByText('Request Free Consultation', { selector: '[role="heading"]' })).not.toBeInTheDocument();
  });

  // ── Modal trigger ──────────────────────────────────────────────────────────

  it('opens the confirmation modal when authenticated user clicks the button', () => {
    isAuthenticated = true;
    render(<ClinicCard {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /request free consultation/i }));
    // Modal body confirms it's open for the right clinic — the phrase includes the clinic name
    expect(screen.getByText(/request a free consultation with/i)).toBeInTheDocument();
  });

  // ── Confirm → API + UI flip ────────────────────────────────────────────────

  it('calls /api/consultations and shows "Consultation Requested" after confirming', async () => {
    isAuthenticated = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ emailSent: true }) });

    render(<ClinicCard {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /request free consultation/i }));
    // Click the confirm button inside the modal
    fireEvent.click(screen.getByRole('button', { name: /^request consultation$/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/consultations',
        expect.objectContaining({ method: 'POST' })
      );
    });

    // Button replaced by the "Consultation Requested" state
    await waitFor(() => {
      expect(screen.getByText(/consultation requested/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /request free consultation/i })).not.toBeInTheDocument();
    });
  });

  // ── API failure → UI stays unchanged ──────────────────────────────────────
  //
  // If the API returns non-ok, the UI should stay showing the button so the
  // user can retry — we don't show an error state, we just leave it as-is.

  it('leaves the button visible when the API call fails', async () => {
    isAuthenticated = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.fetch as any).mockResolvedValueOnce({ ok: false });

    render(<ClinicCard {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /request free consultation/i }));
    fireEvent.click(screen.getByRole('button', { name: /^request consultation$/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    // Button should still be there — user can retry
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /request free consultation/i })).toBeInTheDocument();
    });
  });
});
