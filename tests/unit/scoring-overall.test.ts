import { describe, it, expect } from 'vitest';
import { computeBand, computeOverallScore } from '@/lib/scoring/overall';

// ─── computeBand ──────────────────────────────────────────────────────────────

describe('computeBand — boundaries', () => {
  it('80 → A', () => expect(computeBand(80)).toBe('A'));
  it('100 → A', () => expect(computeBand(100)).toBe('A'));
  it('79 → B', () => expect(computeBand(79)).toBe('B'));
  it('70 → B', () => expect(computeBand(70)).toBe('B'));
  it('69 → C', () => expect(computeBand(69)).toBe('C'));
  it('60 → C', () => expect(computeBand(60)).toBe('C'));
  it('59 → D', () => expect(computeBand(59)).toBe('D'));
  it('0 → D',  () => expect(computeBand(0)).toBe('D'));
});

// ─── computeOverallScore ──────────────────────────────────────────────────────

describe('computeOverallScore — rounding and clamping', () => {
  it('rounds to nearest integer', () => {
    // 0.60*70 + 0.40*75 = 42 + 30 = 72
    expect(computeOverallScore(70, 75).overall_score).toBe(72);
  });

  it('clamps above 100', () => {
    expect(computeOverallScore(100, 100).overall_score).toBe(100);
  });

  it('clamps below 0', () => {
    expect(computeOverallScore(0, 0).overall_score).toBe(0);
  });

  it('band follows overall score', () => {
    // 0.60*80 + 0.40*80 = 80 → A
    const result = computeOverallScore(80, 80);
    expect(result.overall_score).toBe(80);
    expect(result.band).toBe('A');
  });

  it('exposes correct weights', () => {
    const result = computeOverallScore(50, 50);
    expect(result.reputation_weight).toBe(0.60);
    expect(result.evidence_transparency_weight).toBe(0.40);
  });
});
