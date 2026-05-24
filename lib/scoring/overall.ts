// lib/scoring/overall.ts
// Blends pillar scores into the final clinic overall score and band.
//
// Formula:
//   overall_score = 0.60 * reputation_score + 0.40 * evidence_transparency_score
//
// Bands:
//   A = 70–100
//   B = 60–69
//   C = 40–59
//   D = 0–39

export type ScoreBand = "A" | "B" | "C" | "D";

export interface OverallScoreResult {
  overall_score: number;
  band: ScoreBand;
  reputation_weight: number;
  evidence_transparency_weight: number;
}

const REPUTATION_WEIGHT = 0.60;
const EVIDENCE_WEIGHT = 0.40;

export function computeBand(score: number): ScoreBand {
  if (score >= 70) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  return "D";
}

export function computeOverallScore(
  reputation_score: number,
  evidence_transparency_score: number
): OverallScoreResult {
  const overall_score = Math.round(
    REPUTATION_WEIGHT * reputation_score +
    EVIDENCE_WEIGHT * evidence_transparency_score
  );

  const clamped = Math.min(Math.max(overall_score, 0), 100);

  return {
    overall_score: clamped,
    band: computeBand(clamped),
    reputation_weight: REPUTATION_WEIGHT,
    evidence_transparency_weight: EVIDENCE_WEIGHT,
  };
}
