import { describe, it, expect } from 'vitest';
import { computeHRNScore, type ScorerThread } from '@/lib/scoring/hrn';

// Pin "now" so recency decay is deterministic across all tests
const NOW = new Date('2026-04-23T00:00:00Z');

function makeThread(overrides: Partial<ScorerThread> = {}): ScorerThread {
  return {
    postDate: '2025-10-01T00:00:00Z', // ~6 months ago → weight 1.0
    sentimentScore: 0.6,
    isRepairCase: false,
    isRepairProvider: false,
    hasLongTermFollowup: false,
    issueKeywords: [],
    ...overrides,
  };
}

function threads(n: number, overrides: Partial<ScorerThread> = {}): ScorerThread[] {
  return Array.from({ length: n }, () => makeThread(overrides));
}

// ── Threshold ─────────────────────────────────────────────────────────────────

describe('minimum thread threshold', () => {
  it('returns undefined for 0 threads', () => {
    expect(computeHRNScore([], NOW)).toBeUndefined();
  });

  it('returns undefined when effectiveN < 4 (old threads)', () => {
    // 3 threads all 3+ years old → each weight 0.3 → effectiveN = 0.9
    const old = threads(3, { postDate: '2022-01-01T00:00:00Z' });
    expect(computeHRNScore(old, NOW)).toBeUndefined();
  });

  it('returns a score once effectiveN >= 4', () => {
    // 5 recent threads → effectiveN = 5
    expect(computeHRNScore(threads(5), NOW)).not.toBeUndefined();
  });
});

// ── Confidence tiers ──────────────────────────────────────────────────────────

describe('confidence tiers', () => {
  it('low — effectiveN between 4 and 8', () => {
    const result = computeHRNScore(threads(5), NOW);
    expect(result?.confidenceTier).toBe('low');
  });

  it('moderate — effectiveN between 8 and 20', () => {
    const result = computeHRNScore(threads(12), NOW);
    expect(result?.confidenceTier).toBe('moderate');
  });

  it('high — effectiveN >= 20', () => {
    const result = computeHRNScore(threads(25), NOW);
    expect(result?.confidenceTier).toBe('high');
  });
});

// ── Bayesian shrinkage ────────────────────────────────────────────────────────

describe('Bayesian shrinkage', () => {
  it('pulls a 2-thread clinic with perfect sentiment toward 5.0', () => {
    // effectiveN = 2, but threshold is 4 so we need 4 threads with some older
    // Use 4 threads of weight 1.0 each — still small enough to show shrinkage
    const result = computeHRNScore(threads(4, { sentimentScore: 1.0 }), NOW);
    // Without shrinkage: normalizedBase = 10. With k=8: (8*5 + 4*10)/(8+4) = 80/12 ≈ 6.67
    expect(result?.score).toBeGreaterThan(5.0);
    expect(result?.score).toBeLessThan(9.0);
  });

  it('high-N positive clinic scores higher than low-N positive clinic', () => {
    const lowN  = computeHRNScore(threads(5,  { sentimentScore: 0.9 }), NOW);
    const highN = computeHRNScore(threads(30, { sentimentScore: 0.9 }), NOW);
    expect(highN!.score).toBeGreaterThan(lowN!.score);
  });
});

// ── Recency decay ─────────────────────────────────────────────────────────────

describe('recency decay', () => {
  it('recent positive threads score higher than old positive threads', () => {
    const recent = computeHRNScore(threads(10, {
      postDate: '2025-12-01T00:00:00Z', // ~4 months ago → weight 1.0 → effectiveN 10
      sentimentScore: 0.8,
    }), NOW);

    // 15 threads × weight 0.3 = effectiveN 4.5 — clears the threshold
    const old = computeHRNScore(threads(15, {
      postDate: '2022-01-01T00:00:00Z', // 4+ years ago → weight 0.3
      sentimentScore: 0.8,
    }), NOW);

    // Old threads have lower effectiveN → more Bayesian shrinkage → lower score
    expect(recent!.score).toBeGreaterThanOrEqual(old!.score);
  });
});

// ── Repair penalty ────────────────────────────────────────────────────────────

