import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreBreakdownCard } from '@/components/istanbulmedic-connect/profile/ScoreBreakdownCard';

const makeComponent = (overrides: Partial<Parameters<typeof ScoreBreakdownCard>[0]> = {}) => ({
  overallScore: 72,
  band: 'B' as const,
  scoreComponents: [
    {
      component_key: 'reputation',
      score: 82,
      weight: 0.6,
      explanation: null,
    },
    {
      component_key: 'evidence_transparency',
      score: 58,
      weight: 0.4,
      explanation: null,
    },
  ],
  ...overrides,
});

describe('ScoreBreakdownCard', () => {
  it('renders the overall score', () => {
    render(<ScoreBreakdownCard {...makeComponent({ overallScore: 72 })} />);
    expect(screen.getByText('72')).toBeInTheDocument();
  });

  it('renders the band label', () => {
    render(<ScoreBreakdownCard {...makeComponent({ band: 'B' })} />);
    expect(screen.getByText(/B — Good/)).toBeInTheDocument();
  });

  it('renders band A as Excellent', () => {
    render(<ScoreBreakdownCard {...makeComponent({ overallScore: 90, band: 'A' })} />);
    expect(screen.getByText(/A — Excellent/)).toBeInTheDocument();
  });

  it('renders band C as Fair', () => {
    render(<ScoreBreakdownCard {...makeComponent({ overallScore: 50, band: 'C' })} />);
    expect(screen.getByText(/C — Fair/)).toBeInTheDocument();
  });

  it('renders band D as Limited', () => {
    render(<ScoreBreakdownCard {...makeComponent({ overallScore: 30, band: 'D' })} />);
    expect(screen.getByText(/D — Limited/)).toBeInTheDocument();
  });

  it('renders reputation pillar score', () => {
    render(<ScoreBreakdownCard {...makeComponent()} />);
    expect(screen.getByText('Reputation')).toBeInTheDocument();
    expect(screen.getByText('82')).toBeInTheDocument();
  });

  it('renders evidence & transparency pillar score', () => {
    render(<ScoreBreakdownCard {...makeComponent()} />);
    expect(screen.getByText('Evidence & Transparency')).toBeInTheDocument();
    expect(screen.getByText('58')).toBeInTheDocument();
  });

  it('renders correct weight percentages', () => {
    render(<ScoreBreakdownCard {...makeComponent()} />);
    expect(screen.getByText('60% weight')).toBeInTheDocument();
    expect(screen.getByText('40% weight')).toBeInTheDocument();
  });

  it('renders fallback message when no score components', () => {
    render(<ScoreBreakdownCard {...makeComponent({ scoreComponents: [] })} />);
    expect(screen.getByText(/Score breakdown not available yet/)).toBeInTheDocument();
  });

  it('renders without crashing when band is null', () => {
    render(<ScoreBreakdownCard {...makeComponent({ band: null })} />);
    expect(screen.getByText('72')).toBeInTheDocument();
  });

  it('renders the disclaimer text', () => {
    render(<ScoreBreakdownCard {...makeComponent()} />);
    expect(screen.getByText(/Scores are computed automatically/)).toBeInTheDocument();
  });
});
