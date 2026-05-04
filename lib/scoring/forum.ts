/**
 * Forum score computation — shared by Reddit (profileAggregator) and HRN.
 *
 * Pure function — no DB access, no side effects. Takes per-thread data already
 * assembled by the caller and returns a 0–10 score breakdown, or undefined if
 * there is insufficient data.
 *
 * Formula:
 *   1. Recency-weighted sentiment mean  →  normalizedBase (0–10)
 *   2. Bayesian shrinkage toward 5.0    →  confidenceScore
 *   3. Repair case penalty              →  − up to 1.5
 *   4. Long-term follow-up bonus        →  + up to 0.8
 *   5. Issue severity penalty           →  − up to 2.0
 */

// ── Constants (tunable after pilot batch) ─────────────────────────────────────

/** Prior weight — how much a low-N clinic is pulled toward neutral (5.0). */
const PRIOR_WEIGHT = 6;

/** Minimum effective sample size required to show a score. */
const MIN_EFFECTIVE_N = 3;

const DECAY = {
  under1yr: 1.0,
  yr1to2:   0.7,
  yr2to3:   0.5,
  over3yr:  0.3,
} as const;

const SENTIMENT_WEIGHTS: Record<string, number> = {
  positive:  1,
  mixed:     0,
  negative: -1,
};

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
const MED_SEVERITY_POINTS  = 0.1;
const MAX_SEVERITY_PENALTY = 2.0;
const MAX_REPAIR_PENALTY   = 1.5;
const MAX_FOLLOWUP_BONUS   = 0.8;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ForumScorerThread {
  postDate: string | null;
  sentimentScore: number | null;  // LLM numeric −1 to 1; null for pre-migration rows
  sentimentLabel: string | null;  // fallback when sentimentScore is null
  isRepairCase: boolean;
  issueKeywords: string[];
  hasLongtermUpdate: boolean;
  isComment?: boolean;  // true for inherited comment rows (weighted at 0.5 by default); omitting treated as false
}

export interface ForumScoreBreakdown {
  score: number;
  effectiveN: number;
  confidenceTier: 'high' | 'moderate' | 'low';
  sentimentContribution: number;
  repairPenalty: number;
  followupBonus: number;
  severityPenalty: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ageDecayWeight(postDate: string | null, now: Date): number {
  if (!postDate) return DECAY.over3yr;
  const ageMs = now.getTime() - new Date(postDate).getTime();
  const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);
  if (ageYears < 1) return DECAY.under1yr;
  if (ageYears < 2) return DECAY.yr1to2;
  if (ageYears < 3) return DECAY.yr2to3;
  return DECAY.over3yr;
}

function toConfidenceTier(effectiveN: number): ForumScoreBreakdown['confidenceTier'] {
  if (effectiveN >= 15) return 'high';
  if (effectiveN >= 6)  return 'moderate';
  return 'low';
}

/** Worst-tier per thread — keywords do not stack within a single thread. */
function threadSeverityPoints(thread: ForumScorerThread, commentWeight: number): number {
  const keywords = thread.issueKeywords;
  let base = 0;
  for (const kw of keywords) {
    if (HIGH_SEVERITY_ISSUES.has(kw)) { base = HIGH_SEVERITY_POINTS; break; }
  }
  if (base === 0) {
    for (const kw of keywords) {
      if (MED_SEVERITY_ISSUES.has(kw)) { base = MED_SEVERITY_POINTS; break; }
    }
  }
  return base * (thread.isComment ? commentWeight : 1.0);
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Returns a score breakdown, or undefined if there is insufficient data.
 * Pass `now` in tests to pin the current date.
 *
 * Caller is responsible for pre-filtering threads to the desired set
 * (e.g. Reddit post-type only — exclude comment rows before calling).
 */
export function computeForumScore(
  threads: ForumScorerThread[],
  now: Date = new Date(),
  options?: { commentWeight?: number },
): ForumScoreBreakdown | undefined {
  if (threads.length === 0) return undefined;

  const commentWeight = options?.commentWeight ?? 0.5;

  // ── Step 1: Recency-weighted sentiment mean ───────────────────────────────
  // Inherited comments contribute at commentWeight (default 0.5) — post-type threads at 1.0.

  let weightedSentimentSum = 0;
  let effectiveN = 0;

  for (const t of threads) {
    const ageDecay = ageDecayWeight(t.postDate, now);
    const typeWeight = t.isComment ? commentWeight : 1.0;
    const w = ageDecay * typeWeight;
    effectiveN += w;
    const sentimentValue =
      t.sentimentScore ?? (SENTIMENT_WEIGHTS[t.sentimentLabel ?? ''] ?? 0);
    weightedSentimentSum += sentimentValue * w;
  }

  if (effectiveN < MIN_EFFECTIVE_N) return undefined;

  const rawSentiment  = weightedSentimentSum / effectiveN;   // −1 to 1
  const normalizedBase = ((rawSentiment + 1) / 2) * 10;     // 0 to 10

  // ── Step 2: Bayesian shrinkage ────────────────────────────────────────────

  const confidenceScore =
    (PRIOR_WEIGHT * 5.0 + effectiveN * normalizedBase) /
    (PRIOR_WEIGHT + effectiveN);

  // ── Steps 3 & 4: Post-type threads only (repair rate, follow-up bonus) ───

  const postThreads = threads.filter(t => !t.isComment);
  const totalPostThreads = postThreads.length;

  const repairRate    = totalPostThreads > 0 ? postThreads.filter(t => t.isRepairCase).length / totalPostThreads : 0;
  const repairPenalty = Math.min(repairRate * 4, MAX_REPAIR_PENALTY);

  const followupRate  = totalPostThreads > 0 ? postThreads.filter(t => t.hasLongtermUpdate).length / totalPostThreads : 0;
  const followupBonus = Math.min(followupRate * 1.5, MAX_FOLLOWUP_BONUS);

  // ── Step 5: Issue severity penalty (comments at half penalty) ────────────

  let rawSeverity = 0;
  for (const t of threads) {
    rawSeverity += threadSeverityPoints(t, commentWeight);
  }
  const severityPenalty = Math.min(rawSeverity, MAX_SEVERITY_PENALTY);

  // ── Final score ───────────────────────────────────────────────────────────

  const raw   = confidenceScore - repairPenalty + followupBonus - severityPenalty;
  const score = Math.round(Math.min(Math.max(raw, 0), 10) * 10) / 10;

  return {
    score,
    effectiveN,
    confidenceTier: toConfidenceTier(effectiveN),
    sentimentContribution: Math.round(confidenceScore * 10) / 10,
    repairPenalty:         Math.round(repairPenalty  * 10) / 10,
    followupBonus:         Math.round(followupBonus  * 10) / 10,
    severityPenalty:       Math.round(severityPenalty * 10) / 10,
  };
}
