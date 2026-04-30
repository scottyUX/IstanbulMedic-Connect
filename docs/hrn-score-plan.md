# HRN Score — v1 Implementation Plan

## Goal

Compute a single 0–10 score per clinic from HRN forum data that is fair, explainable, and transparent to users. The score lives in the `hrnScore` field already present on `HRNSignalsData` and rendered in `HRNSignalsCard`.

---

## Inputs

All data is available in the DB today. Two fields are **not yet fetched** by `getHRNSignals` and need to be added to the query:

| Field | Table | Status |
|---|---|---|
| `sentiment_score` | `forum_thread_llm_analysis` | Not yet fetched — need to add to `.select()` |
| `issue_keywords` | `forum_thread_llm_analysis` | Not yet fetched — need to add to `.select()` |
| `sentiment_label` | `forum_thread_llm_analysis` | Already fetched |
| `is_repair_case` | `forum_thread_llm_analysis` | Already fetched |
| `has_12_month_followup` | `forum_thread_signals` | Already fetched |
| `post_date` | `forum_thread_index` | Already fetched (needed for recency decay) |

---

## Formula

### Step 1 — Recency-weighted sentiment mean

Use `sentiment_score` (-1.0 to 1.0) rather than label counts for full granularity. Apply decay so stale threads don't dominate:

```
weight(thread):
  posted < 1 year ago   → 1.0
  1–2 years ago         → 0.7
  2–3 years ago         → 0.5
  3+ years ago          → 0.3

rawSentiment = Σ(sentiment_score × weight) / Σ(weight)   // -1 to 1
normalizedBase = (rawSentiment + 1) / 2 × 10             // 0 to 10
effectiveN = Σ(weight)                                   // effective sample size
```

### Step 2 — Bayesian shrinkage (confidence)

Pull low-N clinics toward 5.0 (neutral) so a clinic with 2 glowing threads can't outscore one with 30 solid threads.

```
k = 8   // prior weight — tunable after seeing real data distribution
confidenceScore = (k × 5.0 + effectiveN × normalizedBase) / (k + effectiveN)
```

At `effectiveN = 8` the score is 50% prior / 50% data. At `effectiveN = 30` it's ~79% data.

### Step 3 — Repair case penalty

`is_repair_case = true` means THIS procedure was a repair of prior work — a direct negative signal about a previous clinic. A high repair rate for a clinic signals patient dissatisfaction downstream.

```
repairRate = repairCases / totalThreads
repairPenalty = min(repairRate × 4, 1.5)
// 25% repair rate → 1.0 penalty, hard cap at 1.5
```

### Step 4 — Long-term follow-up bonus

Patients who return to post 12+ month results are a positive signal — committed patients, results worth showing. Rewards transparency.

```
followupRate = longTermFollowups / totalThreads
followupBonus = min(followupRate × 1.5, 0.75)
// 50% follow-up rate → 0.75 bonus, hard cap at 0.75
```

### Step 5 — Issue severity penalty

Threads reporting severe outcomes should drag the score more than raw sentiment captures. Severity tiers:

```
HIGH  = ['overharvesting', 'infection', 'revision_needed']   // −0.3 per occurrence
MED   = ['poor_density', 'poor_growth', 'visible_scarring',
          'unnatural_hairline']                               // −0.1 per occurrence

severityPenalty = min(Σ(per-thread severity points), 2.0)    // hard cap
```

### Final score

```
rawScore = confidenceScore − repairPenalty + followupBonus − severityPenalty
hrnScore = clamp(rawScore, 0, 10), rounded to 1 decimal
```

### Minimum thread threshold

Do not compute a score for `effectiveN < 4`. Return `hrnScore: undefined` → renders as "Insufficient data · N threads" in the card.

---

## Tunable constants (calibrate after pilot batch)

| Constant | Value | What it controls |
|---|---|---|
| `k` | 8 | How much low-N clinics are pulled toward neutral |
| Decay weights | 1.0 / 0.7 / 0.5 / 0.3 | How fast old threads lose influence |
| `repairPenalty` cap | 1.5 | Maximum score loss from repair rate |
| `followupBonus` cap | 0.8 | Maximum score gain from follow-up rate |
| `severityPenalty` cap | 2.0 | Maximum score loss from issue keywords |
| Min `effectiveN` | 4 | Below this, show no score |