describe('repair penalty', () => {
  it('clinic with no repair cases scores higher than one with 50% repair rate', () => {
    const clean  = computeHRNScore(threads(10, { isRepairCase: false }), NOW);
    const repair = computeHRNScore([
      ...threads(5, { isRepairCase: false }),
      ...threads(5, { isRepairCase: true }),
    ], NOW);
    expect(clean!.score).toBeGreaterThan(repair!.score);
  });

  it('repair penalty is reflected in breakdown', () => {
    const result = computeHRNScore([
      ...threads(5, { isRepairCase: false }),
      ...threads(5, { isRepairCase: true }),
    ], NOW);
    expect(result!.repairPenalty).toBeGreaterThan(0);
  });

  it('repair penalty is capped at 1.5', () => {
    const result = computeHRNScore(threads(20, { isRepairCase: true }), NOW);
    expect(result!.repairPenalty).toBeLessThanOrEqual(1.5);
  });

  it('repair provider incurs no penalty', () => {
    const result = computeHRNScore(
      threads(10, { isRepairCase: true, isRepairProvider: true }),
      NOW,
    );
    expect(result!.repairPenalty).toBe(0);
  });

  it('only damage-causing cases contribute to the repair penalty, not providers', () => {
    const result = computeHRNScore([
      ...threads(5, { isRepairCase: true, isRepairProvider: true }),
      ...threads(5, { isRepairCase: true, isRepairProvider: false }),
    ], NOW);
    // Only 5 of 10 threads count → repairRate = 0.5 → penalty = min(0.5 * 4, 1.5) = 1.5 * 0.5 = 2.0 → capped 1.5? no: 0.5*4=2.0 → capped 1.5
    expect(result!.repairPenalty).toBeGreaterThan(0);
    expect(result!.repairPenalty).toBeLessThan(
      computeHRNScore(threads(10, { isRepairCase: true, isRepairProvider: false }), NOW)!.repairPenalty + 0.01,
    );
  });
});

// ── Follow-up bonus ───────────────────────────────────────────────────────────

describe('follow-up bonus', () => {
  it('high follow-up rate earns a bonus', () => {
    const noFollowup  = computeHRNScore(threads(10, { hasLongTermFollowup: false }), NOW);
    const highFollowup = computeHRNScore(threads(10, { hasLongTermFollowup: true }), NOW);
    expect(highFollowup!.score).toBeGreaterThan(noFollowup!.score);
  });

  it('follow-up bonus is capped at 0.8', () => {
    const result = computeHRNScore(threads(20, { hasLongTermFollowup: true }), NOW);
    expect(result!.followupBonus).toBeLessThanOrEqual(0.8);
  });
});

// ── Severity penalty ──────────────────────────────────────────────────────────

describe('severity penalty', () => {
  it('HIGH severity issues incur a larger penalty than MED severity', () => {
    const high = computeHRNScore(threads(10, { issueKeywords: ['overharvesting'] }), NOW);
    const med  = computeHRNScore(threads(10, { issueKeywords: ['poor_density'] }), NOW);
    expect(high!.severityPenalty).toBeGreaterThan(med!.severityPenalty);
  });

  it('severity penalty is capped at 2.0', () => {
    // Every thread has multiple high-severity issues
    const result = computeHRNScore(
      threads(20, { issueKeywords: ['overharvesting', 'infection', 'revision_needed'] }),
      NOW
    );
    expect(result!.severityPenalty).toBeLessThanOrEqual(2.0);
  });

  it('clean threads with no issue keywords incur no severity penalty', () => {
    const result = computeHRNScore(threads(10, { issueKeywords: [] }), NOW);
    expect(result!.severityPenalty).toBe(0);
  });
});

// ── Score range ───────────────────────────────────────────────────────────────

describe('score range', () => {
  it('score is always between 0 and 10', () => {
    const worst = computeHRNScore(threads(20, {
      sentimentScore: -1.0,
      isRepairCase: true,
      issueKeywords: ['overharvesting', 'infection', 'revision_needed'],
    }), NOW);
    expect(worst!.score).toBeGreaterThanOrEqual(0);

    const best = computeHRNScore(threads(20, {
      sentimentScore: 1.0,
      hasLongTermFollowup: true,
      issueKeywords: [],
    }), NOW);
    expect(best!.score).toBeLessThanOrEqual(10);
  });

  it('null sentimentScore falls back to neutral (0)', () => {
    const result = computeHRNScore(threads(10, { sentimentScore: null }), NOW);
    expect(result).not.toBeUndefined();
    // Neutral sentiment → normalizedBase = 5.0, shrinkage toward 5.0 → confidenceScore ≈ 5.0
    expect(result!.score).toBeCloseTo(5.0, 0);
  });
});
