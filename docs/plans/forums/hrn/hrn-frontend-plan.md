# HRN Signals Card — Frontend Implementation Plan

**Last Updated:** 2026-04-16
**Status:** Approved — implementation in progress

---

## Overview

A new card in the clinic profile page that displays forum evidence sourced from Hair Restoration Network (HRN). Modelled structurally after `InstagramSignalsCard.tsx` but with a different layout suited to forum data: stats summary → sentiment → topic tags → recent threads.

All data is mock/demo for the initial build. Real data integration comes after the card is visually finalized.

---

## Placement in Profile Page

Rendered in the full-width section at the bottom of `ClinicProfilePage.tsx`, directly below `InstagramSignalsCard`. Gated behind a `profileHRN` feature flag in `lib/filterConfig.ts` (set to `true` during development, `false` before shipping without real data).

---

## Files to Create / Modify

| Action | File |
|--------|------|
| Create | `components/istanbulmedic-connect/profile/HRNSignalsCard.tsx` |
| Edit | `lib/filterConfig.ts` — add `profileHRN: true` |
| Edit | `components/istanbulmedic-connect/profile/ClinicProfilePage.tsx` — import + render |

---

## Data Shape

```typescript
interface HRNThread {
  threadUrl: string        // full HRN thread URL
  title: string            // thread title
  summaryShort: string     // 1-2 sentence AI summary
  sentimentLabel: "positive" | "mixed" | "negative"
  isRepairCase: boolean
  hasPhotos: boolean
  photoCount: number       // number of images in the thread
  postDate: string         // ISO string
}

export interface HRNSignalsData {
  totalThreads: number
  lastUpdated: string      // ISO string — when data was last scraped

  // Stats
  photoThreads: number             // threads where has_photos = true
  longTermFollowups: number        // threads with has_12_month_followup signal
  repairCases: number              // threads where is_repair_case = true

  // Sentiment — counts, not percentages (we compute % in the component)
  sentiment: {
    positive: number
    mixed: number
    negative: number
  }

  // Topics — aggregated main_topics across all threads, top 5-6
  topTopics: string[]              // e.g. ["healing", "density", "hairline", "donor area"]

  // Threads
  photoThreadsList: HRNThread[]    // all threads with photos (for the photo modal)
  allThreads: HRNThread[]          // all threads sorted by date — used for both the all-threads modal and the 3-thread preview (component slices first 3)
}
```

**Source mapping** (for when we integrate real data later):
- `photoThreads` ← `forum_thread_index.has_photos = true`
- `longTermFollowups` ← `forum_thread_signals` where `signal_name = 'has_12_month_followup'`
- `repairCases` ← `forum_thread_llm_analysis.is_repair_case = true`
- `sentiment` ← aggregate counts of `forum_thread_llm_analysis.sentiment_label`
- `topTopics` ← flatten + count `forum_thread_llm_analysis.main_topics` across threads
- `photoThreadsList` ← threads with `has_photos = true`, joined with `hrn_thread_content.image_urls`
- `allThreads` ← all threads sorted by `forum_thread_index.post_date` descending

---

## Card Layout (Top to Bottom)

### 1. Card Header

- Left: Forum icon (styled badge, amber/warm gradient) + **"Forum Evidence"** title + `"Hair Restoration Network"` subtitle
- Right: Thread count badge — `"23 threads"`

### 2. HRN Score (Placeholder)

A grayed-out badge showing `— / 10` with a small `"Score coming soon"` label beneath it. No functionality yet. Visually prominent so it's clear this is planned.

### 3. Sentiment Bar (AI-assisted)

A horizontal segmented bar split into three colour bands:
- Green = positive, Yellow = mixed, Red = negative
- Proportional to actual counts (e.g. 65% / 26% / 9%)

Below the bar: a text summary line, e.g. **"Mostly positive · Some mixed experiences"**

Labelled with a small `AI-assisted` pill to make clear this is LLM-derived.

### 4. Stats List

Four rows, each with an icon + count + label. No expand/collapse — purely informational.

```
📋  23 threads found
📷  14 with photo evidence          [View photo threads →]
📅   8 with 12+ month follow-ups
⚠️   3 repair case threads          [See context →]
```

