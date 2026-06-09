# Clinic Scoring Architecture

## Overview

This document captures the current scoring architecture for clinic trust scores.

The model uses two public-facing pillars, blended into a final overall score.
Source-specific metrics are normalised to 0–100 and feed into one or both pillars.
The same underlying metrics feed pillar scores and any source summaries shown on clinic profiles.

---

## Core Principles

- Pillars should be meaningful dimensions, not thin buckets with only 1–2 weak signals.
- Metrics map to pillars. Sources do not map to pillars 1:1.
- Public source summaries only exist for sources with strong, interpretable signal.
- Sensitive or sparse data (e.g. doctor credentials) feeds pillar scoring without becoming a public scorecard.
- Both pillar scores and source summaries must derive from the same normalised metrics to stay coherent.
- Absence of data ≠ bad clinic. Missing data uses neutral floors, not zero.

---

## Architecture

```
INPUT DATA
──────────────────────────────────────────────────────
  clinic_google_places        → Google review signals
  clinic_forum_profiles       → Forum aggregate signals
  forum_thread_llm_analysis   → Forum sentiment / repair signals
  clinic_social_media         → Social presence
  clinic_instagram_posts      → Instagram engagement / activity
  clinic_team_qualifications  → Certifications / accreditations
  registry data               → Listed / licensed / verifiable

                         ↓

SOURCE-SPECIFIC METRICS (0–100 normalised)
──────────────────────────────────────────────────────
  GOOGLE
    google_rating_score         anchored 3.5–5.0 range
    google_review_signal        log scale, saturates ~1,000 reviews

  REDDIT
    reddit_sentiment_score      −1…1 mapped to 0–100, caution-adjusted
    reddit_volume_score         log scale, saturates ~50 threads
    reddit_unique_voices_score  log scale, saturates ~500 authors
    reddit_long_term_score      log scale, saturates ~50 threads
    reddit_confidence           0–1 → 0–100, used to weight sentiment reliability

  HRN  (pipeline not yet live — inputs stubbed at 0)
    hrn_sentiment_score
    hrn_threads_score
    hrn_12m_followups_score

  INSTAGRAM
    instagram_boost             flat additive 0–5, not a weighted input

  VERIFICATION
    registry_listed             binary 100/40-floor
    license_verifiable          binary 100/40-floor
    credentials_score           points-based with diminishing returns

  BREADTH
    source_breadth_score        source_count × 25, capped at 100

                    ↓                           ↓

        REPUTATION PILLAR             EVIDENCE & TRANSPARENCY PILLAR
        (60% of final score)          (40% of final score)

                         ↓

                    OVERALL SCORE  =  0.60 × Reputation + 0.40 × Evidence
```

---

## Reputation Pillar

Represents what external public signals say about a clinic — sentiment, ratings, and community perception.

### Weights

| Metric | Weight | Notes |
|---|---|---|
| `google_rating_score` | 40% | Primary anchor |
| `google_review_signal` | 20% | Credibility modifier |
| `reddit_sentiment_score` | 25% | Caution already folded in upstream |
| `hrn_sentiment_score` | 15% | **Stubbed** — redistributed to Google until pipeline is live |
| `instagram_boost` | flat +0–5 | Additive bonus, not a weighted input |

While HRN is stubbed, Google rating effectively runs at 55% (40% + the redistributed 15%).

Reddit sentiment is confidence-weighted before being applied:
`effective_sentiment = reddit_sentiment_score × reddit_confidence / 100`

If Reddit data is missing entirely, sentiment defaults to a floor of 60.

### Caution / repair signals

Repair mention signals are folded directly into `reddit_sentiment_score` rather than being a separate penalty term. This keeps weights clean at 100% and avoids double-counting.

Formula applied inside the sentiment metric:
```
caution_factor = max(repair_ratio − 0.20, 0) × 2
adjusted_sentiment = base_sentiment × max(1 − caution_factor, 0)
```

