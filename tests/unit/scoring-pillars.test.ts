import { describe, it, expect } from 'vitest';
import { computeReputationScore, type ReputationInputs } from '@/lib/scoring/pillars/reputation';
import { computeEvidenceTransparencyScore, type EvidenceTransparencyInputs } from '@/lib/scoring/pillars/evidenceTransparency';
import type { GoogleMetrics } from '@/lib/scoring/metrics/google';
import type { RedditMetrics } from '@/lib/scoring/metrics/reddit';
import type { RegistryMetrics } from '@/lib/scoring/metrics/registry';
import type { CredentialsMetrics } from '@/lib/scoring/metrics/credentials';

// ─── helpers ─────────────────────────────────────────────────────────────────

function google(rating = 67, review = 50): GoogleMetrics {
  return { google_rating_score: rating, google_review_signal: review };
}

function reddit(sentiment = 75, confidence = 80): RedditMetrics {
  return {
    reddit_sentiment_score:     sentiment,
    reddit_volume_score:        53,
    reddit_unique_voices_score: 70,
    reddit_long_term_score:     46,
    reddit_photo_threads_score: 0,
    reddit_confidence:          confidence,
  };
}

function registry(listed = true, verifiable = true): RegistryMetrics {
  return { registry_listed: listed, license_verifiable: verifiable };
}

function creds(score = 70): CredentialsMetrics {
  return { credentials_score: score, verified_qualification_count: 3, has_authoritative_credential: true };
}

// ─── Reputation ───────────────────────────────────────────────────────────────

describe('computeReputationScore — weights', () => {
  it('no reddit data → applies floor 60 and HRN redistribution to Google', () => {
    // 0.40*67 + 0.20*50 + 0.25*60 + 0.15*67 = 26.8+10+15+10.05 = 61.85 → 62
    const result = computeReputationScore({ google: google(67, 50) });
    expect(result.score).toBe(62);
  });

  it('with reddit: confidence-weighted sentiment applied at 25%', () => {
    // effective_sentiment = 75 * 80/100 = 60
    // 0.40*80 + 0.20*60 + 0.25*60 + 0.15*80 = 32+12+15+12 = 71
    const result = computeReputationScore({ google: google(80, 60), reddit: reddit(75, 80) });
    expect(result.score).toBe(71);
  });

  it('instagram boost adds on top', () => {
    const without = computeReputationScore({ google: google(80, 60), reddit: reddit(75, 80) });
    const with_ig = computeReputationScore({
      google: google(80, 60),
      reddit: reddit(75, 80),
      instagram: { instagram_boost: 3 },
    });
    expect(with_ig.score).toBe(without.score + 3);
  });

  it('HRN stubbed weight (0.15) is redistributed to google_rating_score, not lost', () => {
    // A clinic with perfect Google rating should benefit from the 0.15 HRN redistribution
    const result = computeReputationScore({ google: google(100, 0) });
    // 0.40*100 + 0.20*0 + 0.25*60 + 0.15*100 = 40+0+15+15 = 70
    expect(result.score).toBe(70);
  });

  it('score is clamped 0–100', () => {
    const top = computeReputationScore({
      google: google(100, 100),
      reddit: reddit(100, 100),
      instagram: { instagram_boost: 5 },
    });
    expect(top.score).toBeLessThanOrEqual(100);
    expect(top.score).toBeGreaterThanOrEqual(0);
  });

  it('reddit_caution_penalty is not present in metrics_json', () => {
    const result = computeReputationScore({ google: google(), reddit: reddit() });
    expect('reddit_caution_penalty' in result.metrics_json).toBe(false);
  });

  it('low confidence reddit data scores lower than high confidence', () => {
    const highConf = computeReputationScore({ google: google(), reddit: reddit(80, 100) });
    const lowConf  = computeReputationScore({ google: google(), reddit: reddit(80, 20) });
    expect(highConf.score).toBeGreaterThan(lowConf.score);
  });
});

// ─── Evidence & Transparency ─────────────────────────────────────────────────

describe('computeEvidenceTransparencyScore — weights', () => {
  it('all present → blends correctly', () => {
    // 0.20*77 + 0.05*53 + 0.15*70 + 0.15*46 + 0.10*100 + 0.05*100 + 0.15*70 + 0.15*100
    // = 15.4+2.65+10.5+6.9+10+5+10.5+15 = 75.95 → 76
    const result = computeEvidenceTransparencyScore({
      google_review_volume_score: 77,
      reddit: reddit(),
      registry: registry(),
      credentials: creds(),
      source_count: 4,
    });
    expect(result.score).toBe(76);
  });

  it('missing data → neutral floors, not zero', () => {
    // reddit floors 50, registry floors 40, credentials floor 40, source_breadth 1*25=25
    // 0.20*50 + 0.05*50 + 0.15*50 + 0.15*50 + 0.10*40 + 0.05*40 + 0.15*40 + 0.15*25
    // = 10+2.5+7.5+7.5+4+2+6+3.75 = 43.25 → 43
    const result = computeEvidenceTransparencyScore({
      google_review_volume_score: 50,
    });
    expect(result.score).toBe(43);
    expect(result.score).toBeGreaterThan(0);
  });

  it('reddit_photo_threads_score is not in weights and does not affect score', () => {
    const withHighPhoto = computeEvidenceTransparencyScore({
      google_review_volume_score: 50,
      reddit: { ...reddit(), reddit_photo_threads_score: 100 },
    });
    const withZeroPhoto = computeEvidenceTransparencyScore({
      google_review_volume_score: 50,
      reddit: { ...reddit(), reddit_photo_threads_score: 0 },
    });
    expect(withHighPhoto.score).toBe(withZeroPhoto.score);
  });

  it('reddit_photo_threads_score is absent from breakdown weights', () => {
    const result = computeEvidenceTransparencyScore({ google_review_volume_score: 50 });
    expect('reddit_photo_threads_score' in result.breakdown_json.weights).toBe(false);
  });

  it('weights sum to 1.0', () => {
    const result = computeEvidenceTransparencyScore({ google_review_volume_score: 50 });
    const total = Object.values(result.breakdown_json.weights).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1.0, 10);
  });

  it('registry listed = true scores higher than no registry data', () => {
    const listed  = computeEvidenceTransparencyScore({ google_review_volume_score: 50, registry: registry(true, true) });
    const missing = computeEvidenceTransparencyScore({ google_review_volume_score: 50 });
    expect(listed.score).toBeGreaterThan(missing.score);
  });

  it('strong credentials score higher than no credentials', () => {
    const strong  = computeEvidenceTransparencyScore({ google_review_volume_score: 50, credentials: creds(90) });
    const missing = computeEvidenceTransparencyScore({ google_review_volume_score: 50 });
    expect(strong.score).toBeGreaterThan(missing.score);
  });

  it('score is clamped 0–100', () => {
    const result = computeEvidenceTransparencyScore({
      google_review_volume_score: 100,
      reddit: reddit(100, 100),
      registry: registry(),
      credentials: creds(100),
      source_count: 5,
    });
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});
