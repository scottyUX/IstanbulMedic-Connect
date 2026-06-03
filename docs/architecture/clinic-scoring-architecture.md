# Clinic Scoring Architecture

## Overview

This document captures the current scoring architecture direction for clinic ranking and trust presentation.

The model uses:

- 2 public-facing pillars
- a final overall clinic score
- a small set of public source summaries
- direct pillar inputs for thinner or more sensitive data sources

## Core Principles

- Pillars should be meaningful dimensions, not thin buckets with only 1-2 weak signals.
- Source summaries are secondary, not the primary scoring primitive.
- Metrics map to pillars. Sources do not map to pillars 1:1.
- Public source summaries should only exist for sources with strong, interpretable signal.
- Sensitive or sparse data such as doctor credentials should inform pillar scoring without becoming a public scorecard.
- Both pillar scores and source summaries should derive from the same underlying normalized metrics to avoid incoherent discrepancies.

## Final Public Model

### Pillars

- `Reputation`
- `Evidence & Transparency`

### Final Score

- `overall_score`

### Public Secondary Source Summaries

- `Google`
- `Reddit`
- `HRN`

### Inputs That Should Not Be Public Source Summaries

- Website / disclosure signals
- Registry / verification signals
- Credentials / certifications / memberships
- Doctor table data when it exists
- Instagram / social presence

These should feed the pillar scores directly rather than become standalone public scorecards.

## Why This Model

### Why not keep Transparency separate?

Standalone `Transparency` looked too thin. In practice it blended two related ideas:

- how much the clinic discloses itself
- how much accessible and verifiable information exists across the web

Those fit better together as `Evidence & Transparency`.

### Why not keep Clinical Governance separate?

Standalone `Clinical Governance` also looked too thin for a major public pillar. The available signals are important, but currently limited:

- registry presence
- license / verifiable status
- certifications / accreditations / memberships

These fit more naturally inside `Evidence & Transparency` as verifiable trust-supporting evidence.

### Why not make doctor credentials public-facing?

- the data may be too sparse to support a robust public summary
- it risks being interpreted as a public rating of individual doctors
- it is better used as an internal trust input than a headline scorecard

## Architecture Diagram

