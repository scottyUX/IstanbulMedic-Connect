import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LocationInfoSection } from '@/components/istanbulmedic-connect/profile/LocationInfoSection';

describe('LocationInfoSection', () => {
  const defaultProps = {
    address: '123 Medical Street, Istanbul',
    lat: 41.0082,
    lng: 28.9784,
    openingHours: [
      { day: 'Monday - Friday', hours: '9:00 AM - 6:00 PM' },
      { day: 'Saturday', hours: '10:00 AM - 2:00 PM' },
    ],
    languages: ['English', 'Turkish'],
    paymentMethods: ['Credit Card', 'Cash', 'Insurance'],
    services: {
      accommodation: true,
      airportTransfer: true,
    },
  };

  it('renders with full data', () => {
    render(<LocationInfoSection {...defaultProps} />);

    expect(screen.getByText('123 Medical Street, Istanbul')).toBeInTheDocument();
    expect(screen.getByText('Monday - Friday')).toBeInTheDocument();
    expect(screen.getByText('9:00 AM - 6:00 PM')).toBeInTheDocument();
    // TODO: Unskip language/payment assertions when FEATURE_CONFIG.profileLanguages/profilePaymentMethods are enabled
    // expect(screen.getByText('English')).toBeInTheDocument();
    // expect(screen.getByText('Credit Card')).toBeInTheDocument();
  });

  it('shows fallback message for empty opening hours', () => {
    render(<LocationInfoSection {...defaultProps} openingHours={[]} />);

    expect(screen.getByText('Contact clinic for hours')).toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.profilePaymentMethods is enabled
  it.skip('shows fallback message for empty payment methods', () => {
    render(<LocationInfoSection {...defaultProps} paymentMethods={[]} />);

    expect(screen.getByText('Contact clinic for payment options')).toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.profileServices is enabled
  it.skip('shows fallback message for null services', () => {
    render(<LocationInfoSection {...defaultProps} services={null} />);

    expect(screen.getByText('Contact clinic for service details')).toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.profileLanguages is enabled
  it.skip('shows fallback message for empty languages', () => {
    render(<LocationInfoSection {...defaultProps} languages={[]} />);

    expect(screen.getByText('Contact clinic for language support')).toBeInTheDocument();
  });

  it('shows map placeholder when coordinates are null', () => {
    render(<LocationInfoSection {...defaultProps} lat={null} lng={null} />);

    expect(screen.getByText('Map location not available')).toBeInTheDocument();
    // Should not have an iframe
    expect(screen.queryByTitle('Clinic Location')).not.toBeInTheDocument();
  });

  it('renders map when coordinates are provided', () => {
    render(<LocationInfoSection {...defaultProps} />);

    expect(screen.getByTitle('Clinic Location')).toBeInTheDocument();
  });
});
