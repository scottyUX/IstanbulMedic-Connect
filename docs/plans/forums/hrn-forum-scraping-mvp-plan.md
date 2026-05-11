# HRN Forum Scraping — MVP Plan

## Core Design Philosophy

Two layers, strictly separated:

1. **Deterministic layer** — the source of truth. Every signal here is transparent, citable, and rule-based. No ambiguity.

2. **LLM layer** — assistive interpretation only. Clearly labeled as AI-assisted wherever it surfaces in the UI. Never used where a rule can do the job.

**Rule to live by:** No user-facing signal appears without either direct evidence or a clearly labeled AI interpretation.

---

## Signal Schema

### A. Deterministic Signals

| Field | Notes |
|-------|-------|
| clinic_name | |
| doctor_name | |
| thread_url | |
| thread_title | |
| author | |
| post_date | |
| reply_count | |
| view_count | |
| has_photos | boolean |
| timeline_markers | e.g. "6 months", "1 year" |
| issue_keywords | scarring, shock loss, infection, etc. |
| graft_count_explicit | only if stated directly |
| is_repair_case | boolean |

### B. LLM-Assisted Signals

| Field | Values |
|-------|--------|
| sentiment_label | positive / mixed / negative |
| satisfaction_label | satisfied / mixed / regretful |
| summary_short | 1–2 sentences, neutral language |
| main_topics | healing, density, hairline, donor area, etc. |

### C. Auditability Fields

| Field | Notes |
|-------|-------|
| raw_post_text | always stored |
| evidence_snippets | per-signal text citations |
| extraction_method | regex / keyword / llm |
| extraction_version | for reproducibility |
| model_name | LLM fields only |
| prompt_version | LLM fields only |
| run_timestamp | LLM fields only |

---

## Database Schema

### clinics
Basic clinic metadata.

### forum_threads

| Field | Description |
|-------|-------------|
| clinic_id | |
| source_url | |
| title | |
| author | |
| post_date | |
| reply_count | |
| view_count | |
| raw_text | |
| raw_html | optional, store if unsure what you'll need later |
| scrape_strategy | op_only / op_and_last / paginated |

### thread_signals

| Field | Description |
|-------|-------------|
| thread_id | |
| signal_name | |
| signal_value | |
| evidence_snippet | |
| extraction_method | |
| extraction_version | |

### thread_llm_analysis

| Field | Description |
|-------|-------------|
| thread_id | |
| sentiment_label | |
| satisfaction_label | |
| summary_short | |
| topics | |
| model_name | |
| prompt_version | |
| run_timestamp | |

### clinic_aggregates
Precomputed rollups. Refresh strategy needed — flag stale on any new thread insert.

| Field | Description |
|-------|-------------|
| clinic_id | |
| num_threads | |
| num_photo_threads | |
| num_longterm_updates | threads with 6+ or 12+ month markers |
| num_repair_mentions | |
| sentiment_distribution | |
| common_concerns | |
| last_computed_at | |

---

## Execution Plan

### Phase 0 — Scope

- Pick 5 clinics max
- Manually collect 20–30 thread URLs per clinic to start
- Define success criteria before writing any code

### Phase 1 — Schema

- Lock in the signal schema above before touching the scraper
- Decide what "useful" looks like in the UI early — don't extract signals you won't render

### Phase 2 — Scraper

Build a minimal scraper targeting raw thread content only.

**Scrape per thread:**
- Thread title
- Original post (OP) text
- Last post by the same author (if identifiable) — usually contains the best update signal
- Metadata: reply count, view count, date, author

**Key decision to lock in now — multi-page threads:**

HRN patient diaries can run 30–50+ pages. Pick one strategy and stick with it for MVP:

| Strategy | Pros | Cons |
|----------|------|------|
| OP only | Simple, fast | Misses long-term updates |
| OP + last author post | Good signal/effort ratio | Slightly more complex |
| Full pagination | Most complete | Much slower, noisy |

**Recommendation:** OP + last post by same author. Best signal-to-effort ratio for solo work.

### Phase 3 — Deterministic Extraction

Build a rule-based parser on top of raw thread text.

**Good first targets:**
- Photo presence (image tags, "photos below", etc.)
- Timeline markers (3 month, 6 months, 1 year, 12 month)
- Issue keywords (shock loss, scarring, infection, repair, revision)
- Graft count (regex on numbers near "grafts")
- Doctor / clinic name mentions

Every extracted signal stores an `evidence_snippet` — the exact text it came from.

### Phase 4 — LLM Extraction

Only after Phase 3 is working.

Feed the OP (and last author update if captured) into `gpt-4o-mini`. Constrain the output heavily:

```
Given this forum post, respond only in JSON with these fields:
- sentiment: "positive" | "mixed" | "negative"
- satisfaction: "satisfied" | "mixed" | "regretful"
- top_concerns: array, choose only from [density, hairline, donor_area, healing, communication, value, other]
- summary: 1-2 sentences, neutral language, no editorializing

Post text: {text}
```

Store model name, prompt version, and timestamp with every run.

### Phase 5 — Rough UI (Earlier Than You Think)

Don't wait until the pipeline is perfect. Get real data into a simple UI after Phase 3.

**Target display per clinic:**

```
Forum Evidence — [Clinic Name]
────────────────────────────────
📋 23 threads found
📷  14 with photo evidence
📅  8 with 12+ month follow-ups
⚠️  3 mentioning repair or revision
❓  5 mentioning density concerns

Sentiment (AI-assisted)
Mostly positive · Some mixed experiences

Recent Threads
- [Thread title] — summary — snippets — source link
- ...
```

### Phase 6 — Manual QA

Before expanding scope, manually review 30–50 threads end to end.

**Check:**
- Did the scraper grab the right text?
- Do rule extractions look accurate? Are evidence snippets fair?
- Does LLM sentiment seem reasonable?
- Are summaries neutral and not misleading?
- Are the signals actually useful when rendered?

Refine the pipeline based on what you find. Don't scale before this.

---

## What Not To Do Yet

- Crawl the whole site
- Scrape every reply in every thread
- Auto-discover clinics
- Build a composite scoring formula
- Use LLMs to infer anything that rules can handle
- Over-engineer the UI

---

## MVP Launch Signals (Shortlist)

### Deterministic
- Thread count
- Photo evidence count
- Long-term follow-up count (6m / 12m)
- Issue keyword mention counts
- Repair / revision mention count

### LLM-assisted (clearly labeled)
- Overall sentiment bucket
- Satisfaction bucket
- Per-thread neutral summaries
