// lib/scoring/pillars/reputation.ts
// Computes the Reputation pillar score (0–100).
//
// Formula:
//   Reputation =
//     0.40 * google_rating_score
//   + 0.20 * google_review_signal
//   + 0.25 * reddit_sentiment_score  (caution already folded upstream; weighted by reddit_confidence)
//   + 0.15 * hrn_sentiment_score     (stubbed — redistributed to Google until live)
//   + instagram_boost                (0–5 flat additive)
//
// Floors (absence of data ≠ bad clinic):
//   Reddit missing → sentiment floor 60
//   HRN stubbed   → weight redistributed to Google (no silent +12 points)

import { GoogleMetrics } from "../metrics/google";
import { RedditMetrics } from "../metrics/reddit";
import { InstagramMetrics } from "../metrics/instagram";

const REDDIT_SENTIMENT_FLOOR = 60;

export interface ReputationInputs {
  google: GoogleMetrics;
  reddit?: RedditMetrics;
  instagram?: InstagramMetrics;
  // HRN stubbed — add when pipeline is live
  hrn_sentiment_score?: number;
}

export interface ReputationResult {
  score: number;
  metrics_json: Record<string, number>;
  breakdown_json: { weights: Record<string, number> };
}

const WEIGHTS = {
  google_rating_score:    0.40,
  google_review_signal:   0.20,
  reddit_sentiment_score: 0.25,
  // HRN stubbed at 0 — weight redistributed to Google below
  hrn_sentiment_score:    0.00,
} as const;

export function computeReputationScore(inputs: ReputationInputs): ReputationResult {
  const hasReddit = !!inputs.reddit;

  const redditSentimentEffective = hasReddit
    ? (inputs.reddit!.reddit_sentiment_score * inputs.reddit!.reddit_confidence) / 100
    : REDDIT_SENTIMENT_FLOOR;

  const metrics: Record<string, number> = {
    google_rating_score:    inputs.google.google_rating_score,
    google_review_signal:   inputs.google.google_review_signal,
    reddit_sentiment_score: redditSentimentEffective,
    hrn_sentiment_score:    0,
    instagram_boost:        inputs.instagram?.instagram_boost ?? 0,
  };

  // HRN weight (0.15) redistributed to Google rating since HRN is not live
  const hrnRedistributed = 0.15 * metrics.google_rating_score;

  const score =
    WEIGHTS.google_rating_score    * metrics.google_rating_score +
    WEIGHTS.google_review_signal   * metrics.google_review_signal +
    WEIGHTS.reddit_sentiment_score * metrics.reddit_sentiment_score +
    hrnRedistributed +
    metrics.instagram_boost;

  return {
    score: Math.round(Math.min(Math.max(score, 0), 100)),
    metrics_json: metrics,
    breakdown_json: { weights: { ...WEIGHTS, hrn_redistributed_to_google: 0.15 }, additive: { instagram_boost: metrics.instagram_boost } },
  };
}