**"View photo threads →"** opens the Photo Threads Modal.

**"See context →"** opens the Repair Cases Modal — the click action is important so users can actually find and read those threads directly, rather than having to hunt for them in the full thread list.

### 5. Most Discussed Topics

A row of small pill/badge tags showing the top aggregated `main_topics` across all threads. Values are prettified before display (e.g. `donor_area` → `Donor Area`, `healing` → `Healing`).

```
[Healing]  [Density]  [Hairline]  [Donor Area]  [Communication]
```

No interaction — purely informational. If no topics available, section is hidden.

### 6. Recent Threads

Section header: **"Recent Threads"**

Shows 3 most recent threads as a preview. Each thread item:
- Thread title — bold, linked directly to the HRN thread URL (opens in new tab)
- AI summary — 1–2 sentences, smaller text, muted colour
- Tag row: sentiment badge (`Positive` / `Mixed` / `Negative`) + `📷 Photos` if `hasPhotos = true` + `Repair case` if `isRepairCase = true`
- Post date — muted, right-aligned

Below the 3 threads: **"View all X threads →"** button that opens the All Threads Modal.

### 7. Footer

Small text: `Data last updated: [date]` + `Source: HairRestorationNetwork.com`

---

## Photo Threads Modal

Triggered by "View photo threads →" in the stats list.

**Modal content:**
- Header: `"📷 14 Threads with Photo Evidence"`
- Subtitle: `"Click any thread to view photos on Hair Restoration Network"`
- List of all `photoThreadsList` threads, each showing:
  - Thread title (linked to HRN thread URL, opens in new tab)
  - AI summary (1 line, truncated)
  - `[X photos]` count badge
  - Post date
  - `[→ View on HRN]` button

Images are **not** embedded directly — they live on HRN. The modal is purely a curated list of threads with photos, linking users to the source.

---

## Repair Cases Modal

Triggered by "See context →" next to the repair stat line.

**Modal header:** `"⚠️ 3 Repair Case Threads"`

**Neutral context note at top of modal:**
> *"These threads involve hair transplant repair procedures. Some were repairs performed at this clinic; others were repairs needed after treatment elsewhere. Read each thread directly for full context."*

Each thread item same as photo modal (title linked to HRN, summary, sentiment badge, date).

---

## All Threads Modal

Triggered by "View all X threads →" below the Recent Threads preview in the card.

**Modal content:**
- Header: `"All 23 Threads — [Clinic Name]"`
- Subtitle: `"Source: Hair Restoration Network"`
- Scrollable list of all threads from `allThreads`, sorted most recent first
- Each thread item:
  - Thread title (linked to HRN thread URL, opens in new tab)
  - AI summary (1–2 lines)
  - Tag row: sentiment badge + `📷 Photos` + `Repair case` if applicable
  - Post date

This modal is the primary way to browse the full thread corpus for a clinic without leaving the page.

---

## Demo Data (for mock phase)

Two exports for development:

**`DEMO_HRN_SIGNALS`** — well-reviewed clinic:
- 23 threads, 14 photo, 8 followups, 1 repair case
- Sentiment: 15 positive / 6 mixed / 2 negative
- Topics: healing, density, hairline, donor area
- 3 recent threads (positive, mixed, one repair)

**`DEMO_HRN_SIGNALS_CONCERN`** — mixed-signal clinic:
- 11 threads, 4 photo, 2 followups, 4 repair cases
- Sentiment: 4 positive / 4 mixed / 3 negative
- Topics: healing, density, communication
- 3 recent threads (2 negative, 1 positive)

---

## What We Are NOT Showing (and Why)

| Signal | Reason not shown |
|--------|-----------------|
| `satisfaction_label` | Redundant with `sentiment_label` in UI |
| `reply_count` / `view_count` | Doesn't meaningfully help clinic evaluation |
| Raw `issue_keywords` counts per keyword | Risks misreading ("density" in a positive thread) — covered by topic tags instead |
| Embedded patient photos | Hotlink protection on HRN's CDN — link to threads instead |
| `attributed_doctor_name` per thread | Useful future drill-down, not MVP |
| Forum score formula | Deferred — need real data to calibrate weights |
