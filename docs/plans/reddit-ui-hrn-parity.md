# Plan: Reddit UI — HRN Parity (Threads, Repair Cases, Sentiment)

## Context

The Reddit signals card currently shows aggregated stats and a basic collapsible list of "notable threads." The HRN card has a much richer thread-browsing system: a modal with three variants (all threads, photo threads, repair cases), rich per-thread metadata badges, and direct links to every post. This plan brings the Reddit UI to parity with HRN across four areas:

1. **View and link to all posts** — a "View all N threads" button that opens a scrollable modal with every attributed Reddit post linked directly.
2. **Navigate directly to repair case posts** — a "See context →" action on the repair stat row that opens a modal filtered to threads LLM-flagged as `is_repair_case = true`.
3. **Sentiment breakdown (posts + comments)** — replace the current gradient-dot `SentimentBar` with HRN's segmented bar (green / yellow / red proportional segments + legend + counts), computed across both Reddit posts and qualifying comments (those above the 5-upvote threshold, which are the only ones that go through the LLM pipeline).
4. **Layout reorder** — restructure the card to match HRN's section order.

---

## Architecture

The Reddit card currently gets its data from `getForumSignals(clinicId, 'reddit')` which reads the pre-aggregated `clinic_forum_profiles` table. That table's `notable_threads` JSONB column lacks `is_repair_case`, `hasPhotos`, and `hasLongTermFollowup` per-thread flags — so filtering and rich display are impossible today.

The fix: add `lib/api/reddit.ts` that queries the raw tables (same 4-table join pattern as `lib/api/hrn.ts`) to produce `RedditThread[]` arrays. The per-thread data is merged with the existing aggregated data (summary, pros, score, etc.) into a new `RedditSignalsData` type.

---

## Steps

### 1. Create `lib/api/reddit.ts`

Mirror `lib/api/hrn.ts`. Define types and fetch function:

```typescript
export interface RedditThread {
  threadUrl: string
  title: string
  summaryShort: string
  sentimentLabel: "positive" | "mixed" | "negative"
  isRepairCase: boolean
  hasPhotos: boolean
  hasLongTermFollowup: boolean
  subreddit: string
  score: number        // upvotes
  commentCount: number
  postDate: string
}

export interface RedditSignalsData extends ClinicForumProfile {
  allThreads: RedditThread[]          // post-type entries only (browseable list)
  repairThreads: RedditThread[]       // filtered from allThreads
  photoThreadsList: RedditThread[]    // filtered from allThreads
  combinedSentimentDistribution: { positive: number; mixed: number; negative: number }
  postCount: number                   // top-level post entries
  qualifiedCommentCount: number       // comment entries that have LLM analysis
}
```

**Query joins for `allThreads` (post-type):**
- `forum_thread_index` — `id, title, thread_url, post_date` filtered by `forum_source = 'reddit'` and `clinic_id`
- `forum_thread_llm_analysis` — `sentiment_label, summary_short, is_repair_case` (`is_current = true`)
- `reddit_thread_content` — `post_type, subreddit, score, comment_count`
- `forum_thread_signals` — two signal queries in parallel:
  - `signal_name = 'has_12_month_followup'` → `hasLongTermFollowup`
  - `signal_name = 'has_photos'` → `hasPhotos`

**Sentiment distribution across posts AND comments:**
Query all `forum_thread_index` entries for this clinic+reddit (any `post_type`), inner-join `forum_thread_llm_analysis` (`is_current = true`) and `reddit_thread_content`. Because only comments above the 5-upvote threshold are sent through the LLM pipeline, the inner join naturally excludes low-quality comments — no explicit score filter needed. Tally `sentiment_label` across all resulting rows. Track `postCount` (post-type) and `qualifiedCommentCount` (comment-type) separately.

**Aggregated fields:**
Call `getForumSignals(clinicId, 'reddit')` for the AI-generated fields (`summary`, `pros`, `commonConcerns`, `score`, `sentimentScore`, etc.) and spread into the returned `RedditSignalsData`. If `getForumSignals` returns null, fall back to deriving totals from the raw threads.

---

### 2. Update `lib/api/clinics.ts`

- Import `getRedditSignals` from `./reddit`
- Replace the `getForumSignals(clinic.id, 'reddit')` call (~line 732) with `getRedditSignals(clinic.id)` in the `getClinicById` parallel fetch block
- Update the `Clinic` type: `redditSignals: RedditSignalsData | null`

---

### 3. Restructure `RedditSignalsCard.tsx`

**Layout order** — mirror HRN (`HRNSignalsCard.tsx:503–725`):
1. Header: Reddit icon + "Community Discussion" title + thread count badge (right)
2. Score block: dashed-border box with score + confidence tier badge + score breakdown grid
3. Sentiment bar (segmented, see below)
4. Stats list (bordered rows): total threads / photo threads + "View threads →" / long-term follow-ups / repair cases + "See context →"
5. Topic tags (`commonConcerns`)
6. Recent threads preview (first 3 of `allThreads`)
7. "View all N threads →" button
8. Footer

This replaces the current layout: header → expandable signal rows → AI section → notable threads list.

