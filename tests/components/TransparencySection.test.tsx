import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransparencySection } from '@/components/istanbulmedic-connect/profile/TransparencySection';

describe('TransparencySection', () => {
  const defaultItems = [
    { title: 'JCI Accredited', description: 'International healthcare accreditation', verified: true },
    { title: 'ISO Certified', description: 'Quality management certification', verified: true },
  ];

  it('renders items when provided', () => {
    render(<TransparencySection transparencyScore={85} items={defaultItems} />);

    expect(screen.getByText('Transparency & Safety')).toBeInTheDocument();
    expect(screen.getByText('JCI Accredited')).toBeInTheDocument();
    expect(screen.getByText('ISO Certified')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument(); // score
  });

  it('shows fallback message when no items', () => {
    render(<TransparencySection transparencyScore={0} items={[]} />);

    expect(screen.getByText('Transparency & Safety')).toBeInTheDocument();
    expect(
      screen.getByText(/No verified credentials available yet/)
    ).toBeInTheDocument();
  });
});
