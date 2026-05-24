// lib/scoring/metrics/google.ts
// Normalizes raw clinic_google_places data into scored metrics (0-100).

export interface GoogleRawData {
  rating: number | null;
  user_ratings_total: number | null;
}

export interface GoogleMetrics {
  google_rating_score: number;
  google_review_signal: number;
}

/**
 * Normalize Google star rating (0–5) to a 0–100 score.
 * A 5.0 → 100, a 4.0 → 75, a 3.0 → 50, etc.
 */
function normalizeRating(rating: number | null): number {
  if (rating === null) return 0;
  return Math.round((Math.min(Math.max(rating, 0), 5) / 5) * 100);
}

/**
 * Normalize review count to a 0–100 signal.
 * Uses a log scale so that large counts don't dominate.
 * 0 reviews → 0, ~50 reviews → ~50, ~500 reviews → ~85, 1000+ → ~100.
 */
function normalizeReviewCount(count: number | null): number {
  if (!count || count <= 0) return 0;
  const score = (Math.log10(count + 1) / Math.log10(1001)) * 100;
  return Math.round(Math.min(score, 100));
}

export function computeGoogleMetrics(data: GoogleRawData): GoogleMetrics {
  return {
    google_rating_score: normalizeRating(data.rating),
    google_review_signal: normalizeReviewCount(data.user_ratings_total),
  };
}
