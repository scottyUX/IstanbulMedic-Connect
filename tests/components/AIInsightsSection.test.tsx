import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AIInsightsSection } from '@/components/istanbulmedic-connect/profile/AIInsightsSection';

describe('AIInsightsSection', () => {
  it('renders insights when provided', () => {
    const insights = [
      'This clinic has excellent patient outcomes.',
      'Strong community presence on social media.',
    ];

    render(<AIInsightsSection insights={insights} />);

    expect(screen.getByText('AI Insights')).toBeInTheDocument();
    expect(screen.getByText('This clinic has excellent patient outcomes.')).toBeInTheDocument();
    expect(screen.getByText('Strong community presence on social media.')).toBeInTheDocument();
  });

  it('shows fallback message when no insights', () => {
    render(<AIInsightsSection insights={[]} />);

    expect(screen.getByText('AI Insights')).toBeInTheDocument();
    expect(
      screen.getByText(/No AI insights available yet/)
    ).toBeInTheDocument();
  });
});
