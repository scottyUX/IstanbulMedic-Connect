// lib/scoring/metrics/reddit.ts
// Normalizes raw clinic_forum_profiles (reddit) data into scored metrics (0–100).

export interface RedditRawData {
  sentiment_score: number | null;        // -1 to 1
  confidence_score: number | null;       // 0 to 1
  thread_count: number;
  unique_authors_count: number | null;
  longterm_thread_count: number;
  photo_thread_count: number;
  repair_mention_count: number;
  mention_count: number;
}

export interface RedditMetrics {
  reddit_sentiment_score: number;        // 0–100 (caution-adjusted)
  reddit_volume_score: number;           // 0–100
  reddit_unique_voices_score: number;    // 0–100
  reddit_long_term_score: number;        // 0–100
  reddit_photo_threads_score: number;    // 0–100
  reddit_confidence: number;             // 0–100, used to weight reliability
}

/**
 * Convert sentiment from -1→1 scale to 0→100.
 * -1 (very negative) → 0, 0 (neutral) → 50, 1 (very positive) → 100
 */
function normalizeSentiment(sentiment: number | null): number {
  if (sentiment === null) return 0;
  return Math.round(((Math.min(Math.max(sentiment, -1), 1) + 1) / 2) * 100);
}

/**
 * Normalize a count to 0–100 using log scale.
 * 0 → 0, ~10 → ~50, ~100 → ~83, max+ → ~100
 */
function normalizeCount(count: number, max = 500): number {
  if (count <= 0) return 0;
  return Math.round(Math.min((Math.log10(count + 1) / Math.log10(max + 1)) * 100, 100));
}

/**
 * Reduce raw sentiment by repair mention ratio.
 * Repair ratio > 20% starts cutting into the score; at 70%+ it zeroes out.
 */
function applyCautionAdjustment(sentimentScore: number, repairMentions: number, totalThreads: number): number {
  if (totalThreads === 0) return sentimentScore;
  const repairRatio = repairMentions / totalThreads;
  const cautionFactor = Math.max(repairRatio - 0.2, 0) * 2;
  return Math.round(sentimentScore * Math.max(1 - cautionFactor, 0));
}

/**
 * Detect missing sentiment data.
 * Missing = null sentiment OR very low confidence (< 0.3) OR no mentions at all.
 * A confident zero is genuine neutral sentiment, not missing data.
 */
function isSentimentMissing(data: RedditRawData): boolean {
  if (data.sentiment_score === null) return true;
  if ((data.confidence_score ?? 0) < 0.3) return true;
  if (data.mention_count === 0) return true;
  return false;
}

export function computeRedditMetrics(data: RedditRawData): RedditMetrics {
  const baseSentiment = isSentimentMissing(data) ? 50 : normalizeSentiment(data.sentiment_score);
  const adjustedSentiment = applyCautionAdjustment(baseSentiment, data.repair_mention_count, data.thread_count);

  return {
    reddit_sentiment_score:     adjustedSentiment,
    reddit_volume_score:        normalizeCount(data.thread_count, 50),
    reddit_unique_voices_score: normalizeCount(data.unique_authors_count ?? 0),
    reddit_long_term_score:     normalizeCount(data.longterm_thread_count, 50),
    reddit_photo_threads_score: normalizeCount(data.photo_thread_count, 50),
    reddit_confidence:          Math.round((data.confidence_score ?? 0) * 100),
  };
}