**Sentiment bar** — use HRN's segmented bar pattern (`HRNSignalsCard.tsx:576–624`):
- Header row: "Community Sentiment" + "AI-assisted" chip (left) · "{X}% positive" (right)
- Single segmented bar: green / yellow / red segments sized by positive / mixed / negative percentages
- Legend with color dots and raw counts: `Positive N · Mixed N · Negative N`
- Italic summary sentence (reuse `buildSentimentSummary` pattern from HRN)
- Sub-label: `"{postCount} threads · {qualifiedCommentCount} comments"` in muted text
- Disclaimer: `"Comments with fewer than 5 upvotes were not included"` in `text-xs text-muted-foreground/70 italic`

**`ThreadItem` component** (adapted from `HRNSignalsCard.tsx:303–348`):
- Thread title as clickable external link with ExternalLink icon
- `summaryShort` below
- Badge row: sentiment badge / photos badge (when `hasPhotos`) / repair badge (when `isRepairCase`) / long-term badge (when `hasLongTermFollowup`)
- Subreddit label (e.g. `r/HairTransplants`) + post date on the right

**`ThreadModal` component** (adapted from `HRNSignalsCard.tsx:350–451`):
- Two active variants: `"all"` and `"repair"` (`"photos"` variant exists in code but is not triggered — see Next Steps)
  - `all` — title: `All N threads — {clinicName}`, subtitle: `Source: Reddit`
  - `repair` — amber info notice: same neutral-context disclaimer as HRN ("Some were repairs performed at this clinic; others were repairs needed after treatment elsewhere.")
- Escape key + backdrop click close
- Scrollable thread list, `max-h-[80vh]`

**Props change:** `data: ClinicForumProfile` → `data: RedditSignalsData`

**Post-implementation fixes applied:**
- `repairCount` and `longtermCount` now derived from live `allThreads` data (not the pre-aggregated table) to prevent stat row / modal count mismatches
- `photoCount` uses `data.photoThreadCount` from the aggregate as fallback, but the photo stat row is **hidden** — photo detection is not implemented for Reddit (see Next Steps)
- Score display reverted to original header-right style (large colored number + confidence badge)
- Composition line ("N posts found · N comments analyzed · disclaimer") moved into the threads-found stat row

---

## Critical Files

| File | Change |
|------|--------|
| `lib/api/reddit.ts` | **New** — per-thread fetch + `RedditSignalsData` type |
| `lib/api/clinics.ts` | Replace `getForumSignals` with `getRedditSignals` (~line 732), update Clinic type |
| `components/istanbulmedic-connect/profile/RedditSignalsCard.tsx` | Full restructure: layout reorder, segmented sentiment bar, `ThreadItem`, `ThreadModal` (3 variants) |

**Reference files (read-only):**
- `lib/api/hrn.ts` — query pattern to mirror
- `components/istanbulmedic-connect/profile/HRNSignalsCard.tsx:303–754` — `ThreadItem`, `ThreadModal`, layout sections to adapt

---

## Verification

1. Open a clinic profile page with Reddit data; confirm layout order: score → sentiment → stats list → topics → threads → view all.
2. Confirm segmented sentiment bar renders green/yellow/red proportions with legend and counts.
3. Confirm composition sub-label ("N posts found · N comments analyzed · disclaimer") appears in the threads-found stat row.
4. Confirm "View all N threads" opens the all-threads modal; every thread has a working Reddit link.
5. Confirm "See context →" appears on the repair row when repair threads exist; count matches modal contents.
6. Confirm the photo stat row is not visible.
7. Confirm Escape key and backdrop click close all modals.
8. Test with a clinic that has zero repair cases — repair row shows green "No repair case threads" state.

---

## Next Steps

### Photo Detection for Reddit

Reddit photo detection is not yet implemented. The `has_photos` signal is only written for HRN threads (via `hrnStoragePipeline.ts`). `reddit_thread_content` has no image columns.

To enable the photo stat row and "View threads →" modal for Reddit:

1. **Detect photos in the Reddit importer** (`app/api/import/reddit/route.ts`) — Reddit API responses include `url`, `preview`, and gallery fields; flag a post as having photos if the URL points to `i.redd.it`, `imgur`, or contains a Reddit gallery (`reddit.com/gallery/`)
2. **Write `has_photos` as a direct signal** into `forum_thread_signals` (same pattern as `hrnStoragePipeline.ts:210`: pass `has_photos: true` in the `directSignals` object to `extractAndStoreSignals`)
3. Optionally add `image_urls text[]` to `reddit_thread_content` if storing the actual image URLs is useful downstream
4. **Re-enable the photo stat row** in `RedditSignalsCard.tsx` once signals are being written — the UI code (`photoCount`, `photoThreadsList`, modal variant) is already in place

### Preserve Filters and Sort on Back Navigation

When navigating from a clinic profile back to the clinics list, the active filters and sort order are reset. The state should be preserved so users return to exactly where they left off.

Options:
- **URL search params** (recommended) — encode active filters and sort into the URL (`/clinics?sort=score&country=TR&...`). The browser's back button restores the full URL, so no extra state management is needed and the URL is shareable.
- **Session storage** — save filter state on navigate-away, restore on mount. Simpler to implement but not shareable and breaks on hard refresh.

The URL params approach is preferable: it also enables deep-linking to a filtered view.
