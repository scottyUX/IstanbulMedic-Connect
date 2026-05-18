// lib/scoring/sources/instagram.ts
// Computes the public Instagram source summary score.
//
// Formula:
//   Instagram Summary =
//     0.40 * follower_score        (log-scaled follower count)
//     0.20 * verified_score        (verified account = 100, else 0)
//     0.20 * post_activity_score   (log-scaled post count)
//     0.20 * engagement_score      (avg likes+comments per post, log-scaled)

export interface InstagramRawSourceData {
  follower_count: number | null;
  verified: boolean | null;
  posts_count: number | null;
  avg_likes_per_post?: number | null;
  avg_comments_per_post?: number | null;
}

export interface InstagramSourceScore {
  summary_score: number;
  confidence_score: number;
  metrics_json: Record<string, number>;
  breakdown_json: { weights: Record<string, number> };
}

const WEIGHTS = {
  follower_score:      0.40,
  verified_score:      0.20,
  post_activity_score: 0.20,
  engagement_score:    0.20,
} as const;

/**
 * Log-scale normalization.
 * 0 → 0, ~1k → ~33, ~10k → ~50, ~100k → ~67, ~1M → ~83, 10M+ → ~100
 */
function logNormalize(value: number, max = 10_000_000): number {
  if (value <= 0) return 0;
  return Math.round(Math.min((Math.log10(value + 1) / Math.log10(max + 1)) * 100, 100));
}

/**
 * Confidence is based on how much data we have.
 * No followers and no posts = very low confidence.
 */
function computeConfidence(data: InstagramRawSourceData): number {
  let confidence = 0;
  if (data.follower_count && data.follower_count > 0) confidence += 40;
  if (data.posts_count && data.posts_count > 0) confidence += 30;
  if (data.verified) confidence += 20;
  if (data.avg_likes_per_post || data.avg_comments_per_post) confidence += 10;
  return Math.min(confidence, 100);
}

export function computeInstagramSourceScore(data: InstagramRawSourceData): InstagramSourceScore {
  const follower_score = logNormalize(data.follower_count ?? 0, 10_000_000);
  const verified_score = data.verified ? 100 : 0;
  const post_activity_score = logNormalize(data.posts_count ?? 0, 10_000);
  const avg_engagement = (data.avg_likes_per_post ?? 0) + (data.avg_comments_per_post ?? 0);
  const engagement_score = logNormalize(avg_engagement, 5_000);

  const metrics: Record<string, number> = {
    follower_score,
    verified_score,
    post_activity_score,
    engagement_score,
  };

  const summary_score = Math.round(
    WEIGHTS.follower_score      * follower_score +
    WEIGHTS.verified_score      * verified_score +
    WEIGHTS.post_activity_score * post_activity_score +
    WEIGHTS.engagement_score    * engagement_score
  );

  return {
    summary_score: Math.min(Math.max(summary_score, 0), 100),
    confidence_score: computeConfidence(data),
    metrics_json: metrics,
    breakdown_json: { weights: { ...WEIGHTS } },
  };
}