```text
                    FINAL CLINIC SCORING ARCHITECTURE (2-PILLAR MODEL)


┌──────────────────────────────────────────────────────────────────────────────┐
│ 1. INPUT DATA                                                               │
│                                                                              │
│  clinic_scraped_data         -> website/public disclosure signals            │
│  clinic_google_places        -> google review signals                        │
│  clinic_forum_profiles       -> forum aggregate signals                      │
│  forum_thread_llm_analysis   -> forum sentiment / issue / repair signals     │
│  clinic_social_media         -> social presence                              │
│  clinic_instagram_posts      -> instagram engagement/activity                │
│  clinic_credentials          -> certifications / memberships                 │
│  clinic_team / doctor table  -> doctor/team/credential context               │
│  registry data               -> listed / licensed / verifiable status        │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ 2. SOURCE-SPECIFIC METRICS                                                  │
│                                                                              │
│                                                                              │
│  GOOGLE                                                                     │
│  - rating                                                                   │
│  - review count                                                             │
│                                                                              │
│  REDDIT                                                                     │
│  - sentiment                                                                │
│  - thread count                                                             │
│  - unique authors                                                           │
│  - long-term evidence                                                       │
│  - repair/caution signals                                                   │
│                                                                              │
│  HRN                                                                        │
│  - sentiment                                                                │
│  - photo threads                                                            │
│  - 12m+ followups                                                           │
│  - thread count                                                             │
│  - repair/caution signals                                                   │
│                                                                              │
│  INSTAGRAM                                                                  │
│  - account exists                                                           │
│  - engagement                                                               │
│  - posting activity - maybe just slight                                     |
|                          reward                                             │
│                                                                              │
│  GOVERNANCE / VERIFICATION                                                  │
│  - registry listed                                                          │
│  - license/verifiable status                                                │
│  - certifications/accreditations/memberships                               │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼

┌──────────────────────────────────────────────────┐   ┌───────────────────────┐
│ 3A. PILLAR CONTRIBUTION MAPPING                  │   │ 3B. SOURCE SUMMARIES   │
│                                                  │   │   public secondary     │
│ Reputation                                       │   │                       │
│ <- google rating                                 │   │ Google summary        │
│ <- google review signal                          │   │ Reddit summary        │
│ <- reddit sentiment                              │   │ HRN summary           │
│ <- reddit repair/caution signals                 │   │                       │
│ <- hrn sentiment                                 │   │ No standalone public  │
│ <- hrn repair/caution signals                    │   │ source score for:     │
│ <- light social contribution if ever needed      │   │ - Website             │
|    (instagram metrics)
│                                                  │   │ - Registry            │
│ Evidence & Transparency                          │   │ - Credentials         │
│                                                  │   │ - Doctor data         │
│ <- reddit thread volume / unique voices          │   │ - Instagram           │
│ <- reddit long-term evidence                     │   └───────────────────────┘
│ <- hrn photo threads / 12m+ followups            │
│ <- hrn thread volume                             │
│ <- google review volume                          │
│ <- source breadth                                │
│ <- registry/verifiable presence                  │
│ <- credentials/accreditations/memberships        │
│ <- doctor/team disclosure or verification        │
└──────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ 4. PILLAR SCORES                                                            │
│                                                                              │
│  reputation_score                                                           │
│  evidence_transparency_score                                                │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ 5. FINAL CLINIC SCORE                                                       │
│                                                                              │
│  overall_score = weighted blend of:                                         │
│  - reputation_score                                                         │
│  - evidence_transparency_score                                              │
│                                                                              │
│  output:                                                                    │
│  - overall score                                                            │
│  - score band                                                               │
│  - clinic ranking                                                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Pillar Definitions

### Reputation

`Reputation` represents what external public signals say about the clinic.

Example inputs:

- Google rating
- Google review signal
- Reddit sentiment
- HRN sentiment
- Reddit repair / caution signals
- HRN repair / caution signals
- very light social contribution if justified later

This pillar should reflect sentiment and cautionary external signals, not disclosure quality or formal verification.

### Evidence & Transparency

`Evidence & Transparency` represents how much trustworthy, accessible, and disclosed information exists about the clinic.

Example inputs:

- pricing clarity
- package clarity
- doctor/team info listed
- before/after presence
- reddit thread volume
- reddit unique voices
- reddit long-term evidence
- HRN photo threads
- HRN 12+ month followups
- HRN thread volume
- Google review volume
- source breadth
- registry / verifiable presence
- credentials / accreditations / memberships
- doctor/team verification context

This pillar intentionally combines:

- self-disclosure by the clinic
- independent volume of evidence
- verifiable supporting trust signals

## Source Summary Rules

### Public Source Summaries

Only use public source summaries where the source has enough substance and the summary is easy to interpret.

Current candidates:

- `Google`
- `Reddit`
- `HRN`

### Non-Public Inputs

These should stay as pillar inputs rather than public scorecards:

- Website
- Registry
- Credentials
- Doctor table data
- Instagram

Reasons:

- too thin to justify a standalone public summary
- too noisy relative to trust value
- too sensitive or ethically awkward for public scoring

## How Source Summaries Should Be Calculated

Source summaries should be calculated from the same normalized source-specific metrics used by pillar scoring.

Pattern:

```text
raw source data
  -> source-specific metrics
  -> normalized subscores
  -> source summary score

same source-specific metrics
  -> pillar contribution mapping
  -> pillar scores
```

This shared-metrics architecture reduces the risk of obvious contradictions between high source summaries and low overall scores.

## Coherence Rules

To keep the scoring system understandable:

- Strong source metrics should usually create strong contribution to at least one pillar.
- Weak source metrics should not quietly drive a high overall score.
- Important metrics should remain important across both source summaries and pillar logic, even if exact weights differ.
- No major hidden penalties should exist without a visible explanation.
- Users should be able to look at source signals and understand why the pillar scores landed where they did.

## Practical Product Guidance

### Primary Public Display

Show:

- `Reputation`
- `Evidence & Transparency`
- `Overall Score`

### Secondary Public Display

Optionally show:

- `Google`
- `Reddit`
- `HRN`

These should read as supporting evidence layers, not as competing headline scores.

### Internal / Future-Facing Inputs

Keep these in the model as direct inputs even if they do not become public scorecards:

- website disclosure data from `clinic_scraped_data`
- registry verification data
- `clinic_credentials`
- `clinic_team` and any future doctor-normalized table
- light social/Instagram signals if they prove useful

## Open Implementation Notes

- `clinic_scraped_data` is assumed to exist as an upstream scrape/enrichment table.
- A future doctor-normalized table can be added to the input layer without changing the public scoring model.
- If Instagram later becomes much richer and more interpretable, it can be reconsidered, but it should not be forced into a public source summary now.
- The repo already has `clinic_scores` and `clinic_score_components`; these may be extendable for final storage, though source-level and pillar-level persistence may still need dedicated tables or JSON breakdowns.

## Reputation Pillar v1.5

This section captures the current proposed v1.5 implementation for the `Reputation` pillar.

### Top-Level Reputation Formula

```text
Reputation =
  0.35 * google_rating_score