The first 20% of repair mentions are ignored — some repair traffic is normal for any active clinic.

### Instagram

Instagram is a small flat bonus only. It cannot rescue a weak clinic or outweigh negative Google/Reddit signals.

```
instagram_boost = 0–5 (followers log scale + verified + activity)
```

### Example calculation

```
google_rating_score  = 67   (4.5★, anchored 3.5–5.0)
google_review_signal = 77   (300 reviews)
reddit_sentiment     = 55   (confidence-weighted, mild caution applied)
hrn_sentiment        = 0    (stubbed)
instagram_boost      = 2

Effective Google weight with HRN redistribution = 0.55

Reputation = 0.55 × 67 + 0.20 × 77 + 0.25 × 55 + 2
           = 36.85 + 15.4 + 13.75 + 2
           = 68
```

---

## Evidence & Transparency Pillar

Represents how much trustworthy, accessible, and independently verifiable information exists about a clinic.

### Weights

| Metric | Weight |
|---|---|
| `google_review_volume_score` | 20% |
| `reddit_unique_voices_score` | 15% |
| `reddit_long_term_score` | 15% |
| `credentials_score` | 15% |
| `source_breadth_score` | 15% |
| `reddit_volume_score` | 5% |
| `registry_listed` | 10% |
| `license_verifiable` | 5% |
| `hrn_threads_score` | 0% — stubbed |
| `hrn_12m_followups_score` | 0% — stubbed |

HRN weights will be redistributed from Google review volume and reddit volume once the pipeline is live.

### Floors (missing data)

| Metric | Floor |
|---|---|
| Reddit volume / voices / longterm (no Reddit data) | 50 |
| Registry listed (no data) | 40 |
| License verifiable (no data) | 40 |
| Credentials (none on record) | 40 |

---

## Overall Score

```
Overall = 0.60 × Reputation + 0.40 × Evidence & Transparency
```

Reputation leads because it's the most intuitive public trust signal.
Evidence & Transparency carries enough weight to meaningfully shift the final score — a clinic that ranks poorly on independent evidence can't float on a strong Google rating alone.

### Score bands

| Band | Label | Range |
|---|---|---|
| A | Excellent | 80–100 |
| B | Good | 70–79 |
| C | Fair | 60–69 |
| D | Limited | 0–59 |

---

## Public vs internal signals

### Public source summaries

Only sources with strong, interpretable signal get a standalone public summary:
- Google
- Reddit
- HRN (once live)

### Internal / pillar-only inputs

These feed pillar scores but do not become standalone public scorecards:
- Registry / verification data — too thin for a public sub-score
- Credentials — risks being read as a public rating of individual doctors; better as an internal trust input
- Instagram — signals are too easy to misread; small boost only
- Website disclosure data — not yet in active scoring

---

## Credentials scoring

Points-based, with diminishing returns so a few strong qualifications matter more than many weak ones.

```
per qualification: 10 base + 20 if authoritative source + 10 if verified within 2 years
credentials_score = min((raw_points / (count + 5)) × 25, 100)
```

**Authoritative sources:** ISHRS, ABHRS, EBOPRAS, TPRECD, IAHRS, Turkish Medical Association, Ministry of Health.

---

## Coherence rules

- Strong source metrics should produce strong pillar contributions.
- Weak source metrics should not quietly drive a high overall score.
- No major hidden penalties — every signal should have a visible explanation.
- Users should be able to look at source signals and understand why pillar scores landed where they did.

---

## Open / future

- HRN pipeline is not yet live. Its weights (reputation: 15%, evidence: hrn_threads + hrn_12m_followups) are currently redistributed to Google and Reddit respectively.
- `reddit_photo_threads_score` is computed but not weighted — all zeros in DB. Will be revisited once HRN photo followup data is available.
- If user-adjustable pillar weighting is added later, `60/40` should remain the baseline "balanced" setting.
- A future doctor-normalised table can slot into the credentials input without changing the public model.
