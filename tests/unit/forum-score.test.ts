import { describe, it, expect } from 'vitest';
import { computeForumScore, type ForumScorerThread } from '@/lib/scoring/forum';

// Pin "now" so recency decay is deterministic across all tests
const NOW = new Date('2026-04-30T00:00:00Z');

function makeThread(overrides: Partial<ForumScorerThread> = {}): ForumScorerThread {
  return {
    postDate: '2025-10-01T00:00:00Z', // ~6 months ago → weight 1.0
    sentimentScore: 0.6,
    sentimentLabel: 'positive',
    isRepairCase: false,
    issueKeywords: [],
    hasLongtermUpdate: false,
    ...overrides,
  };
}

function threads(n: number, overrides: Partial<ForumScorerThread> = {}): ForumScorerThread[] {
  return Array.from({ length: n }, () => makeThread(overrides));
}

// ── Threshold ─────────────────────────────────────────────────────────────────

describe('minimum thread threshold', () => {
  it('returns undefined for 0 threads', () => {
    expect(computeForumScore([], NOW)).toBeUndefined();
  });

  it('returns undefined when effectiveN < 3 (old threads)', () => {
    // 3 threads all 3+ years old → each weight 0.3 → effectiveN = 0.9
    const old = threads(3, { postDate: '2022-01-01T00:00:00Z' });
    expect(computeForumScore(old, NOW)).toBeUndefined();
  });

  it('returns a score once effectiveN >= 3', () => {
    // 4 recent threads → effectiveN = 4
    expect(computeForumScore(threads(4), NOW)).not.toBeUndefined();
  });
});

// ── Confidence tiers ──────────────────────────────────────────────────────────

describe('confidence tiers', () => {
  it('low — effectiveN between 3 and 6', () => {
    const result = computeForumScore(threads(4), NOW);
    expect(result?.confidenceTier).toBe('low');
  });

  it('moderate — effectiveN between 6 and 15', () => {
    const result = computeForumScore(threads(10), NOW);
    expect(result?.confidenceTier).toBe('moderate');
  });

  it('high — effectiveN >= 15', () => {
    const result = computeForumScore(threads(20), NOW);
    expect(result?.confidenceTier).toBe('high');
  });
});

// ── Bayesian shrinkage ────────────────────────────────────────────────────────

describe('Bayesian shrinkage', () => {
  it('pulls a low-N clinic with perfect sentiment toward 5.0', () => {
    const result = computeForumScore(threads(4, { sentimentScore: 1.0 }), NOW);
    // Without shrinkage: normalizedBase = 10. With k=6: (6*5 + 4*10)/(6+4) = 70/10 = 7.0
    expect(result?.score).toBeGreaterThan(5.0);
    expect(result?.score).toBeLessThan(9.0);
  });

  it('high-N positive clinic scores higher than low-N positive clinic', () => {
    const lowN  = computeForumScore(threads(4,  { sentimentScore: 0.9 }), NOW);
    const highN = computeForumScore(threads(30, { sentimentScore: 0.9 }), NOW);
    expect(highN!.score).toBeGreaterThan(lowN!.score);
  });
});

// ── Recency decay ─────────────────────────────────────────────────────────────

describe('recency decay', () => {
  it('recent positive threads score higher than old positive threads', () => {
    const recent = computeForumScore(threads(10, {
      postDate: '2025-12-01T00:00:00Z', // ~5 months ago → weight 1.0
      sentimentScore: 0.8,
    }), NOW);

    // 15 threads × weight 0.3 = effectiveN 4.5 — clears the threshold
    const old = computeForumScore(threads(15, {
      postDate: '2022-01-01T00:00:00Z', // 4+ years ago → weight 0.3
      sentimentScore: 0.8,
    }), NOW);

    // Old threads have lower effectiveN → more Bayesian shrinkage → lower score
    expect(recent!.score).toBeGreaterThanOrEqual(old!.score);
  });

  it('null postDate uses conservative weight (over3yr)', () => {
    // 11 × 0.3 = 3.3 → clears MIN_EFFECTIVE_N=3 without floating-point precision issues
    const result = computeForumScore(threads(11, { postDate: null }), NOW);
    expect(result).not.toBeUndefined();
  });
});

// ── Repair penalty ────────────────────────────────────────────────────────────