+ 0.15 * google_review_signal
+ 0.20 * reddit_sentiment_score
- 0.10 * reddit_caution_penalty
+ 0.20 * hrn_sentiment_score
- 0.10 * hrn_caution_penalty
+ instagram_boost
```

Rules:

- all weighted inputs except Instagram should be normalized to `0-100`
- `Reputation` should be clamped to `0-100`
- `instagram_boost` should be small and capped
- Instagram should never function as a major reputation driver

### Why This Version

- it uses only the metrics already defined under `Reputation` in the architecture diagram
- it keeps evidence-style metrics out of the reputation pillar
- it is easier to explain and implement than a nested source-score formula
- it keeps Google as the anchor while giving Reddit and HRN equal forum weight

### Google

Google is the anchor reputation source.

#### Inputs

- `clinic_google_places.rating`
- `clinic_google_places.user_ratings_total`

#### Weighting

- `google_rating_score`: `35%`
- `google_review_signal`: `15%`

#### Guidance

- `google_rating_score` is the primary Google input.
- `google_review_signal` is a modest credibility input.
- Review count should matter, but should not overpower the actual rating.

#### Suggested Normalization

- `google_rating_score`
  - map approximately `3.5 to 5.0` onto `0-100`
  - clinics below `3.5` should fall near the floor
- `google_review_signal`
  - use a saturating curve rather than a linear scale
  - rough intuition:
    - `0 reviews -> 0`
    - `20 reviews -> 40`
    - `100 reviews -> 75`
    - `300+ reviews -> 100`

### Reddit

Reddit is a forum/community reputation source.

#### Inputs

From `clinic_forum_profiles` and `forum_thread_llm_analysis`:

- `sentiment_score`
- `repair_mention_count`

#### Weighting

- `reddit_sentiment_score`: `20%`
- `reddit_caution_penalty`: `10%` negative weight

#### Guidance

- Sentiment should dominate the positive side of Reddit reputation.
- Repair / caution should act as a penalty, not a positive subscore.
- Reputation should not directly include extra evidence metrics such as thread volume or unique authors in this version.

#### Suggested Normalization

- `reddit_sentiment_score`
  - map `-1..1` to `0..100`
- `reddit_caution_penalty`
  - normalize to `0..100`
  - derive only from repair signals for v1.5

#### Caution Formula

```text
reddit_caution_penalty =
  min(
    100,
    50 * has_any_repair_signal
  + 15 * min(repair_thread_count, 3)
  )
```

Where:

- `has_any_repair_signal = 1 if repair_mention_count > 0 else 0`
- `repair_thread_count = repair_mention_count`

### HRN

HRN is a forum/case-history reputation source.

#### Inputs

From `clinic_forum_profiles` and `forum_thread_llm_analysis`:

- `sentiment_score`
- `repair_mention_count`

#### Weighting

- `hrn_sentiment_score`: `20%`
- `hrn_caution_penalty`: `10%` negative weight

#### Guidance

- HRN sentiment should mirror Reddit sentiment in top-level weighting.
- HRN caution / repair signals should remain a meaningful negative factor.
- For v1.5, use the same repair-based caution structure as Reddit for simplicity and symmetry.

#### Suggested Normalization

- `hrn_sentiment_score`
  - map `-1..1` to `0..100`
- `hrn_caution_penalty`
  - normalize to `0..100`
  - derive only from repair signals for v1.5

#### Caution Formula

```text
hrn_caution_penalty =
  min(
    100,
    50 * has_any_repair_signal
  + 15 * min(repair_thread_count, 3)
  )