---

## Code changes

### 1. `lib/api/hrn.ts` — fetch additional fields

Add `sentiment_score` and `issue_keywords` to the `forum_thread_llm_analysis` select:

```ts
// Before
.select('thread_id, sentiment_label, summary_short, main_topics, is_repair_case')

// After
.select('thread_id, sentiment_label, sentiment_score, summary_short, main_topics, issue_keywords, is_repair_case')
```

### 2. `lib/scoring/hrn.ts` — new pure function (create file)

```ts
computeHRNScore(threads: HRNThread[], analyses: AnalysisRow[]): number | undefined
```

Pure function — easy to unit test in isolation. Takes the per-thread data already assembled in `getHRNSignals` and returns the final score or `undefined` if below threshold.

### 3. `lib/api/hrn.ts` — call the scorer

At the end of `getHRNSignals`, after assembling `allThreads`:

```ts
const hrnScore = computeHRNScore(allThreads, analyses ?? [])
return { ..., hrnScore }
```

### 4. `tests/unit/hrn-score.test.ts` — unit tests

Cover:
- High-confidence clinic (N=30, 80% positive) → score in 7–9 range
- Low-N clinic (N=3) → Bayesian shrinkage pulls toward 5.0
- `effectiveN < 4` → returns `undefined`
- High repair rate → penalty applied
- Long-term follow-ups → bonus applied
- HIGH severity issues → penalty applied
- Recency decay: old threads weighted less than recent ones

---

## UI/UX changes (`HRNSignalsCard.tsx`)

### Score display — replace "Coming soon" with confidence tier

```
7.8 / 10    High confidence · 34 threads
5.2 / 10    Moderate · 9 threads
— / 10      Insufficient data · 2 threads
```

Confidence tiers:
- `effectiveN >= 20` → "High confidence"
- `effectiveN >= 8`  → "Moderate"
- `effectiveN >= 4`  → "Low confidence"
- `effectiveN < 4`   → no score shown

Score color (subtle):
- 7.5+ → emerald
- 5.0–7.4 → amber  
- < 5.0 → red

### "How is this calculated?" tooltip/modal

Small `Info` icon next to the score. Content:

> **HRN Score is based on:**
> - Patient sentiment across all attributed threads (recent reviews weighted more heavily)
> - Long-term follow-up rate (12+ month result threads)
> - Repair case rate
> - Severity of reported issues
>
> Clinics with fewer than 5 threads show no score. Scores reflect self-reported patient experiences on HairRestorationNetwork.com, not clinical outcomes.

### Score breakdown row (optional, expandable)

Below the score, a collapsed/hover section showing component contributions:

```
Sentiment contribution:   +7.2
Follow-up bonus:          +0.4
Repair penalty:           −0.3
Severity penalty:         −0.1
Confidence (N=34):        high
```

---

## Architecture note — v1 vs v2

**v1 (this plan):** Compute in `getHRNSignals` at query time. Simple, no schema changes.

**v2 (post full batch):** Pre-compute and store in `clinic_forum_profiles` during the pipeline run. Necessary once we have 28K threads — computing per page view would be wasteful. The `computeHRNScore` function is already isolated so the migration is straightforward.

---

## Open questions

1. **Repair case directionality** — `is_repair_case` means this procedure was a repair. It doesn't tell us whether the repair was *at* this clinic or *from* this clinic. We'd need to look at `secondary_clinic_mentions` with `role: 'repair_source'` to distinguish. For v1, treat all repair threads attributed to a clinic as a mild negative signal. Revisit in v2.

2. **Self-selection bias note in UI** — HRN over-represents both very happy and very unhappy patients. Worth a brief disclosure near the score. Proposed copy: *"Forum scores reflect self-reported experiences. Highly satisfied and dissatisfied patients are both more likely to post."*

3. **Score calibration** — Run the formula against the 50-thread pilot batch before committing to the constants. Adjust `k` and decay weights based on the actual score distribution.
