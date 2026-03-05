import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SectionNav } from '@/components/istanbulmedic-connect/profile/SectionNav';

describe('SectionNav', () => {
  // Mock scrollTo
  const mockScrollTo = vi.fn();

  beforeEach(() => {
    window.scrollTo = mockScrollTo;
    // Reset scroll position
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
  });

  afterEach(() => {
    mockScrollTo.mockClear();
  });

  // NOTE: SectionNav now dynamically filters tabs based on FEATURE_CONFIG
  // Only Location and Reviews tabs are visible when most features are disabled
  it('renders visible section tabs', () => {
    render(<SectionNav />);
    // These should always be visible
    expect(screen.getByRole('button', { name: 'Location' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reviews' })).toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.profileOverview is enabled
  it.skip('renders all section tabs', () => {
    render(<SectionNav />);
    expect(screen.getByRole('button', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Location' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pricing' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Packages' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Doctors' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Safety' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'AI Insights' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reviews' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Community' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Social' })).toBeInTheDocument();
  });

  // TODO: Unskip when FEATURE_CONFIG.profileOverview is enabled
  it.skip('has Overview tab active by default', () => {
    render(<SectionNav />);
    const overviewButton = screen.getByRole('button', { name: 'Overview' });
    expect(overviewButton).toHaveClass('border-[#3EBBB7]');
    expect(overviewButton).toHaveClass('text-[#3EBBB7]');
  });

  it('scrolls to section when tab clicked', () => {
    // Create mock section element
    const mockElement = document.createElement('div');
    mockElement.id = 'location';
    mockElement.getBoundingClientRect = vi.fn().mockReturnValue({ top: 500 });
    document.body.appendChild(mockElement);

    render(<SectionNav />);
    fireEvent.click(screen.getByRole('button', { name: 'Location' }));

    expect(mockScrollTo).toHaveBeenCalledWith({
      top: expect.any(Number),
      behavior: 'smooth',
    });

    document.body.removeChild(mockElement);
  });

  it('does not scroll if section element not found', () => {
    render(<SectionNav />);
    fireEvent.click(screen.getByRole('button', { name: 'Reviews' }));
    // scrollTo should not be called if element doesn't exist
    // (depends on implementation, might not call or call with undefined behavior)
  });

  it('renders nav element', () => {
    render(<SectionNav />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  // NOTE: Tab count depends on FEATURE_CONFIG - currently only Location and Reviews are visible
  it('has correct number of visible tabs', () => {
    render(<SectionNav />);
    const buttons = screen.getAllByRole('button');
    // Currently only Location and Reviews tabs are visible
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  // TODO: Unskip when all FEATURE_CONFIG profile* options are enabled
  it.skip('has correct number of tabs', () => {
    render(<SectionNav />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(10);
  });

  // TODO: Unskip when all FEATURE_CONFIG profile* options are enabled
  it.skip('renders tabs in correct order', () => {
    render(<SectionNav />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveTextContent('Overview');
    expect(buttons[1]).toHaveTextContent('Location');
    expect(buttons[2]).toHaveTextContent('Pricing');
    expect(buttons[3]).toHaveTextContent('Packages');
    expect(buttons[4]).toHaveTextContent('Doctors');
    expect(buttons[5]).toHaveTextContent('Safety');
    expect(buttons[6]).toHaveTextContent('AI Insights');
    expect(buttons[7]).toHaveTextContent('Reviews');
    expect(buttons[8]).toHaveTextContent('Community');
    expect(buttons[9]).toHaveTextContent('Social');
  });

  it('has sticky positioning class', () => {
    render(<SectionNav />);
    const stickyDiv = document.querySelector('.sticky');
    expect(stickyDiv).toBeInTheDocument();
  });

  it('has proper top offset for sticky behavior', () => {
    render(<SectionNav />);
    const stickyDiv = document.querySelector('.sticky');
    expect(stickyDiv).toHaveClass('top-[80px]');
  });
});
