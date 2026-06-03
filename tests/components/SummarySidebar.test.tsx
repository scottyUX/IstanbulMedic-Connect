import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

let isAuthenticated = false;
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated, loading: false }),
}));

import { SummarySidebar } from '@/components/istanbulmedic-connect/profile/SummarySidebar';

// Shared across both describe blocks
const defaultProps = {
  clinicId: 'clinic-test-id',
  clinicName: 'Test Clinic',
  transparencyScore: 85,
  topSpecialties: ['Hair Transplant', 'Dental'],
  rating: 4.8,
  reviewCount: 150,
};

describe('SummarySidebar', () => {
  // TODO: Unskip when FEATURE_CONFIG.profilePricing is enabled
  it.skip('renders price estimate', () => {
    render(<SummarySidebar {...defaultProps} priceEstimate="$2,500" />);
    expect(screen.getByText('$2,500')).toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.profilePricing is enabled
  it.skip('renders default price estimate when not provided', () => {
    render(<SummarySidebar {...defaultProps} />);
    // Default priceEstimate is $1,200, totalEstimate is also $1,200
    // Both appear in the DOM, so we use getAllByText
    const priceElements = screen.getAllByText('$1,200');
    expect(priceElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders rating with two decimal places', () => {
    render(<SummarySidebar {...defaultProps} />);
    // Rating is formatted with toFixed(2), 4.8 becomes 4.80
    // The text is combined with other elements, so use a partial match
    expect(screen.getByText(/4\.80/)).toBeInTheDocument();
  });

  it('renders review count', () => {
    render(<SummarySidebar {...defaultProps} reviewCount={150} />);
    // Review count is displayed as "X reviews"
    expect(screen.getByText('150 reviews')).toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.bookConsultation is enabled
  it.skip('renders Book Consultation button', () => {
    render(<SummarySidebar {...defaultProps} />);
    expect(screen.getByRole('link', { name: 'Book Consultation' })).toBeInTheDocument();
  });

  it('renders Talk to Leila button', () => {
    render(<SummarySidebar {...defaultProps} />);
    expect(screen.getByRole('link', { name: 'Talk to Leila' })).toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.profilePricing is enabled
  it.skip('renders consultation fee', () => {
    render(<SummarySidebar {...defaultProps} consultationFee="$50" />);
    expect(screen.getByText('$50')).toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.profilePricing is enabled
  it.skip('renders service charge', () => {
    render(<SummarySidebar {...defaultProps} serviceCharge="$100" />);
    expect(screen.getByText('$100')).toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.profilePricing is enabled
  it.skip('renders total estimate', () => {
    render(<SummarySidebar {...defaultProps} totalEstimate="$2,600" />);
    expect(screen.getByText('$2,600')).toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.profileTransparency is enabled
  it.skip('renders Verified by Istanbul Medic badge', () => {
    render(<SummarySidebar {...defaultProps} />);
    expect(screen.getByText('Verified by Istanbul Medic')).toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.compare is enabled
  it.skip('renders Add to Compare action', () => {
    render(<SummarySidebar {...defaultProps} />);
    expect(screen.getByText('Add to Compare')).toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.saveClinic is enabled
  it.skip('renders Save Clinic action', () => {
    render(<SummarySidebar {...defaultProps} />);
    expect(screen.getByText('Save Clinic')).toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.share is enabled
  it.skip('renders Share action', () => {
    render(<SummarySidebar {...defaultProps} />);
    expect(screen.getByText('Share')).toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.compare is enabled
  it.skip('calls onAddToCompare when clicked', () => {
    const onAddToCompare = vi.fn();
    render(<SummarySidebar {...defaultProps} onAddToCompare={onAddToCompare} />);
    fireEvent.click(screen.getByText('Add to Compare'));
    expect(onAddToCompare).toHaveBeenCalled();
  });

  // TODO: Unskip when FEATURE_CONFIG.saveClinic is enabled
  it.skip('calls onSave when clicked', () => {
    const onSave = vi.fn();
    render(<SummarySidebar {...defaultProps} onSave={onSave} />);
    fireEvent.click(screen.getByText('Save Clinic'));
    expect(onSave).toHaveBeenCalled();
  });

  // TODO: Unskip when FEATURE_CONFIG.share is enabled
  it.skip('calls onShare when clicked', () => {
    const onShare = vi.fn();
    render(<SummarySidebar {...defaultProps} onShare={onShare} />);
    fireEvent.click(screen.getByText('Share'));
    expect(onShare).toHaveBeenCalled();
  });

  // TODO: Unskip when FEATURE_CONFIG.profilePricing is enabled
  it.skip('opens consultation fee modal when clicked', () => {
    render(<SummarySidebar {...defaultProps} />);
    fireEvent.click(screen.getByText('Consultation fee'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/consultation fee covers your initial video/i)).toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.profilePricing is enabled
  it.skip('opens service charge modal when clicked', () => {
    render(<SummarySidebar {...defaultProps} />);
    fireEvent.click(screen.getByText('Service charge'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/service charge covers Istanbul Medic's coordination/i)).toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.profilePricing is enabled
  it.skip('closes modal when close button clicked', () => {
    render(<SummarySidebar {...defaultProps} />);
    fireEvent.click(screen.getByText('Consultation fee'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    // Dialog should be closed - check it's not in document or has closed state
  });

  // TODO: Unskip when FEATURE_CONFIG.bookConsultation is enabled
  it.skip('renders book consultation button', () => {
    render(<SummarySidebar {...defaultProps} />);
    const btn = screen.getByRole('button', { name: /consultation/i });
    expect(btn).toBeInTheDocument();
  });

  it('handles null rating', () => {
    render(<SummarySidebar {...defaultProps} rating={null} />);
    // Should not crash and should handle gracefully
    expect(screen.getByText('Talk to Leila')).toBeInTheDocument();
  });

  it('renders review link pointing to reviews section', () => {
    render(<SummarySidebar {...defaultProps} />);
    const reviewLink = screen.getByRole('link', { name: /150 reviews/i });
    expect(reviewLink).toHaveAttribute('href', '#reviews');
  });

  // TODO: Unskip when FEATURE_CONFIG.profilePricing is enabled
  it.skip('renders fee line items', () => {
    render(<SummarySidebar {...defaultProps} />);
    expect(screen.getByText('Consultation fee')).toBeInTheDocument();
    expect(screen.getByText('Service charge')).toBeInTheDocument();
    expect(screen.getByText('Total (estimate)')).toBeInTheDocument();
  });
});

// ─── Consultation behavior ─────────────────────────────────────────────────────
//
// FEATURE_CONFIG.bookConsultation is true. The sidebar renders a
// "Request Free Consultation" button that gates on auth and fires a modal
// before calling the API — same flow as ClinicCard.

describe('SummarySidebar — consultation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isAuthenticated = false;
    global.fetch = vi.fn();
    sessionStorage.clear();
  });

  it('shows "Request Free Consultation" button', () => {
    render(<SummarySidebar {...defaultProps} />);
    expect(screen.getByRole('button', { name: /request free consultation/i })).toBeInTheDocument();
  });

  // ── Auth gate ──────────────────────────────────────────────────────────────

  it('stores consultation_intent and redirects to /auth/login when unauthenticated', () => {
    isAuthenticated = false;
    render(<SummarySidebar {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /request free consultation/i }));
    expect(sessionStorage.getItem('consultation_intent')).toBe(JSON.stringify(['clinic-test-id']));
    expect(mockPush).toHaveBeenCalledWith(
      `/auth/login?next=${encodeURIComponent('/profile?section=consultations')}`
    );
  });

  it('does not open the modal when user is unauthenticated', () => {
    isAuthenticated = false;
    render(<SummarySidebar {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /request free consultation/i }));
    expect(screen.queryByText(/request a free consultation with/i)).not.toBeInTheDocument();
  });

  // ── Modal trigger ──────────────────────────────────────────────────────────

  it('opens the confirmation modal when authenticated user clicks the button', async () => {
    isAuthenticated = true;
    // SummarySidebar fetches /api/consultations/pending-ids on mount when authenticated
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.fetch as any).mockResolvedValue({ ok: true, json: async () => ({ pendingClinicIds: [], pendingConsultations: {} }) });
    render(<SummarySidebar {...defaultProps} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /request free consultation/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /request free consultation/i }));
    expect(screen.getByText(/request a free consultation with/i)).toBeInTheDocument();
  });

  // ── Confirm → API + UI flip ────────────────────────────────────────────────

  it('calls /api/consultations and shows "Consultation Requested" after confirming', async () => {
    isAuthenticated = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ pendingClinicIds: [], pendingConsultations: {} }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ emailSent: true }) })

    render(<SummarySidebar {...defaultProps} />);
    await waitFor(() => screen.getByRole('button', { name: /request free consultation/i }));
    fireEvent.click(screen.getByRole('button', { name: /request free consultation/i }));
    fireEvent.click(screen.getByRole('button', { name: /^request consultation$/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/consultations',
        expect.objectContaining({ method: 'POST' })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/consultation requested/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /request free consultation/i })).not.toBeInTheDocument();
    });
  });

  // ── API failure → UI stays unchanged ──────────────────────────────────────

  it('leaves the button visible when the API call fails', async () => {
    isAuthenticated = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ pendingClinicIds: [], pendingConsultations: {} }) })
      .mockResolvedValueOnce({ ok: false })

    render(<SummarySidebar {...defaultProps} />);
    await waitFor(() => screen.getByRole('button', { name: /request free consultation/i }));
    fireEvent.click(screen.getByRole('button', { name: /request free consultation/i }));
    fireEvent.click(screen.getByRole('button', { name: /^request consultation$/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /request free consultation/i })).toBeInTheDocument();
    });
  });
});

// ─── Cancellation behavior ─────────────────────────────────────────────────────

describe('SummarySidebar — cancellation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isAuthenticated = true;
    global.fetch = vi.fn();
    sessionStorage.clear();
  });

  // ── Pending state display ──────────────────────────────────────────────────

  it('shows "Consultation Requested" and "Cancel request" when clinic has a pending consultation', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        pendingClinicIds: ['clinic-test-id'],
        pendingConsultations: { 'clinic-test-id': 'consult-uuid' },
      }),
    });

    render(<SummarySidebar {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/consultation requested/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel request/i })).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /request free consultation/i })).not.toBeInTheDocument();
  });

  // ── Cancel modal ───────────────────────────────────────────────────────────

  it('opens the cancel confirmation modal when "Cancel request" is clicked', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        pendingClinicIds: ['clinic-test-id'],
        pendingConsultations: { 'clinic-test-id': 'consult-uuid' },
      }),
    });

    render(<SummarySidebar {...defaultProps} />);
    await waitFor(() => screen.getByRole('button', { name: /cancel request/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancel request/i }));

    expect(screen.getByText(/cancel your consultation request with/i)).toBeInTheDocument();
  });

  // ── Confirm cancel → API + UI revert ──────────────────────────────────────

  it('calls PATCH and reverts to "Request Free Consultation" after confirming cancellation', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          pendingClinicIds: ['clinic-test-id'],
          pendingConsultations: { 'clinic-test-id': 'consult-uuid' },
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, emailSent: true }) });

    render(<SummarySidebar {...defaultProps} />);
    await waitFor(() => screen.getByRole('button', { name: /cancel request/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancel request/i }));
    fireEvent.click(screen.getByRole('button', { name: /^cancel request$/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/consultations/consult-uuid',
        expect.objectContaining({ method: 'PATCH' })
      );
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /request free consultation/i })).toBeInTheDocument();
      expect(screen.queryByText(/consultation requested/i)).not.toBeInTheDocument();
    });
  });

  // ── PATCH failure → UI stays unchanged ────────────────────────────────────

  it('leaves "Consultation Requested" visible when the PATCH call fails', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          pendingClinicIds: ['clinic-test-id'],
          pendingConsultations: { 'clinic-test-id': 'consult-uuid' },
        }),
      })
      .mockResolvedValueOnce({ ok: false });

    render(<SummarySidebar {...defaultProps} />);
    await waitFor(() => screen.getByRole('button', { name: /cancel request/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancel request/i }));
    fireEvent.click(screen.getByRole('button', { name: /^cancel request$/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

    await waitFor(() => {
      expect(screen.getByText(/consultation requested/i)).toBeInTheDocument();
    });
  });
});
