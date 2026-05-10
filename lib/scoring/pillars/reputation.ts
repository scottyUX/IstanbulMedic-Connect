// lib/scoring/pillars/reputation.ts
// Computes the Reputation pillar score (0–100).
//
// Formula:
//   Reputation =
//     0.35 * google_rating_score
//   + 0.15 * google_review_signal
//   + 0.20 * reddit_sentiment_score  (weighted by reddit_confidence)
//   - 0.10 * reddit_caution_penalty
//   + 0.20 * hrn_sentiment_score     (stubbed — redistributed to Google until HRN is live)
//   - 0.10 * hrn_caution_penalty     (stubbed)
//   + instagram_boost                (0–5 flat additive)

import { GoogleMetrics } from "../metrics/google";
import { RedditMetrics } from "../metrics/reddit";
import { InstagramMetrics } from "../metrics/instagram";

export interface ReputationInputs {
  google: GoogleMetrics;
  reddit?: RedditMetrics;
  instagram?: InstagramMetrics;
  // HRN stubbed — add when pipeline is live
  hrn_sentiment_score?: number;
  hrn_caution_penalty?: number;
}

export interface ReputationResult {
  score: number;
  metrics_json: Record<string, number>;
  breakdown_json: { weights: Record<string, number> };
}

const WEIGHTS = {
  google_rating_score:    0.35,
  google_review_signal:   0.15,
  reddit_sentiment_score: 0.20,
  reddit_caution_penalty: -0.10,
  hrn_sentiment_score:    0.20,
  hrn_caution_penalty:    -0.10,
} as const;

export function computeReputationScore(inputs: ReputationInputs): ReputationResult {
  const hasReddit = !!inputs.reddit;
  const hasHrn = inputs.hrn_sentiment_score !== undefined;

  // Confidence-weight the Reddit sentiment so low-confidence data doesn't
  // fully count. e.g. sentiment=80 with confidence=0.5 → effective score=40.
  const redditSentimentEffective = hasReddit
    ? (inputs.reddit!.reddit_sentiment_score * inputs.reddit!.reddit_confidence) / 100
    : 0;
  const redditCautionEffective = hasReddit ? inputs.reddit!.reddit_caution_penalty : 0;

  const metrics: Record<string, number> = {
    google_rating_score:    inputs.google.google_rating_score,
    google_review_signal:   inputs.google.google_review_signal,
    reddit_sentiment_score: redditSentimentEffective,
    reddit_caution_penalty: redditCautionEffective,
    hrn_sentiment_score:    inputs.hrn_sentiment_score ?? 0,
    hrn_caution_penalty:    inputs.hrn_caution_penalty ?? 0,
    instagram_boost:        inputs.instagram?.instagram_boost ?? 0,
  };

  let score =
    WEIGHTS.google_rating_score  * metrics.google_rating_score +
    WEIGHTS.google_review_signal * metrics.google_review_signal;

  if (hasReddit) {
    score +=
      WEIGHTS.reddit_sentiment_score * metrics.reddit_sentiment_score +
      WEIGHTS.reddit_caution_penalty * metrics.reddit_caution_penalty;
  } else {
    score += 0.20 * metrics.google_rating_score;
  }

  if (hasHrn) {
    score +=
      WEIGHTS.hrn_sentiment_score * metrics.hrn_sentiment_score +
      WEIGHTS.hrn_caution_penalty * metrics.hrn_caution_penalty;
  } else {
    score += 0.20 * metrics.google_rating_score;
  }

  score += metrics.instagram_boost;

  return {
    score: Math.round(Math.min(Math.max(score, 0), 100)),
    metrics_json: metrics,
    breakdown_json: { weights: { ...WEIGHTS, instagram_boost: 1 } },
  };
}
