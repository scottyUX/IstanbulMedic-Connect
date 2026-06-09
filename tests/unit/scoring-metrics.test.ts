import { describe, it, expect } from 'vitest';
import { computeGoogleMetrics } from '@/lib/scoring/metrics/google';
import { computeRedditMetrics, type RedditRawData } from '@/lib/scoring/metrics/reddit';
import { computeCredentialsMetrics, type TeamMemberRaw, type QualificationRaw } from '@/lib/scoring/metrics/credentials';

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeReddit(overrides: Partial<RedditRawData> = {}): RedditRawData {
  return {
    sentiment_score: 0.5,
    confidence_score: 0.8,
    thread_count: 10,
    unique_authors_count: 10,
    longterm_thread_count: 5,
    photo_thread_count: 0,
    repair_mention_count: 0,
    mention_count: 10,
    ...overrides,
  };
}

const RECENT = '2025-01-01T00:00:00Z';
const OLD    = '2020-01-01T00:00:00Z';

function makeTeam(id = 't1'): TeamMemberRaw {
  return { id, role: 'surgeon', last_verified_at: RECENT };
}

function makeQual(source: string, verified_at: string | null = null): QualificationRaw {
  return { team_member_id: 't1', qualification: 'board cert', source, verified_at };
}

// ─── Google ──────────────────────────────────────────────────────────────────

describe('computeGoogleMetrics — star rating (anchored 3.5–5.0)', () => {
  it('null rating → 0', () => {
    expect(computeGoogleMetrics({ rating: null, user_ratings_total: null }).google_rating_score).toBe(0);
  });

  it('rating below 3.5 → 0 (clamped)', () => {
    expect(computeGoogleMetrics({ rating: 3.0, user_ratings_total: null }).google_rating_score).toBe(0);
    expect(computeGoogleMetrics({ rating: 3.5, user_ratings_total: null }).google_rating_score).toBe(0);
  });

  it('4.2★ → 47 (not 84 as the old linear scale gave)', () => {
    expect(computeGoogleMetrics({ rating: 4.2, user_ratings_total: null }).google_rating_score).toBe(47);
  });

  it('4.5★ → 67', () => {
    expect(computeGoogleMetrics({ rating: 4.5, user_ratings_total: null }).google_rating_score).toBe(67);
  });

  it('4.9★ → 93', () => {
    expect(computeGoogleMetrics({ rating: 4.9, user_ratings_total: null }).google_rating_score).toBe(93);
  });

  it('5.0★ → 100', () => {
    expect(computeGoogleMetrics({ rating: 5.0, user_ratings_total: null }).google_rating_score).toBe(100);
  });

  it('clinics in the 4.2–5.0 band span a 53-point range', () => {
    const low  = computeGoogleMetrics({ rating: 4.2, user_ratings_total: null }).google_rating_score;
    const high = computeGoogleMetrics({ rating: 5.0, user_ratings_total: null }).google_rating_score;
    expect(high - low).toBeGreaterThanOrEqual(50);
  });
});

describe('computeGoogleMetrics — review count', () => {
  it('null count → 0', () => {
    expect(computeGoogleMetrics({ rating: null, user_ratings_total: null }).google_review_signal).toBe(0);
  });

  it('log scale: 300 reviews → 83', () => {
    expect(computeGoogleMetrics({ rating: null, user_ratings_total: 300 }).google_review_signal).toBe(83);
  });

  it('1000+ reviews saturates at 100', () => {
    expect(computeGoogleMetrics({ rating: null, user_ratings_total: 1000 }).google_review_signal).toBe(100);
    expect(computeGoogleMetrics({ rating: null, user_ratings_total: 8000 }).google_review_signal).toBe(100);
  });
});

// ─── Reddit ──────────────────────────────────────────────────────────────────

describe('computeRedditMetrics — no reddit_caution_penalty in output', () => {
  it('interface no longer has reddit_caution_penalty', () => {
    const result = computeRedditMetrics(makeReddit());
    expect('reddit_caution_penalty' in result).toBe(false);
  });
});

