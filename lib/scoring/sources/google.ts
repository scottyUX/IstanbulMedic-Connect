// lib/scoring/sources/google.ts
// Computes the public Google source summary score.
//
// Formula (from architecture doc):
//   Google Summary = 0.75 * google_rating_score + 0.25 * google_review_signal

import { GoogleMetrics } from "../metrics/google";

export interface GoogleSourceScore {
  summary_score: number;
  confidence_score: number;
  metrics_json: GoogleMetrics;
  breakdown_json: {
    weights: Record<keyof GoogleMetrics, number>;
  };
  explanation: string;
}

const WEIGHTS = {
  google_rating_score: 0.75,
  google_review_signal: 0.25,
} as const;

export function computeGoogleSourceScore(metrics: GoogleMetrics): GoogleSourceScore {
  const summary_score = Math.round(
    WEIGHTS.google_rating_score * metrics.google_rating_score +
    WEIGHTS.google_review_signal * metrics.google_review_signal
  );

  // Confidence is based on how much review signal we have.
  // No reviews = low confidence, high review count = high confidence.
  const confidence_score = Math.round(
    0.4 * metrics.google_rating_score +
    0.6 * metrics.google_review_signal
  );

  return {
    summary_score: Math.min(Math.max(summary_score, 0), 100),
    confidence_score: Math.min(Math.max(confidence_score, 0), 100),
    metrics_json: metrics,
    breakdown_json: { weights: WEIGHTS },
    explanation: "Based on star rating and total review count from Google Maps.",
  };
}