```

Where:

- `has_any_repair_signal = 1 if repair_mention_count > 0 else 0`
- `repair_thread_count = repair_mention_count`

### Instagram Boost

Instagram should be a small additive boost, not a real weighted source.

#### Formula

```text
instagram_boost = 0 to +5
```

#### Inputs

From `clinic_social_media` and `clinic_instagram_posts`:

- account exists
- recent posting activity
- basic engagement sanity
- optional profile completeness signals

#### Suggested Rubric

- no account or dormant account: `0`
- active account, limited signal: `+1`
- active and reasonably credible presence: `+2 to +3`
- very strong public-facing presence: `+4 to +5`

#### Rule

Instagram can help a little, but should never:

- rescue a weak clinic
- outweigh negative Google / Reddit / HRN signals
- dominate the `Reputation` pillar

### Example Calculation

```text
google_rating_score = 84
google_review_signal = 70
reddit_sentiment_score = 68
reddit_caution_penalty = 20
hrn_sentiment_score = 74
hrn_caution_penalty = 10
instagram_boost = 3

Reputation =
  0.35*84
+ 0.15*70
+ 0.20*68
- 0.10*20
+ 0.20*74
- 0.10*10
+ 3

= 29.4
+ 10.5
+ 13.6
- 2
+ 14.8
- 1
+ 3

= 68.3
```

## Evidence & Transparency Pillar v1.5

This section captures the current proposed v1.5 implementation for the `Evidence & Transparency` pillar.

### Top-Level Structure

```text
Evidence & Transparency = 100%

Independent evidence = 55%
Verification = 35%
Breadth / coverage = 10%
```

### Why This Redistribution Works

#### Independent Evidence — 55%

This becomes the clear dominant signal:

- hardest to fake at scale
- strongest proxy for real patient outcomes and real-world experience
- rewards corroboration, depth, and time

#### Verification — 35%

This becomes a real legitimacy floor:

- prevents "popular but weakly verified" clinics from looking too strong
- keeps formal trust signals meaningfully represented

#### Breadth / Coverage — 10%

This remains useful, but proportionate:

- rewards cross-ecosystem presence
- does not let simple discoverability overpower stronger evidence

### Final Recommended Version

#### Independent Evidence — 55%

- Reddit volume = `8%`
- Reddit unique voices = `11%`
- Reddit long-term evidence = `9%`
- HRN threads = `5%`
- HRN photo threads = `8%`
- HRN 12m+ followups = `8%`
- Google review volume = `6%`

#### Verification — 35%

- registry listed = `14%`
- license / verifiable = `14%`
- credentials / accreditations = `7%`

#### Breadth / Coverage — 10%

- source breadth = `10%`

## Overall Score Default Weighting

The current recommended default weighting for the final clinic score is:

```text
Overall Score =
  0.60 * Reputation
+ 0.40 * Evidence & Transparency
```

### Why `60 / 40`

- it gives `Reputation` the lead as the most intuitive public trust signal
- it still gives `Evidence & Transparency` enough weight to matter materially
- it avoids making the system feel too popularity-driven
- it better reflects the fact that `Evidence & Transparency` is now a substantial pillar, not a thin supporting metric

### Product Direction

- `60 / 40` is the recommended default
- this weighting may become user-adjustable later
- if user adjustment is added, `60 / 40` should remain the baseline "balanced" setting

## Source Summaries

This section captures the current public source-summary decisions.

### Google Summary

The Google source summary should use the same underlying Google metrics that feed the `Reputation` pillar, but reweighted as a standalone Google-only score.

```text
Google Summary =
  0.75 * google_rating_score
+ 0.25 * google_review_signal
```

#### Inputs

- `clinic_google_places.rating`
- `clinic_google_places.user_ratings_total`

#### Why `75 / 25`

- Google star rating is the primary thing users mean by "Google reputation"
- review count adds credibility and context
- review count should matter, but should not overpower the rating itself

### Reddit and HRN Source Summaries

- `Reddit summary` is being designed separately by another contributor
- `HRN summary` is being designed separately by another contributor

For now, the architecture assumes these source summaries will exist, but their internal scoring formulas are not defined in this document.
