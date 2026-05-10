// lib/scoring/metrics/instagram.ts
// Normalizes clinic_social_media (instagram) data into a boost score (0–5).
// Instagram is a minor additive signal, not a full pillar input.

export interface InstagramRawData {
  follower_count: number | null;
  verified: boolean | null;
  posts_count: number | null;
}

export interface InstagramMetrics {
  instagram_boost: number; // 0–5 flat additive to reputation
}

/**
 * Instagram boost:
 * - Up to 3 points for follower count (log scale, 10k → ~1, 100k → ~3, 500k+ → 3)
 * - 1 point for verified account
 * - 1 point for active posting (50+ posts)
 */
export function computeInstagramMetrics(data: InstagramRawData | null): InstagramMetrics {
  if (!data) return { instagram_boost: 0 };

  let boost = 0;

  if (data.follower_count && data.follower_count > 0) {
    const followerScore = (Math.log10(data.follower_count + 1) / Math.log10(500001)) * 3;
    boost += Math.min(Math.round(followerScore * 10) / 10, 3);
  }

  if (data.verified) boost += 1;
  if (data.posts_count && data.posts_count >= 50) boost += 1;

  return { instagram_boost: Math.min(boost, 5) };
}
