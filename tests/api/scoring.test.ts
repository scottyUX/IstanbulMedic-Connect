import { describe, it, expect } from 'vitest';
import { computeGoogleMetrics } from '@/lib/scoring/metrics/google';
import { computeRedditMetrics } from '@/lib/scoring/metrics/reddit';
import { computeInstagramMetrics } from '@/lib/scoring/metrics/instagram';
import { computeRegistryMetrics } from '@/lib/scoring/metrics/registry';
import { computeCredentialsMetrics } from '@/lib/scoring/metrics/credentials';
import { computeGoogleSourceScore } from '@/lib/scoring/sources/google';
import { computeReputationScore } from '@/lib/scoring/pillars/reputation';
import { computeEvidenceTransparencyScore } from '@/lib/scoring/pillars/evidenceTransparency';
import { computeOverallScore, computeBand } from '@/lib/scoring/overall';

// ─────────────────────────────────────────────────────────────────────────────
// Google metrics
// ─────────────────────────────────────────────────────────────────────────────

describe('computeGoogleMetrics', () => {
  it('normalizes a strong clinic correctly', () => {
    const result = computeGoogleMetrics({ rating: 4.8, user_ratings_total: 900 });
    expect(result.google_rating_score).toBe(96);
    expect(result.google_review_signal).toBeGreaterThan(70);
  });

  it('returns 0 for null data', () => {
    const result = computeGoogleMetrics({ rating: null, user_ratings_total: null });
    expect(result.google_rating_score).toBe(0);
    expect(result.google_review_signal).toBe(0);
  });

  it('clamps rating above 5 to 100', () => {
    const result = computeGoogleMetrics({ rating: 6, user_ratings_total: 100 });
    expect(result.google_rating_score).toBe(100);
  });

  it('clamps rating below 0 to 0', () => {
    const result = computeGoogleMetrics({ rating: -1, user_ratings_total: 100 });
    expect(result.google_rating_score).toBe(0);
  });

  it('review signal grows with more reviews', () => {
    const low = computeGoogleMetrics({ rating: 4.5, user_ratings_total: 10 });
    const high = computeGoogleMetrics({ rating: 4.5, user_ratings_total: 1000 });
    expect(high.google_review_signal).toBeGreaterThan(low.google_review_signal);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Reddit metrics
// ─────────────────────────────────────────────────────────────────────────────

describe('computeRedditMetrics', () => {
  const baseReddit = {
    sentiment_score: 0.7,
    confidence_score: 0.9,
    thread_count: 20,
    unique_authors_count: 15,
    longterm_thread_count: 5,
    photo_thread_count: 4,
    repair_mention_count: 1,
    mention_count: 20,
  };

  it('normalizes positive sentiment correctly', () => {
    const result = computeRedditMetrics({ ...baseReddit, sentiment_score: 1.0 });
    expect(result.reddit_sentiment_score).toBe(100);
  });

  it('normalizes negative sentiment correctly', () => {
    const result = computeRedditMetrics({ ...baseReddit, sentiment_score: -1.0 });
    expect(result.reddit_sentiment_score).toBe(0);
  });

  it('treats sentiment=0 with high confidence as missing data (neutral 50)', () => {
    const result = computeRedditMetrics({ ...baseReddit, sentiment_score: 0, confidence_score: 1.0 });
    expect(result.reddit_sentiment_score).toBe(50);
  });

  it('applies no caution penalty when repair ratio is under 20%', () => {
    // 1 repair out of 10 threads = 10%, under 20% threshold
    const result = computeRedditMetrics({ ...baseReddit, repair_mention_count: 1, thread_count: 10 });
    expect(result.reddit_caution_penalty).toBe(0);
  });

  it('applies caution penalty when repair ratio exceeds 20%', () => {
    // 5 repairs out of 10 threads = 50%, well over threshold
    const result = computeRedditMetrics({ ...baseReddit, repair_mention_count: 5, thread_count: 10 });
    expect(result.reddit_caution_penalty).toBeGreaterThan(0);
  });

  it('returns 0 caution penalty when no threads', () => {
    const result = computeRedditMetrics({ ...baseReddit, thread_count: 0, repair_mention_count: 0 });
    expect(result.reddit_caution_penalty).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Instagram metrics
// ─────────────────────────────────────────────────────────────────────────────

describe('computeInstagramMetrics', () => {
  it('returns 0 boost for null data', () => {
    const result = computeInstagramMetrics(null);
    expect(result.instagram_boost).toBe(0);
  });

  it('adds 1 point for verified account', () => {
    const unverified = computeInstagramMetrics({ follower_count: 10000, verified: false, posts_count: 100 });
    const verified = computeInstagramMetrics({ follower_count: 10000, verified: true, posts_count: 100 });
    expect(verified.instagram_boost).toBeGreaterThan(unverified.instagram_boost);
  });

  it('adds 1 point for 50+ posts', () => {
    const few = computeInstagramMetrics({ follower_count: 10000, verified: false, posts_count: 10 });
    const many = computeInstagramMetrics({ follower_count: 10000, verified: false, posts_count: 50 });
    expect(many.instagram_boost).toBeGreaterThan(few.instagram_boost);
  });

  it('caps boost at 5', () => {
    const result = computeInstagramMetrics({ follower_count: 10000000, verified: true, posts_count: 9999 });
    expect(result.instagram_boost).toBeLessThanOrEqual(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Registry metrics
// ─────────────────────────────────────────────────────────────────────────────

describe('computeRegistryMetrics', () => {
  it('returns false for both fields when no records', () => {
    const result = computeRegistryMetrics([]);
    expect(result.registry_listed).toBe(false);
    expect(result.license_verifiable).toBe(false);
  });

  it('returns listed=true when records exist', () => {
    const result = computeRegistryMetrics([{ license_status: 'active', expires_at: null }]);
    expect(result.registry_listed).toBe(true);
  });

  it('returns verifiable=true for active non-expired license', () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString();
    const result = computeRegistryMetrics([{ license_status: 'active', expires_at: futureDate }]);
    expect(result.license_verifiable).toBe(true);
  });

  it('returns verifiable=false for expired license', () => {
    const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString();
    const result = computeRegistryMetrics([{ license_status: 'active', expires_at: pastDate }]);
    expect(result.license_verifiable).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Credentials metrics
// ─────────────────────────────────────────────────────────────────────────────

describe('computeCredentialsMetrics', () => {
  it('returns 0 score when no data', () => {
    const result = computeCredentialsMetrics([], []);
    expect(result.credentials_score).toBe(0);
    expect(result.has_authoritative_credential).toBe(false);
  });

  it('detects authoritative source (ISHRS)', () => {
    const result = computeCredentialsMetrics(
      [{ id: 'tm-1', role: 'surgeon', last_verified_at: null }],
      [{ team_member_id: 'tm-1', qualification: 'FISHRS', source: 'ishrs', verified_at: new Date().toISOString() }]
    );
    expect(result.has_authoritative_credential).toBe(true);
    expect(result.credentials_score).toBeGreaterThan(0);
  });

  it('score increases with more qualifications', () => {
    const member = { id: 'tm-1', role: 'surgeon', last_verified_at: null };
    const now = new Date().toISOString();
    const one = computeCredentialsMetrics([member], [
      { team_member_id: 'tm-1', qualification: 'FISHRS', source: 'ishrs', verified_at: now },
    ]);
    const two = computeCredentialsMetrics([member], [
      { team_member_id: 'tm-1', qualification: 'FISHRS', source: 'ishrs', verified_at: now },
      { team_member_id: 'tm-1', qualification: 'ABHRS', source: 'abhrs', verified_at: now },
    ]);
    expect(two.credentials_score).toBeGreaterThanOrEqual(one.credentials_score);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Google source score
// ─────────────────────────────────────────────────────────────────────────────

describe('computeGoogleSourceScore', () => {
  it('weights rating 75% and review signal 25%', () => {
    const result = computeGoogleSourceScore({ google_rating_score: 80, google_review_signal: 60 });
    expect(result.summary_score).toBe(75); // 0.75*80 + 0.25*60
  });

  it('score is between 0 and 100', () => {
    const result = computeGoogleSourceScore({ google_rating_score: 100, google_review_signal: 100 });
    expect(result.summary_score).toBeGreaterThanOrEqual(0);
    expect(result.summary_score).toBeLessThanOrEqual(100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Band
// ─────────────────────────────────────────────────────────────────────────────

describe('computeBand', () => {
  it('assigns A for 81–100', () => {
    expect(computeBand(100)).toBe('A');
    expect(computeBand(81)).toBe('A');
  });

  it('assigns B for 61–80', () => {
    expect(computeBand(80)).toBe('B');
    expect(computeBand(61)).toBe('B');
  });

  it('assigns C for 41–60', () => {
    expect(computeBand(60)).toBe('C');
    expect(computeBand(41)).toBe('C');
  });

  it('assigns D for 0–40', () => {
    expect(computeBand(40)).toBe('D');
    expect(computeBand(0)).toBe('D');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Overall score
// ─────────────────────────────────────────────────────────────────────────────

describe('computeOverallScore', () => {
  it('blends 60% reputation and 40% evidence', () => {
    const result = computeOverallScore(80, 60);
    expect(result.overall_score).toBe(72); // 0.60*80 + 0.40*60
  });

  it('assigns correct band', () => {
    const result = computeOverallScore(80, 60);
    expect(result.band).toBe('B');
  });

  it('clamps score to 100 max', () => {
    const result = computeOverallScore(100, 100);
    expect(result.overall_score).toBeLessThanOrEqual(100);
  });

  it('clamps score to 0 min', () => {
    const result = computeOverallScore(0, 0);
    expect(result.overall_score).toBeGreaterThanOrEqual(0);
  });

  it('stores correct weights', () => {
    const result = computeOverallScore(80, 60);
    expect(result.reputation_weight).toBe(0.6);
    expect(result.evidence_transparency_weight).toBe(0.4);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Reputation pillar
// ─────────────────────────────────────────────────────────────────────────────

describe('computeReputationScore', () => {
  const google = { google_rating_score: 80, google_review_signal: 60 };

  it('returns a score between 0 and 100', () => {
    const result = computeReputationScore({ google });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('higher Google rating produces higher score', () => {
    const low = computeReputationScore({ google: { google_rating_score: 40, google_review_signal: 60 } });
    const high = computeReputationScore({ google: { google_rating_score: 90, google_review_signal: 60 } });
    expect(high.score).toBeGreaterThan(low.score);
  });

  it('caution penalty reduces score', () => {
    const reddit = { reddit_sentiment_score: 70, reddit_caution_penalty: 0, reddit_volume_score: 50, reddit_unique_voices_score: 50, reddit_long_term_score: 50, reddit_photo_threads_score: 50, reddit_confidence: 90 };
    const withPenalty = computeReputationScore({ google, reddit: { ...reddit, reddit_caution_penalty: 80 } });
    const withoutPenalty = computeReputationScore({ google, reddit: { ...reddit, reddit_caution_penalty: 0 } });
    expect(withPenalty.score).toBeLessThan(withoutPenalty.score);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Evidence & Transparency pillar
// ─────────────────────────────────────────────────────────────────────────────

describe('computeEvidenceTransparencyScore', () => {
  it('returns a score between 0 and 100', () => {
    const result = computeEvidenceTransparencyScore({ google_review_volume_score: 80 });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('registry listed and verifiable increases score', () => {
    const without = computeEvidenceTransparencyScore({ google_review_volume_score: 80 });
    const with_ = computeEvidenceTransparencyScore({
      google_review_volume_score: 80,
      registry: { registry_listed: true, license_verifiable: true },
    });
    expect(with_.score).toBeGreaterThan(without.score);
  });

  it('more sources increases score via breadth', () => {
    const one = computeEvidenceTransparencyScore({ google_review_volume_score: 80, source_count: 1 });
    const four = computeEvidenceTransparencyScore({ google_review_volume_score: 80, source_count: 4 });
    expect(four.score).toBeGreaterThan(one.score);
  });
});
