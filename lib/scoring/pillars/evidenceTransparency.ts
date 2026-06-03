// lib/scoring/pillars/evidenceTransparency.ts
// Computes the Evidence & Transparency pillar score (0–100).
//
// Floors (absence of data ≠ bad clinic):
//   Reddit missing      → volume/voices/longterm/photo floor 40
//   Registry missing    → listed/verifiable floor 30
//   Credentials missing → floor 30

import { RedditMetrics } from "../metrics/reddit";
import { RegistryMetrics } from "../metrics/registry";
import { CredentialsMetrics } from "../metrics/credentials";

const REDDIT_VOLUME_FLOOR   = 50;
const REGISTRY_FLOOR        = 40;
const CREDENTIALS_FLOOR     = 40;

export interface EvidenceTransparencyInputs {
  google_review_volume_score: number;
  reddit?: RedditMetrics;
  registry?: RegistryMetrics;
  hrn_threads_score?: number;
  hrn_12m_followups_score?: number;
  credentials?: CredentialsMetrics;
  source_count?: number;
}

export interface EvidenceTransparencyResult {
  score: number;
  metrics_json: Record<string, number>;
  breakdown_json: { weights: Record<string, number> };
}

const WEIGHTS = {
  google_review_volume_score: 0.20,
  reddit_volume_score:        0.08,
  reddit_unique_voices_score: 0.12,
  reddit_long_term_score:     0.10,
  reddit_photo_threads_score: 0.08,
  hrn_threads_score:          0.00,
  hrn_12m_followups_score:    0.00,
  registry_listed:            0.07,
  license_verifiable:         0.03,
  credentials_score:          0.15,
  source_breadth_score:       0.17,
} as const;

function computeSourceBreadth(sourceCount: number): number {
  return Math.min(sourceCount * 25, 100);
}

export function computeEvidenceTransparencyScore(
  inputs: EvidenceTransparencyInputs
): EvidenceTransparencyResult {
  const sourceCount = inputs.source_count ?? 1;
  const hasReddit   = !!inputs.reddit;
  const hasRegistry = !!inputs.registry;
  const hasCredentials = !!inputs.credentials;

  const metrics: Record<string, number> = {
    google_review_volume_score: inputs.google_review_volume_score,

    // Reddit — use floors when missing
    reddit_volume_score:        hasReddit ? inputs.reddit!.reddit_volume_score        : REDDIT_VOLUME_FLOOR,
    reddit_unique_voices_score: hasReddit ? inputs.reddit!.reddit_unique_voices_score : REDDIT_VOLUME_FLOOR,
    reddit_long_term_score:     hasReddit ? inputs.reddit!.reddit_long_term_score     : REDDIT_VOLUME_FLOOR,
    reddit_photo_threads_score: hasReddit ? inputs.reddit!.reddit_photo_threads_score : REDDIT_VOLUME_FLOOR,

    // HRN — stubbed at 0
    hrn_threads_score:          inputs.hrn_threads_score ?? 0,
    hrn_12m_followups_score:    inputs.hrn_12m_followups_score ?? 0,

    // Registry — use floors when missing
    registry_listed:    hasRegistry ? (inputs.registry!.registry_listed    ? 100 : REGISTRY_FLOOR) : REGISTRY_FLOOR,
    license_verifiable: hasRegistry ? (inputs.registry!.license_verifiable ? 100 : REGISTRY_FLOOR) : REGISTRY_FLOOR,

    // Credentials — use floor when missing
    credentials_score: hasCredentials
      ? (inputs.credentials!.credentials_score > 0 ? inputs.credentials!.credentials_score : CREDENTIALS_FLOOR)
      : CREDENTIALS_FLOOR,

    source_breadth_score: computeSourceBreadth(sourceCount),
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
