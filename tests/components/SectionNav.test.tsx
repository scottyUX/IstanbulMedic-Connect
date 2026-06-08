import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SectionNav } from '@/components/istanbulmedic-connect/profile/SectionNav';

describe('SectionNav', () => {
  // Mock scrollTo
  const mockScrollTo = vi.fn();

  // SectionNav's useEffect filters tabs to only those with a matching DOM element.
  // We add the section elements that FEATURE_CONFIG enables so buttons appear.
  const VISIBLE_SECTION_IDS = ['score-breakdown', 'overview', 'location', 'doctors', 'reviews', 'instagram-intel', 'hrn-signals', 'reddit-signals'];

  beforeEach(() => {
    window.scrollTo = mockScrollTo;
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
    for (const id of VISIBLE_SECTION_IDS) {
      const el = document.createElement('div');
      el.id = id;
      el.getBoundingClientRect = vi.fn().mockReturnValue({ top: 500 });
      document.body.appendChild(el);
    }
  });

  afterEach(() => {
    mockScrollTo.mockClear();
    for (const id of VISIBLE_SECTION_IDS) {
      document.getElementById(id)?.remove();
    }
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
    render(<SectionNav />);
    fireEvent.click(screen.getByRole('button', { name: 'Location' }));

    expect(mockScrollTo).toHaveBeenCalledWith({
      top: expect.any(Number),
      behavior: 'smooth',
    });
  });

  it('scrolls to section when Reviews tab clicked', () => {
    render(<SectionNav />);
    fireEvent.click(screen.getByRole('button', { name: 'Reviews' }));
    expect(mockScrollTo).toHaveBeenCalledWith({
      top: expect.any(Number),
      behavior: 'smooth',
    });
  });

  it('renders nav element', () => {
    render(<SectionNav />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('has correct number of visible tabs', () => {
    render(<SectionNav />);
    const buttons = screen.getAllByRole('button');
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
