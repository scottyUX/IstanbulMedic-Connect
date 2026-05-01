# Reddit Score — v1 Implementation Plan

## Goal

Compute a single 0–10 score per clinic from Reddit forum data that is fair, explainable, and comparable across clinics. The score is pre-computed during the weekly pipeline run and stored in `clinic_forum_profiles.score`. Displayed in `RedditSignalsCard` alongside the existing sentiment bar, giving patients a single number they can use to quickly compare clinics.

---

## Architecture decision: pre-compute vs. query-time

**HRN plan** computes at query time (reads per-thread from DB on each page load).
**Reddit plan** pre-computes in `profileAggregator.ts` during the weekly pipeline.

Reasons:
- The aggregator already iterates per-thread data — adding the scorer is zero extra DB round trips.
- Query-time computation would require heavy per-thread joins on every page view.
- This is the v2 pattern the HRN plan describes — Reddit reaches it at v1 because the pipeline already runs weekly.
- When the HRN plan is implemented, `computeHRNScore` can be replaced with the shared `computeForumScore` function (same parameters, different `k`).

---

## Inputs

All data is already loaded in `profileAggregator.ts` except one field added by the HRN implementation:

`forum_thread_llm_analysis.sentiment_score` was added in migration `20260415000000_add_sentiment_score_to_llm_analysis.sql` — a numeric -1.0 to 1.0 value the LLM returns alongside the label. It needs to be added to the analyses select.

| Field | Table | Status |
|---|---|---|
| `sentiment_score` | `forum_thread_llm_analysis` | **Not yet fetched — add to select** |
| `sentiment_label` | `forum_thread_llm_analysis` | Already fetched — fallback if `sentiment_score` is null |
| `issue_keywords` | `forum_thread_llm_analysis` | Already fetched |
| `is_repair_case` | `forum_thread_llm_analysis` | Already fetched |
| `post_date` | `forum_thread_index` | Already fetched (recency decay) |
| `has_longterm_update` | `forum_thread_signals` | Already fetched via signalsMap |
| `postTypeThreadIds` | (computed) | Already a `Set<string>` in aggregator |

---

## Formula

Identical structure to the HRN formula. Parameters differ because Reddit N is typically smaller for Turkish hair transplant clinics.

### Step 1 — Recency-weighted sentiment mean

Use `sentiment_score` (−1.0 to 1.0) for full numeric granularity. Fall back to label-based weight (`positive=1, mixed=0, negative=−1`) for rows where `sentiment_score` is null (pre-migration data). Apply decay by post age:

```
weight(thread):
  posted < 1 year ago  → 1.0
  1–2 years ago        → 0.7
  2–3 years ago        → 0.5
  3+ years ago         → 0.3

sentimentValue = sentiment_score ?? SENTIMENT_WEIGHTS[sentiment_label]   // −1 to 1

rawSentiment = Σ(sentimentValue × ageDecay) / Σ(ageDecay)   // −1 to 1
normalizedBase = (rawSentiment + 1) / 2 × 10                // 0 to 10
effectiveN = Σ(ageDecay)                                     // effective sample size
```

**Reddit-specific:** Only include post-type threads in the score (`postTypeThreadIds`). Comment rows add context to `mention_count` but are not primary patient reviews.

### Step 2 — Bayesian shrinkage (confidence)

Pull low-N clinics toward 5.0 so a clinic with 2 glowing threads can't outscore one with 20 solid ones.

```
k = 6   // lower than HRN's 8 — Reddit N is typically smaller
confidenceScore = (k × 5.0 + effectiveN × normalizedBase) / (k + effectiveN)
```

At `effectiveN = 6` the score is 50% prior / 50% data. At `effectiveN = 20` it's ~77% data.

### Step 3 — Repair case penalty

```
totalPostThreads = threads.length          // after filtering to post-type only
repairCases      = threads.filter(t => t.isRepairCase).length

repairRate    = repairCases / totalPostThreads
repairPenalty = min(repairRate × 4, 1.5)
// 25% repair rate → 1.0 penalty, hard cap at 1.5
```

### Step 4 — Long-term follow-up bonus

