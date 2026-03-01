import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReviewsSection } from '@/components/istanbulmedic-connect/profile/ReviewsSection';
import type { ReviewSource } from '@/lib/review-sources';

describe('ReviewsSection', () => {
  const sampleReviews: Array<{
    author: string;
    rating: number;
    date: string;
    text: string;
    verified: boolean;
    source: ReviewSource;
  }> = [
    {
      author: 'John D',
      rating: 5,
      date: 'Jan 2025',
      text: 'Excellent experience with great results!',
      verified: true,
      source: 'google',
    },
    {
      author: 'Sarah M',
      rating: 4,
      date: 'Dec 2024',
      text: 'Very good service, professional staff.',
      verified: false,
      source: 'trustpilot',
    },
  ];

  // Long review for testing truncation (over 250 characters)
  const longReview = {
    author: 'Michael R',
    rating: 5,
    date: 'Feb 2025',
    text: 'I had an absolutely wonderful experience at this clinic. The staff were incredibly professional and caring throughout my entire journey. From the initial consultation to the final follow-up, everything was handled with the utmost care and attention to detail. I would highly recommend this clinic to anyone considering treatment.',
    verified: true,
    source: 'google' as ReviewSource,
  };

  const defaultProps = {
    averageRating: 4.5,
    totalReviews: 25,
    reviews: sampleReviews,
  };

  it('renders average rating', () => {
    render(<ReviewsSection {...defaultProps} />);
    expect(screen.getByText('4.50')).toBeInTheDocument();
  });

  it('shows dash when average rating is null', () => {
    render(<ReviewsSection {...defaultProps} averageRating={null} />);
    const elements = screen.getAllByText('—');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('renders review count', () => {
    render(<ReviewsSection {...defaultProps} />);
    expect(screen.getByText(/25 reviews/)).toBeInTheDocument();
  });

  it('shows Patient Favorite for high rating with enough reviews', () => {
    render(<ReviewsSection {...defaultProps} averageRating={4.8} totalReviews={10} />);
    expect(screen.getByText('Patient Favorite')).toBeInTheDocument();
    expect(screen.getByText(/One of the top highly rated clinics/)).toBeInTheDocument();
  });

  it('shows Patient Reviews for lower rating', () => {
    render(<ReviewsSection {...defaultProps} averageRating={4.0} totalReviews={10} />);
    expect(screen.getByText('Patient Reviews')).toBeInTheDocument();
  });

  it('shows Patient Reviews when not enough reviews', () => {
    render(<ReviewsSection {...defaultProps} averageRating={4.8} totalReviews={3} />);
    expect(screen.getByText('Patient Reviews')).toBeInTheDocument();
  });

  it('shows no reviews message when totalReviews is 0', () => {
    render(<ReviewsSection {...defaultProps} totalReviews={0} reviews={[]} />);
    expect(screen.getByText(/No reviews yet/)).toBeInTheDocument();
  });

  it('renders review author names', () => {
    render(<ReviewsSection {...defaultProps} />);
    expect(screen.getAllByText('John D').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sarah M').length).toBeGreaterThan(0);
  });

  it('renders review dates', () => {
    render(<ReviewsSection {...defaultProps} />);
    expect(screen.getAllByText('Jan 2025').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Dec 2024').length).toBeGreaterThan(0);
  });

  it('renders review text', () => {
    render(<ReviewsSection {...defaultProps} />);
    expect(screen.getAllByText('Excellent experience with great results!').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Very good service, professional staff.').length).toBeGreaterThan(0);
  });

  it('shows Verified badge for verified reviews', () => {
    render(<ReviewsSection {...defaultProps} />);
    // Only one review is verified
    const verifiedElements = screen.getAllByText('Verified');
    expect(verifiedElements.length).toBeGreaterThan(0);
  });

  it('renders author initials', () => {
    render(<ReviewsSection {...defaultProps} />);
    // First letter of each author name
    const johnInitials = screen.getAllByText('J');
    const sarahInitials = screen.getAllByText('S');
    expect(johnInitials.length).toBeGreaterThan(0);
    expect(sarahInitials.length).toBeGreaterThan(0);
  });

  it('renders Show more button only for long reviews', () => {
    // Short reviews should NOT have Show more button
    render(<ReviewsSection {...defaultProps} />);
    expect(screen.queryByText('Show more')).not.toBeInTheDocument();
  });

  it('renders Show more button for reviews over 250 characters', () => {
    render(<ReviewsSection {...defaultProps} reviews={[...sampleReviews, longReview]} />);
    const showMoreButtons = screen.getAllByText('Show more');
    expect(showMoreButtons.length).toBe(1); // Only the long review should have it
  });

  it('renders Show all reviews button', () => {
    render(<ReviewsSection {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Show all 25 reviews/i })).toBeInTheDocument();
  });

  it('handles single review count grammar', () => {
    render(<ReviewsSection {...defaultProps} totalReviews={1} />);
    expect(screen.getByText(/Based on 1 patient review\./)).toBeInTheDocument();
  });

  it('handles multiple reviews count grammar', () => {
    render(<ReviewsSection {...defaultProps} totalReviews={5} averageRating={4.0} />);
    // When rating is lower or few reviews, shows "Based on X patient reviews"
    expect(screen.getByText(/5 patient reviews/)).toBeInTheDocument();
  });
});