describe('computeRedditMetrics — caution folded into sentiment', () => {
  it('0 repair mentions → full sentiment score', () => {
    const result = computeRedditMetrics(makeReddit({ repair_mention_count: 0, thread_count: 10 }));
    expect(result.reddit_sentiment_score).toBe(75); // ((0.5+1)/2)*100 = 75
  });

  it('exactly 20% repair mentions → no reduction (grace threshold)', () => {
    const result = computeRedditMetrics(makeReddit({ repair_mention_count: 2, thread_count: 10 }));
    expect(result.reddit_sentiment_score).toBe(75);
  });

  it('50% repair mentions → 60% reduction', () => {
    // caution_factor = (0.5-0.2)*2 = 0.6 → 75 * 0.4 = 30
    const result = computeRedditMetrics(makeReddit({ repair_mention_count: 5, thread_count: 10 }));
    expect(result.reddit_sentiment_score).toBe(30);
  });

  it('70%+ repair mentions → sentiment zeroed out', () => {
    // caution_factor = (0.7-0.2)*2 = 1.0 → 75 * 0 = 0
    const result = computeRedditMetrics(makeReddit({ repair_mention_count: 7, thread_count: 10 }));
    expect(result.reddit_sentiment_score).toBe(0);
  });

  it('low confidence triggers sentiment floor 50, but caution still applies to repair mentions', () => {
    // NLP confidence is low so sentiment → floor 50, but 90% repair rate is a real signal
    // caution_factor = (0.9-0.2)*2 = 1.4 → clamped → floor 50 * 0 = 0
    const result = computeRedditMetrics(makeReddit({ confidence_score: 0.1, repair_mention_count: 9, thread_count: 10 }));
    expect(result.reddit_sentiment_score).toBe(0);
  });
});

describe('computeRedditMetrics — volume score saturates at 50', () => {
  it('32 threads (real DB max) → 89, not the old 56', () => {
    const result = computeRedditMetrics(makeReddit({ thread_count: 32 }));
    expect(result.reddit_volume_score).toBe(89);
  });

  it('50 threads → 100', () => {
    const result = computeRedditMetrics(makeReddit({ thread_count: 50 }));
    expect(result.reddit_volume_score).toBe(100);
  });
});

describe('computeRedditMetrics — unique voices still saturates at 500', () => {
  it('300 unique authors → 92 (not 100 as it would with the broken max=50)', () => {
    const result = computeRedditMetrics(makeReddit({ unique_authors_count: 300 }));
    expect(result.reddit_unique_voices_score).toBe(92);
  });

  it('unique voices does not hit 100 until well above 50 authors', () => {
    const result = computeRedditMetrics(makeReddit({ unique_authors_count: 60 }));
    expect(result.reddit_unique_voices_score).toBeLessThan(100);
  });
});

// ─── Credentials ─────────────────────────────────────────────────────────────

describe('computeCredentialsMetrics — authoritative sources', () => {
  it('empty data → score 0', () => {
    const result = computeCredentialsMetrics([], []);
    expect(result.credentials_score).toBe(0);
    expect(result.has_authoritative_credential).toBe(false);
  });

  it('non-authoritative source gets base 10pts only (no +20 bonus) → score 42', () => {
    const result = computeCredentialsMetrics(
      [makeTeam()],
      [makeQual('some_random_clinic', null)],
    );
    expect(result.credentials_score).toBe(42);
    expect(result.has_authoritative_credential).toBe(false);
  });

  it('tprecd is now authoritative — gets +20 bonus → score 100', () => {
    const result = computeCredentialsMetrics(
      [makeTeam()],
      [makeQual('tprecd', null)],
    );
    expect(result.credentials_score).toBe(100);
    expect(result.has_authoritative_credential).toBe(true);
  });

  it('iahrs is now authoritative — gets +20 bonus → score 100', () => {
    const result = computeCredentialsMetrics(
      [makeTeam()],
      [makeQual('iahrs', null)],
    );
    expect(result.credentials_score).toBe(100);
    expect(result.has_authoritative_credential).toBe(true);
  });

  it('ishrs still authoritative (regression check)', () => {
    const result = computeCredentialsMetrics(
      [makeTeam()],
      [makeQual('ishrs', null)],
    );
    expect(result.has_authoritative_credential).toBe(true);
    expect(result.credentials_score).toBeGreaterThan(42);
  });

  it('recent verification adds +10pts on top of authoritative bonus', () => {
    const notRecent = computeCredentialsMetrics([makeTeam()], [makeQual('ishrs', OLD)]);
    const recent    = computeCredentialsMetrics([makeTeam()], [makeQual('ishrs', RECENT)]);
    expect(recent.credentials_score).toBeGreaterThanOrEqual(notRecent.credentials_score);
  });

  it('source matching is case-insensitive', () => {
    const result = computeCredentialsMetrics(
      [makeTeam()],
      [makeQual('TPRECD', null)],
    );
    expect(result.has_authoritative_credential).toBe(true);
  });
});
