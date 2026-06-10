# Metric Normalisation Reference

Internal reference for how each scoring metric is calibrated. Keep in sync with `lib/scoring/metrics/`.

---

## Google

### Star rating
**Formula:** `max((rating − 3.5) / 1.5, 0) × 100` — anchored at 3.5–5.0

| Input | Score |
|---|---|
| 4.2★ | 47 |
| 4.5★ | 67 |
| 4.9★ | 93 |
| 5.0★ | 100 |

Anchored so the range clinics actually occupy (4.2–5.0) maps across the full 0–100 spread. Old formula `(rating / 5) × 100` compressed everyone into 84–100.

### Review count
**Formula:** `log₁₀(count + 1) / log₁₀(1001) × 100` — saturates at ~1,000

| Input | Score |
|---|---|
| 50 | 57 |
| 300 | 77 |
| 1,000 | 100 |
| 8,000+ | 100 |

---

## Reddit

### Sentiment (caution-adjusted)
**Formula:** `((sentiment + 1) / 2) × 100`, then `× max(1 − caution_factor, 0)`

Maps −1…1 onto 0–100, then the caution factor reduces it.

| Input | Score |
|---|---|
| −1.0 (very negative) | 0 |
| 0.0 (neutral) | 50 |
| 0.5, no caution | 75 |
| 0.5, high caution | ~45 |

Falls back to 50 if confidence < 0.3 or no mention data.

### Caution factor (folds into sentiment, not a separate term)
**Formula:** `caution = max(repair_ratio − 0.2, 0) × 2` → `adjusted = sentiment × max(1 − caution, 0)`

| Repair ratio | Effect |
|---|---|
| 0–20% | No reduction (grace threshold) |
| 40% | ~40% reduction |
| 70%+ | Sentiment zeroed out |

### Thread count (volume)
**Formula:** `log₁₀(threads + 1) / log₁₀(51) × 100` — saturates at ~50

Recalibrated from 500→50 since real DB max is 32.

| Input | Score |
|---|---|
| 7 (median) | 53 |
| 20 (p90) | 77 |
| 32 (max) | 89 |

### Unique voices
**Formula:** `log₁₀(authors + 1) / log₁₀(501) × 100` — saturates at ~500

| Input | Score |
|---|---|
| 10 | ~39 |
| 72 (median) | ~69 |
| 183 (p75) | ~84 |
| 300 | ~92 |

### Long-term evidence
**Formula:** `log₁₀(threads + 1) / log₁₀(51) × 100` — saturates at ~50

| Input | Score |
|---|---|
| 1 | 18 |
| 5 (median) | 46 |
| 16 (p75) | 70 |
| 41 (max) | 96 |

---

## Verification

### Registry listed
**Formula:** Binary — 100 if listed, 40 if no data

Floor of 40 means absence of registry data doesn't destroy the score — not all clinics are captured yet.

### Active licence
**Formula:** Binary — 100 if active + non-expired, 40 if no data

### Credentials & accreditations
**Formula:** 10 base + 20 if authoritative source + 10 if verified within 2 years. Diminishing returns applied via `min((rawScore / (count + 5)) × 25, 100)`.

| Input | Score |
|---|---|
| 0 qualifications | 0 |
| 1 ISHRS (authoritative + recent) | ~45 |
| 3 strong quals | ~70 |
| 5+ strong quals | ~90 |

**Authoritative sources:** ISHRS, ABHRS, EBOPRAS, TPRECD (Turkish board-certified plastic surgeons), IAHRS (International Alliance of Hair Restoration Surgeons), Turkish Medical Association, Ministry of Health.

---

## Source Breadth

**Formula:** `source_count × 25`, capped at 100

Sources counted: Google, Reddit, Instagram, Registry, Credentials.

| Sources | Score |
|---|---|
| 1 | 25 |
| 2 | 50 |
| 3 | 75 |
| 4+ | 100 |

---

## Instagram (flat boost, not a weighted input)

**Formula:** Followers (log scale, 0–3 pts) + verified account (+1) + 50+ posts (+1). Capped at 5.

Added as a flat bonus on top of the weighted Reputation score. Cannot rescue a weak clinic.

| Input | Boost |
|---|---|
| No account | +0 |
| 10k followers, active | +2 |
| 100k followers, verified | +4 |
| 500k+, verified, active | +5 |

---

## Missing data floors

| Metric | Floor | Where applied |
|---|---|---|
| Reddit sentiment (no Reddit record in DB) | 60 | Reputation pillar — `REDDIT_SENTIMENT_FLOOR` |
| Reddit sentiment (record exists, confidence < 0.3) | 50 | `computeRedditMetrics` — metric level |
| Reddit volume/voices/longterm (no Reddit) | 50 | Evidence pillar — `REDDIT_VOLUME_FLOOR` |
| Registry listed (no data) | 40 | Evidence pillar |
| Active licence (no data) | 40 | Evidence pillar |
| Credentials (none) | 40 | Evidence pillar |
