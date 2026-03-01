import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReviewsSection, sortReviews, parseReviewDate } from '@/components/istanbulmedic-connect/profile/ReviewsSection';
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

describe('sortReviews', () => {
  const reviewsToSort: Array<{
    author: string;
    rating: number;
    date: string;
    text: string;
    verified: boolean;
    source: ReviewSource;
  }> = [
    { author: 'A', rating: 3, date: 'Jan 15, 2025', text: 'OK', verified: true, source: 'google' },
    { author: 'B', rating: 5, date: 'Feb 20, 2025', text: 'Great', verified: true, source: 'google' },
    { author: 'C', rating: 1, date: 'Dec 10, 2024', text: 'Bad', verified: false, source: 'trustpilot' },
    { author: 'D', rating: 4, date: 'Mar 1, 2025', text: 'Good', verified: true, source: 'google' },
  ];

  it('sorts by most recent (newest first)', () => {
    const sorted = sortReviews(reviewsToSort, 'most_recent');
    expect(sorted[0].author).toBe('D'); // Mar 1, 2025
    expect(sorted[1].author).toBe('B'); // Feb 20, 2025
    expect(sorted[2].author).toBe('A'); // Jan 15, 2025
    expect(sorted[3].author).toBe('C'); // Dec 10, 2024
  });

  it('sorts by highest rated', () => {
    const sorted = sortReviews(reviewsToSort, 'highest_rated');
    expect(sorted[0].rating).toBe(5);
    expect(sorted[1].rating).toBe(4);
    expect(sorted[2].rating).toBe(3);
    expect(sorted[3].rating).toBe(1);
  });

  it('sorts by lowest rated', () => {
    const sorted = sortReviews(reviewsToSort, 'lowest_rated');
    expect(sorted[0].rating).toBe(1);
    expect(sorted[1].rating).toBe(3);
    expect(sorted[2].rating).toBe(4);
    expect(sorted[3].rating).toBe(5);
  });

  it('does not mutate original array', () => {
    const original = [...reviewsToSort];
    sortReviews(reviewsToSort, 'highest_rated');
    expect(reviewsToSort).toEqual(original);
  });
});

describe('parseReviewDate', () => {
  it('parses valid date strings', () => {
    const result = parseReviewDate('Jan 15, 2025');
    expect(result).toBeGreaterThan(0);
  });

  it('returns 0 for invalid date strings', () => {
    expect(parseReviewDate('Unknown date')).toBe(0);
    expect(parseReviewDate('')).toBe(0);
  });

  it('handles various date formats', () => {
    expect(parseReviewDate('2025-01-15')).toBeGreaterThan(0);
    expect(parseReviewDate('January 15, 2025')).toBeGreaterThan(0);
  });
});

describe('ReviewsSection modal search', () => {
  const searchableReviews: Array<{
    author: string;
    rating: number;
    date: string;
    text: string;
    verified: boolean;
    source: ReviewSource;
  }> = [
    { author: 'Patient', rating: 5, date: 'Jan 2025', text: 'Great hair transplant results!', verified: true, source: 'google' },
    { author: 'Patient', rating: 4, date: 'Dec 2024', text: 'Professional dental work.', verified: true, source: 'trustpilot' },
    { author: 'Patient', rating: 3, date: 'Nov 2024', text: 'Average experience overall.', verified: false, source: 'google' },
  ];

  const defaultProps = {
    averageRating: 4.0,
    totalReviews: 3,
    reviews: searchableReviews,
  };

  it('filters reviews by text in modal search', async () => {
    render(<ReviewsSection {...defaultProps} />);

    // Open the modal
    fireEvent.click(screen.getByRole('button', { name: /Show all 3 reviews/i }));

    // Find search input and type
    const searchInput = screen.getByPlaceholderText('Search reviews');
    fireEvent.change(searchInput, { target: { value: 'hair' } });

    // Should show filtered results header
    expect(screen.getByText(/1 result for "hair"/)).toBeInTheDocument();
  });

  it('shows no results message when search matches nothing', () => {
    render(<ReviewsSection {...defaultProps} />);

    // Open the modal
    fireEvent.click(screen.getByRole('button', { name: /Show all 3 reviews/i }));

    // Search for something that doesn't exist
    const searchInput = screen.getByPlaceholderText('Search reviews');
    fireEvent.change(searchInput, { target: { value: 'xyz123nonexistent' } });

    // Should show no results message
    expect(screen.getByText('No reviews match your search.')).toBeInTheDocument();
  });

  it('clears search when clear button is clicked', () => {
    render(<ReviewsSection {...defaultProps} />);

    // Open the modal
    fireEvent.click(screen.getByRole('button', { name: /Show all 3 reviews/i }));

    // Search for something that doesn't exist
    const searchInput = screen.getByPlaceholderText('Search reviews');
    fireEvent.change(searchInput, { target: { value: 'xyz123nonexistent' } });

    // Click clear search
    fireEvent.click(screen.getByText('Clear search'));

    // Should show all reviews again
    expect(screen.getByText('3 reviews')).toBeInTheDocument();
  });
});
