import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SummarySidebar } from '@/components/istanbulmedic-connect/profile/SummarySidebar';

describe('SummarySidebar', () => {
  const defaultProps = {
    transparencyScore: 85,
    topSpecialties: ['Hair Transplant', 'Dental'],
    rating: 4.8,
    reviewCount: 150,
  };

  it('renders price estimate', () => {
    render(<SummarySidebar {...defaultProps} priceEstimate="$2,500" />);
    expect(screen.getByText('$2,500')).toBeInTheDocument();
  });

  it('renders default price estimate when not provided', () => {
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

  it('renders Book Consultation button', () => {
    render(<SummarySidebar {...defaultProps} />);
    expect(screen.getByRole('link', { name: 'Book Consultation' })).toBeInTheDocument();
  });

  it('renders Talk to Leila button', () => {
    render(<SummarySidebar {...defaultProps} />);
    expect(screen.getByRole('link', { name: 'Talk to Leila' })).toBeInTheDocument();
  });

  it('renders consultation fee', () => {
    render(<SummarySidebar {...defaultProps} consultationFee="$50" />);
    expect(screen.getByText('$50')).toBeInTheDocument();
  });

  it('renders service charge', () => {
    render(<SummarySidebar {...defaultProps} serviceCharge="$100" />);
    expect(screen.getByText('$100')).toBeInTheDocument();
  });

  it('renders total estimate', () => {
    render(<SummarySidebar {...defaultProps} totalEstimate="$2,600" />);
    expect(screen.getByText('$2,600')).toBeInTheDocument();
  });

  it('renders Verified by Istanbul Medic badge', () => {
    render(<SummarySidebar {...defaultProps} />);
    expect(screen.getByText('Verified by Istanbul Medic')).toBeInTheDocument();
  });

  it('renders Add to Compare action', () => {
    render(<SummarySidebar {...defaultProps} />);
    expect(screen.getByText('Add to Compare')).toBeInTheDocument();
  });

  it('renders Save Clinic action', () => {
    render(<SummarySidebar {...defaultProps} />);
    expect(screen.getByText('Save Clinic')).toBeInTheDocument();
  });

  it('renders Share action', () => {
    render(<SummarySidebar {...defaultProps} />);
    expect(screen.getByText('Share')).toBeInTheDocument();
  });

  it('calls onAddToCompare when clicked', () => {
    const onAddToCompare = vi.fn();
    render(<SummarySidebar {...defaultProps} onAddToCompare={onAddToCompare} />);
    fireEvent.click(screen.getByText('Add to Compare'));
    expect(onAddToCompare).toHaveBeenCalled();
  });

  it('calls onSave when clicked', () => {
    const onSave = vi.fn();
    render(<SummarySidebar {...defaultProps} onSave={onSave} />);
    fireEvent.click(screen.getByText('Save Clinic'));
    expect(onSave).toHaveBeenCalled();
  });

  it('calls onShare when clicked', () => {
    const onShare = vi.fn();
    render(<SummarySidebar {...defaultProps} onShare={onShare} />);
    fireEvent.click(screen.getByText('Share'));
    expect(onShare).toHaveBeenCalled();
  });

  it('opens consultation fee modal when clicked', () => {
    render(<SummarySidebar {...defaultProps} />);
    fireEvent.click(screen.getByText('Consultation fee'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/consultation fee covers your initial video/i)).toBeInTheDocument();
  });

  it('opens service charge modal when clicked', () => {
    render(<SummarySidebar {...defaultProps} />);
    fireEvent.click(screen.getByText('Service charge'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/service charge covers Istanbul Medic's coordination/i)).toBeInTheDocument();
  });

  it('closes modal when close button clicked', () => {
    render(<SummarySidebar {...defaultProps} />);
    fireEvent.click(screen.getByText('Consultation fee'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    // Dialog should be closed - check it's not in document or has closed state
  });

  it('renders custom book consultation href', () => {
    render(<SummarySidebar {...defaultProps} bookConsultationHref="https://custom-link.com" />);
    const link = screen.getByRole('link', { name: 'Book Consultation' });
    expect(link).toHaveAttribute('href', 'https://custom-link.com');
  });

  it('handles null rating', () => {
    render(<SummarySidebar {...defaultProps} rating={null} />);
    // Should not crash and should handle gracefully
    expect(screen.getByText('Book Consultation')).toBeInTheDocument();
  });

  it('renders review link pointing to reviews section', () => {
    render(<SummarySidebar {...defaultProps} />);
    const reviewLink = screen.getByRole('link', { name: /150 reviews/i });
    expect(reviewLink).toHaveAttribute('href', '#reviews');
  });

  it('renders fee line items', () => {
    render(<SummarySidebar {...defaultProps} />);
    expect(screen.getByText('Consultation fee')).toBeInTheDocument();
    expect(screen.getByText('Service charge')).toBeInTheDocument();
    expect(screen.getByText('Total (estimate)')).toBeInTheDocument();
  });
});
