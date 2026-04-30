/**
 * HRN Score computation.
 *
 * Pure function — no DB access, no side effects. Takes per-thread data already
 * assembled by getHRNSignals and returns a 0–10 score or undefined if there is
 * insufficient data.
 *
 * Formula (see docs/hrn-score-plan.md for full rationale):
 *   1. Recency-weighted sentiment mean  →  normalizedBase (0–10)
 *   2. Bayesian shrinkage toward 5.0    →  confidenceScore
 *   3. Repair case penalty              →  − up to 1.5
 *   4. Long-term follow-up bonus        →  + up to 0.75
 *   5. Issue severity penalty           →  − up to 2.0
 */

// ── Constants (tunable after pilot batch) ─────────────────────────────────────

/** Prior weight — how much a low-N clinic is pulled toward neutral (5.0). */
const PRIOR_WEIGHT = 8;

/** Minimum effective sample size required to show a score. */
const MIN_EFFECTIVE_N = 4;

/** Recency decay weights by age bucket. */
const DECAY = {
  under1yr: 1.0,
  yr1to2: 0.7,
  yr2to3: 0.5,
  over3yr: 0.3,
} as const;

const HIGH_SEVERITY_ISSUES = new Set([
  'overharvesting',
  'infection',
  'revision_needed',
]);

const MED_SEVERITY_ISSUES = new Set([
  'poor_density',
  'poor_growth',
  'visible_scarring',
  'unnatural_hairline',
]);

const HIGH_SEVERITY_POINTS = 0.3;
const MED_SEVERITY_POINTS = 0.1;
const MAX_SEVERITY_PENALTY = 2.0;
const MAX_REPAIR_PENALTY = 1.5;
const MAX_FOLLOWUP_BONUS = 0.8;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScorerThread {
  postDate: string;
  sentimentScore: number | null;  // -1.0 to 1.0
  isRepairCase: boolean;
  hasLongTermFollowup: boolean;
  issueKeywords: string[];
}

export interface HRNScoreBreakdown {
  score: number;
  effectiveN: number;
  confidenceTier: 'high' | 'moderate' | 'low';
  sentimentContribution: number;
  repairPenalty: number;
  followupBonus: number;
  severityPenalty: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ageDecayWeight(postDate: string, now: Date): number {
  const ageMs = now.getTime() - new Date(postDate).getTime();
  const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);
  if (ageYears < 1) return DECAY.under1yr;
  if (ageYears < 2) return DECAY.yr1to2;
  if (ageYears < 3) return DECAY.yr2to3;
  return DECAY.over3yr;
}

function confidenceTier(effectiveN: number): HRNScoreBreakdown['confidenceTier'] {
  if (effectiveN >= 20) return 'high';
  if (effectiveN >= 8) return 'moderate';
  return 'low';
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Returns a score breakdown, or undefined if there is insufficient data.
 * Pass `now` in tests to pin the current date.
 */
export function computeHRNScore(
  threads: ScorerThread[],
  now: Date = new Date(),
): HRNScoreBreakdown | undefined {
  if (threads.length === 0) return undefined;

  // ── Step 1: Recency-weighted sentiment mean ───────────────────────────────

  let weightedSentimentSum = 0;
  let effectiveN = 0;
  let repairWeightSum = 0;
  let followupWeightSum = 0;

  for (const t of threads) {
    const w = ageDecayWeight(t.postDate, now);
    effectiveN += w;

    // Fall back to 0 (neutral) if sentiment_score is null (older rows processed
    // before the sentiment_score column was added, or threads where the LLM run
    // failed). This silently pulls the score toward neutral rather than excluding
    // the thread. TODO: replace with a label-derived fallback once sentimentLabel
    // is threaded through ScorerThread (architectural fix).
    const score = t.sentimentScore ?? 0;
    weightedSentimentSum += score * w;

    if (t.isRepairCase) repairWeightSum += w;
    if (t.hasLongTermFollowup) followupWeightSum += w;
  }

  if (effectiveN < MIN_EFFECTIVE_N) return undefined;

  const rawSentiment = weightedSentimentSum / effectiveN; // -1 to 1
  const normalizedBase = ((rawSentiment + 1) / 2) * 10;  // 0 to 10

  // ── Step 2: Bayesian shrinkage ────────────────────────────────────────────

  const confidenceScore =
    (PRIOR_WEIGHT * 5.0 + effectiveN * normalizedBase) /
    (PRIOR_WEIGHT + effectiveN);

  // ── Step 3: Repair penalty ────────────────────────────────────────────────

  const repairRate = repairWeightSum / effectiveN;
  const repairPenalty = Math.min(repairRate * 4, MAX_REPAIR_PENALTY);

  // ── Step 4: Follow-up bonus ───────────────────────────────────────────────

  const followupRate = followupWeightSum / effectiveN;
  const followupBonus = Math.min(followupRate * 1.5, MAX_FOLLOWUP_BONUS);

  // ── Step 5: Issue severity penalty ───────────────────────────────────────

  let rawSeverity = 0;
  for (const t of threads) {
    for (const kw of t.issueKeywords) {
      if (HIGH_SEVERITY_ISSUES.has(kw)) rawSeverity += HIGH_SEVERITY_POINTS;
      else if (MED_SEVERITY_ISSUES.has(kw)) rawSeverity += MED_SEVERITY_POINTS;
    }
  }
  const severityPenalty = Math.min(rawSeverity, MAX_SEVERITY_PENALTY);

  // ── Final score ───────────────────────────────────────────────────────────

  const raw = confidenceScore - repairPenalty + followupBonus - severityPenalty;
  const score = Math.round(Math.min(Math.max(raw, 0), 10) * 10) / 10;

  return {
    score,
    effectiveN,
    confidenceTier: confidenceTier(effectiveN),
    sentimentContribution: Math.round(confidenceScore * 10) / 10,
    repairPenalty: Math.round(repairPenalty * 10) / 10,
    followupBonus: Math.round(followupBonus * 10) / 10,
    severityPenalty: Math.round(severityPenalty * 10) / 10,
  };
}
