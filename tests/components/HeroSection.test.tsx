import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeroSection } from '@/components/istanbulmedic-connect/profile/HeroSection';

// Mock Next.js Image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

describe('HeroSection', () => {
  const defaultProps = {
    clinicName: 'Istanbul Hair Clinic',
    location: 'Istanbul, Turkey',
    images: [
      'https://example.com/img1.jpg',
      'https://example.com/img2.jpg',
      'https://example.com/img3.jpg',
    ],
    transparencyScore: 85,
    rating: 4.5,
    reviewCount: 25,
  };

  it('renders clinic name', () => {
    render(<HeroSection {...defaultProps} />);
    expect(screen.getByText('Istanbul Hair Clinic')).toBeInTheDocument();
  });

  it('renders location', () => {
    render(<HeroSection {...defaultProps} />);
    expect(screen.getByText('Istanbul, Turkey')).toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.profileTransparency is enabled
  it.skip('renders transparency score', () => {
    render(<HeroSection {...defaultProps} />);
    expect(screen.getByText(/Transparency 85/)).toBeInTheDocument();
  });

  it('renders rating when provided', () => {
    render(<HeroSection {...defaultProps} />);
    // Rating appears with 2 decimal places
    const elements = screen.getAllByText(/4\.50/);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('renders review count', () => {
    render(<HeroSection {...defaultProps} />);
    expect(screen.getByText('25 reviews')).toBeInTheDocument();
  });

  it('shows dash when rating is null', () => {
    render(<HeroSection {...defaultProps} rating={null} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.share and saveClinic are enabled
  it.skip('renders Share and Save buttons', () => {
    render(<HeroSection {...defaultProps} />);
    expect(screen.getByText('Share')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('renders Show all photos button when images exist', () => {
    render(<HeroSection {...defaultProps} />);
    expect(screen.getByText('Show all photos')).toBeInTheDocument();
  });

  it('shows placeholder when no images', () => {
    render(<HeroSection {...defaultProps} images={[]} />);
    expect(screen.getByText('No clinic photos uploaded yet')).toBeInTheDocument();
  });

  // Patient Favorite threshold updated to rating >= 4.8 and reviewCount >= 100
  it('shows Patient Favorite badge when rating >= 4.8 and reviewCount >= 100', () => {
    render(<HeroSection {...defaultProps} rating={4.9} reviewCount={150} />);
    expect(screen.getByText('Patient')).toBeInTheDocument();
    expect(screen.getByText('favorite')).toBeInTheDocument();
    expect(screen.getByText('One of the most loved clinics on Istanbul Medic Connect')).toBeInTheDocument();
  });

  it('does not show Patient Favorite badge when rating < 4.8', () => {
    render(<HeroSection {...defaultProps} rating={4.7} reviewCount={150} />);
    expect(screen.queryByText('One of the most loved clinics')).not.toBeInTheDocument();
  });

  it('does not show Patient Favorite badge when reviewCount < 100', () => {
    render(<HeroSection {...defaultProps} rating={4.9} reviewCount={50} />);
    expect(screen.queryByText('One of the most loved clinics')).not.toBeInTheDocument();
  });

  it('renders images with correct alt text', () => {
    render(<HeroSection {...defaultProps} />);
    expect(screen.getAllByAltText('Clinic Main View').length).toBeGreaterThan(0);
  });

  it('opens lightbox when Show all photos is clicked', () => {
    render(<HeroSection {...defaultProps} />);

    const showAllButton = screen.getByText('Show all photos');
    fireEvent.click(showAllButton);

    // Check for lightbox content (image counter)
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('limits images to 5', () => {
    const manyImages = [
      'https://example.com/img1.jpg',
      'https://example.com/img2.jpg',
      'https://example.com/img3.jpg',
      'https://example.com/img4.jpg',
      'https://example.com/img5.jpg',
      'https://example.com/img6.jpg',
      'https://example.com/img7.jpg',
    ];
    render(<HeroSection {...defaultProps} images={manyImages} />);

    // Open lightbox
    fireEvent.click(screen.getByText('Show all photos'));

    // Should show 1 / 5 (limited to 5)
    expect(screen.getByText('1 / 5')).toBeInTheDocument();
  });
});