Signal: `has_longterm_update` from `forum_thread_signals` (equivalent to HRN's `has_12_month_followup`).

```
longtermPostThreadCount = threads.filter(t => t.hasLongtermUpdate).length

followupRate  = longtermPostThreadCount / totalPostThreads
followupBonus = min(followupRate × 1.5, 0.75)
// 50% follow-up rate → 0.75 bonus, hard cap at 0.75
```

### Step 5 — Issue severity penalty

Each thread contributes the penalty of its **worst-tier keyword** — one penalty per thread regardless of how many matching keywords it contains. Multiple keywords in a single thread represent one patient's experience and should not stack.

```
HIGH = ['overharvesting', 'infection', 'revision_needed']                          // −0.3 per thread
MED  = ['poor_density', 'poor_growth', 'visible_scarring', 'unnatural_hairline']   // −0.1 per thread

threadPenalty(t):
  if any issueKeyword in HIGH → −0.3
  else if any issueKeyword in MED → −0.1
  else → 0

severityPenalty = min(Σ threadPenalty across all post-type threads, 2.0)   // hard cap
```

Severity keywords sourced from `issue_keywords` in `forum_thread_llm_analysis` — already in the aggregator select.

### Final score

```
rawScore = confidenceScore − repairPenalty + followupBonus − severityPenalty
redditScore = clamp(rawScore, 0, 10), rounded to 1 decimal
```

### Minimum thread threshold

Do not compute a score for `effectiveN < 3`. Return `undefined` — renders as "Insufficient data · N threads" in the card.

---

## Tunable constants (calibrate after pilot batch)

| Constant | Value | What it controls |
|---|---|---|
| `k` | 6 | How much low-N clinics are pulled toward neutral |
| Decay weights | 1.0 / 0.7 / 0.5 / 0.3 | How fast old threads lose influence |
| `repairPenalty` cap | 1.5 | Maximum score loss from repair rate |
| `followupBonus` cap | 0.75 | Maximum score gain from follow-up rate |
| `severityPenalty` cap | 2.0 | Maximum score loss from issue keywords |
| Min `effectiveN` | 3 | Below this, show no score |

---

## Schema change

### `supabase/migrations/YYYYMMDD_add_forum_score.sql` (NEW)

```sql
-- Add pre-computed composite score to clinic_forum_profiles.
-- Nullable: NULL means insufficient data (effectiveN < threshold).
-- Scoped per (clinic_id, forum_source) so HRN and Reddit store independent scores.

ALTER TABLE public.clinic_forum_profiles
  ADD COLUMN score numeric(4,1);

COMMENT ON COLUMN clinic_forum_profiles.score IS
  '0–10 composite score computed by the forum pipeline. NULL = insufficient data.';
```

Using a generic `score` name (not `reddit_score`) since each row is already scoped by `forum_source`. When HRN adopts pre-computation, it writes to the same column.

---

## Code changes

### 1. `lib/scoring/forum.ts` (NEW — pure function)

Single shared scorer used by both Reddit (in `profileAggregator`) and eventually HRN (replacing `lib/scoring/hrn.ts`). Isolated from DB — easy to unit test.

```ts
export interface ForumScorerThread {
  id: string
  postDate: string | null
  sentimentScore: number | null   // LLM numeric −1 to 1; null for pre-migration rows
  sentimentLabel: string | null   // fallback when sentimentScore is null
  isRepairCase: boolean
  issueKeywords: string[]
  hasLongtermUpdate: boolean
}

export interface ForumScorerOptions {
  k?: number          // Bayesian prior weight (default 6)
  minEffectiveN?: number  // Below this, return undefined (default 3)
}

export function computeForumScore(
  threads: ForumScorerThread[],
  options?: ForumScorerOptions
): number | undefined
```

Implementation covers:
- Recency decay by `postDate`
- Bayesian shrinkage
- Repair case penalty
- Follow-up bonus
- Severity penalty
- Returns `undefined` if `effectiveN < minEffectiveN`

### 2. `app/api/forumPipeline/profileAggregator.ts`

**A — Add `sentiment_score` to the analyses select:**

```ts
// Before
.select('thread_id, sentiment_label, satisfaction_label, main_topics, issue_keywords, is_repair_case, summary_short')

// After
.select('thread_id, sentiment_label, sentiment_score, satisfaction_label, main_topics, issue_keywords, is_repair_case, summary_short')
```

**B — Build `ForumScorerThread[]` from existing lookups:**

After the existing lookup tables are built (`analysisMap`, `signalsMap`), assemble the scorer input using only post-type thread IDs:

```ts
import { computeForumScore } from '@/lib/scoring/forum'

const scorerThreads: ForumScorerThread[] = threads
  .filter(t => postTypeThreadIds.has(t.id))
  .map(t => {
    const a = analysisMap[t.id]
    const s = signalsMap[t.id]
    return {
      id: t.id,
      postDate: t.post_date ?? null,
      sentimentScore: a?.sentiment_score != null ? Number(a.sentiment_score) : null,
      sentimentLabel: a?.sentiment_label ?? null,
      isRepairCase: a?.is_repair_case === true,
      issueKeywords: a?.issue_keywords ?? [],
      hasLongtermUpdate: s?.['has_longterm_update'] === true,
    }
  })

const score = computeForumScore(scorerThreads, { k: 6, minEffectiveN: 3 })
```

**C — Add `score` to the upsert payload:**

```ts
score: score ?? null,
```

**D — Add `score` to `AggregatedProfile` interface:**

```ts
score: number | null
```

### 3. `lib/api/forumSignals.ts`

**A — Add `score` to `ClinicForumProfile`:**

```ts
score: number | null
```

**B — Map in `getForumSignals`:**

```ts
score: data.score != null ? Number(data.score) : null,
```

The fetch already uses `.select('*')` so no query change needed.

### 4. `RedditSignalsCard.tsx` — score display

**A — Score badge in the card header** (replaces the positive/concern count row):

```tsx
{data.score != null ? (
  <div className="flex items-center gap-1.5">
    <span className={cn(
      "text-2xl font-bold tabular-nums",
      data.score >= 7.5 ? "text-emerald-600"
        : data.score >= 5.0 ? "text-amber-600"
        : "text-red-600"
    )}>
      {data.score.toFixed(1)}
    </span>
    <span className="text-sm text-muted-foreground">/&nbsp;10</span>
  </div>
) : (
  <span className="text-xs text-muted-foreground">Insufficient data</span>
)}
```

**B — Confidence tier and thread count** (below score):

```tsx
{data.score != null && (
  <p className="text-xs text-muted-foreground">
    {effectiveTier(data)} · {data.threadCount} thread{data.threadCount !== 1 ? 's' : ''}
  </p>
)}
```

Where `effectiveTier` maps `threadCount` to "High confidence" / "Moderate" / "Low confidence":
- `threadCount >= 15` → "High confidence"
- `threadCount >= 6`  → "Moderate"
- `threadCount >= 3`  → "Low confidence"

(Using `threadCount` here as a proxy for `effectiveN` — exact `effectiveN` is not stored but thread count is a good approximation.)

**C — "How is this calculated?" tooltip (Info icon)**

Small `Info` icon next to the score. On click/hover shows:

> **Reddit Score is based on:**
> - Patient sentiment across attributed posts (recent posts weighted more heavily)
> - Long-term follow-up rate (posts with 6-month+ updates)
> - Repair and revision case rate
> - Severity of reported issues (keywords like overharvesting, infection)
>
> Clinics with fewer than 3 posts show no score. Scores reflect self-reported experiences on Reddit, not clinical outcomes. Highly satisfied and dissatisfied patients are both more likely to post.

**D — Score breakdown row (collapsible, below score badge)**

```
Sentiment contribution:   +7.4
Follow-up bonus:          +0.3
Repair penalty:            0.0
Severity penalty:         −0.1
Confidence (posts: 12):   moderate
```

This requires passing computed sub-scores from the backend. Either:
- Store breakdown as a JSONB column `score_breakdown` in `clinic_forum_profiles` (simplest — aggregator computes it anyway), or
- Derive approximate breakdowns client-side from existing `sentimentScore`, `repairMentionCount`, `longtermThreadCount` for v1, and add the stored breakdown in v2.

**Recommendation:** Use client-side approximation for v1, store `score_breakdown` in v2 when HRN alignment is needed.

---

## Unit tests — `tests/unit/forum-score.test.ts` (NEW)

Cover:
- High-confidence clinic (N=20, 80% positive) → score in 7–9 range
- Low-N clinic (N=2) → returns `undefined`
- Low-N clinic (N=4) → Bayesian shrinkage pulls toward 5.0
- High repair rate (40%) → penalty applied
- Long-term follow-ups present → bonus applied
- Thread with HIGH keyword → −0.3 penalty applied
- Thread with MED keyword → −0.1 penalty applied
- Thread with both HIGH and MED keywords → −0.3 only (worst tier, no stacking)
- Recency decay: old threads (3+ years) weighted at 0.3 vs recent at 1.0
- Thread with null `sentiment_label` → treated as `mixed` (weight 0), doesn't crash
- Only post-type threads included (comment threads excluded from input)

---

## Run sequence to populate existing profiles

After the migration and code changes are deployed:

```bash
# Recompute all reddit profiles to populate score column
npx tsx scripts/forum-recompute-profiles.ts --source reddit --all
```

(The `--all` flag forces recompute even for non-stale rows. Add this flag to `forum-recompute-profiles.ts` if not already present — currently it only processes `is_stale = true` rows.)

---

## Open questions

1. **Repair case directionality** — `is_repair_case` means this procedure was a repair of prior work. It doesn't tell us whether the repair was *at* this clinic or *from* this clinic. For v1, treat all repair threads attributed to a clinic as a mild negative signal. In v2, use `secondary_clinic_mentions` with `role: 'repair_source'` to distinguish.

2. **Comment rows** — Comments are excluded from scoring (post-type only) but included in `mention_count`. Comments with inherited `clinic_id` could inform the score but introduce noise (casual mentions, cross-clinic comparisons). Revisit in v2 if comment scraping is deployed.

3. **Score calibration** — Run `computeForumScore` against the current 22-clinic batch in a script before committing to constants. Adjust `k` and decay weights based on the actual score distribution.

4. **HRN convergence** — The HRN plan creates `lib/scoring/hrn.ts` independently. If both are implemented, consolidate into `lib/scoring/forum.ts` (this file) with `k: 8` for HRN and `k: 6` for Reddit to avoid duplicated formula code.
