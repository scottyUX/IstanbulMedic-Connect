// lib/scoring/pillars/evidenceTransparency.ts
// Computes the Evidence & Transparency pillar score (0–100).
//
// Structure:
//   Independent Evidence = 55%
//     - reddit_volume          8%
//     - reddit_unique_voices   11%
//     - reddit_long_term       9%
//     - reddit_photo_threads   8%  (using reddit photo threads for now, HRN later)
//     - google_review_volume   6%
//     - hrn_threads            5%  (stubbed)
//     - hrn_12m_followups      8%  (stubbed)
//
//   Verification = 35%
//     - registry_listed        14%
//     - license_verifiable     14%
//     - credentials_score      7%  (stubbed)
//
//   Breadth / Coverage = 10%
//     - source_breadth         10%

import { RedditMetrics } from "../metrics/reddit";
import { RegistryMetrics } from "../metrics/registry";
import { CredentialsMetrics } from "../metrics/credentials";

export interface EvidenceTransparencyInputs {
  google_review_volume_score: number;
  reddit?: RedditMetrics;
  registry?: RegistryMetrics;
  // HRN stubbed
  hrn_threads_score?: number;
  hrn_12m_followups_score?: number;
  credentials?: CredentialsMetrics;
  // How many distinct sources have data (google, reddit, instagram, registry...)
  source_count?: number;
}

export interface EvidenceTransparencyResult {
  score: number;
  metrics_json: Record<string, number>;
  breakdown_json: { weights: Record<string, number> };
}

const WEIGHTS = {
  reddit_volume_score:        0.08,
  reddit_unique_voices_score: 0.11,
  reddit_long_term_score:     0.09,
  reddit_photo_threads_score: 0.08,
  google_review_volume_score: 0.06,
  hrn_threads_score:          0.05,
  hrn_12m_followups_score:    0.08,
  registry_listed:            0.14,
  license_verifiable:         0.14,
  credentials_score:          0.07,
  source_breadth_score:       0.10,
} as const;

/**
 * Normalize source count to 0–100.
 * 1 source → 25, 2 → 50, 3 → 75, 4+ → 100
 */
function computeSourceBreadth(sourceCount: number): number {
  return Math.min(sourceCount * 25, 100);
}

export function computeEvidenceTransparencyScore(
  inputs: EvidenceTransparencyInputs
): EvidenceTransparencyResult {
  const sourceCount = inputs.source_count ?? 1;

  const metrics: Record<string, number> = {
    reddit_volume_score:        inputs.reddit?.reddit_volume_score ?? 0,
    reddit_unique_voices_score: inputs.reddit?.reddit_unique_voices_score ?? 0,
    reddit_long_term_score:     inputs.reddit?.reddit_long_term_score ?? 0,
    reddit_photo_threads_score: inputs.reddit?.reddit_photo_threads_score ?? 0,
    google_review_volume_score: inputs.google_review_volume_score,
    hrn_threads_score:          inputs.hrn_threads_score ?? 0,
    hrn_12m_followups_score:    inputs.hrn_12m_followups_score ?? 0,
    registry_listed:            inputs.registry?.registry_listed ? 100 : 0,
    license_verifiable:         inputs.registry?.license_verifiable ? 100 : 0,
    credentials_score:          inputs.credentials?.credentials_score ?? 0,
    source_breadth_score:       computeSourceBreadth(sourceCount),
  };

  const score = Object.entries(WEIGHTS).reduce((sum, [key, weight]) => {
    return sum + weight * (metrics[key] ?? 0);
  }, 0);

  return {
    score: Math.round(Math.min(Math.max(score, 0), 100)),
    metrics_json: metrics,
    breakdown_json: { weights: { ...WEIGHTS } },
  };
}