describe('repair penalty', () => {
  it('clinic with no repair cases scores higher than one with 50% repair rate', () => {
    const clean  = computeForumScore(threads(10, { isRepairCase: false }), NOW);
    const repair = computeForumScore([
      ...threads(5, { isRepairCase: false }),
      ...threads(5, { isRepairCase: true }),
    ], NOW);
    expect(clean!.score).toBeGreaterThan(repair!.score);
  });

  it('repair penalty is reflected in breakdown', () => {
    const result = computeForumScore([
      ...threads(5, { isRepairCase: false }),
      ...threads(5, { isRepairCase: true }),
    ], NOW);
    expect(result!.repairPenalty).toBeGreaterThan(0);
  });

  it('repair penalty is capped at 1.5', () => {
    const result = computeForumScore(threads(20, { isRepairCase: true }), NOW);
    expect(result!.repairPenalty).toBeLessThanOrEqual(1.5);
  });
});

// ── Follow-up bonus ───────────────────────────────────────────────────────────

describe('follow-up bonus', () => {
  it('high follow-up rate earns a bonus', () => {
    const noFollowup   = computeForumScore(threads(10, { hasLongtermUpdate: false }), NOW);
    const highFollowup = computeForumScore(threads(10, { hasLongtermUpdate: true  }), NOW);
    expect(highFollowup!.score).toBeGreaterThan(noFollowup!.score);
  });

  it('follow-up bonus is capped at 0.8', () => {
    const result = computeForumScore(threads(20, { hasLongtermUpdate: true }), NOW);
    expect(result!.followupBonus).toBeLessThanOrEqual(0.8);
  });
});

// ── Severity penalty ──────────────────────────────────────────────────────────

describe('severity penalty', () => {
  it('HIGH severity issues incur a larger penalty than MED severity', () => {
    const high = computeForumScore(threads(10, { issueKeywords: ['overharvesting'] }), NOW);
    const med  = computeForumScore(threads(10, { issueKeywords: ['poor_density']   }), NOW);
    expect(high!.severityPenalty).toBeGreaterThan(med!.severityPenalty);
  });

  it('severity penalty is capped at 2.0', () => {
    const result = computeForumScore(
      threads(20, { issueKeywords: ['overharvesting', 'infection', 'revision_needed'] }),
      NOW,
    );
    expect(result!.severityPenalty).toBeLessThanOrEqual(2.0);
  });

  it('clean threads with no issue keywords incur no severity penalty', () => {
    const result = computeForumScore(threads(10, { issueKeywords: [] }), NOW);
    expect(result!.severityPenalty).toBe(0);
  });

  it('thread with both HIGH and MED keywords contributes HIGH penalty only (no stacking)', () => {
    const both = computeForumScore(
      threads(10, { issueKeywords: ['overharvesting', 'poor_density'] }),
      NOW,
    );
    const highOnly = computeForumScore(
      threads(10, { issueKeywords: ['overharvesting'] }),
      NOW,
    );
    expect(both!.severityPenalty).toBe(highOnly!.severityPenalty);
  });

  it('thread with two HIGH keywords contributes one HIGH penalty (no stacking)', () => {
    const twoHigh = computeForumScore(
      threads(10, { issueKeywords: ['overharvesting', 'infection'] }),
      NOW,
    );
    const oneHigh = computeForumScore(
      threads(10, { issueKeywords: ['overharvesting'] }),
      NOW,
    );
    expect(twoHigh!.severityPenalty).toBe(oneHigh!.severityPenalty);
  });
});

// ── Sentiment fallback ────────────────────────────────────────────────────────

describe('sentiment fallback', () => {
  it('null sentimentScore falls back to sentimentLabel weight', () => {
    const fromScore = computeForumScore(
      threads(10, { sentimentScore: 1, sentimentLabel: 'positive' }),
      NOW,
    );
    const fromLabel = computeForumScore(
      threads(10, { sentimentScore: null, sentimentLabel: 'positive' }),
      NOW,
    );
    expect(fromLabel!.score).toBeCloseTo(fromScore!.score, 0);
  });

  it('null sentimentScore and null sentimentLabel falls back to neutral (0)', () => {
    const result = computeForumScore(
      threads(10, { sentimentScore: null, sentimentLabel: null }),
      NOW,
    );
    expect(result).not.toBeUndefined();
    // Neutral sentiment → normalizedBase ≈ 5.0 → score close to 5.0
    expect(result!.score).toBeCloseTo(5.0, 0);
  });
});

// ── Score range ───────────────────────────────────────────────────────────────

describe('score range', () => {
  it('score is always between 0 and 10', () => {
    const worst = computeForumScore(threads(20, {
      sentimentScore: -1.0,
      isRepairCase: true,
      issueKeywords: ['overharvesting', 'infection', 'revision_needed'],
    }), NOW);
    expect(worst!.score).toBeGreaterThanOrEqual(0);

    const best = computeForumScore(threads(20, {
      sentimentScore: 1.0,
      hasLongtermUpdate: true,
      issueKeywords: [],
    }), NOW);
    expect(best!.score).toBeLessThanOrEqual(10);
  });
});
