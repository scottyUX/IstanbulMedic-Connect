# Reddit Comments Scraping Plan — IstanbulMedic-Connect

## Design Decisions

**1. Add `parent_thread_id` to `reddit_thread_content`? YES.**
Without it, comments are orphaned rows with no way to query "all comments for post X", inherit `clinic_id` from the parent post, or make comments queryable by the profile aggregator. The migration is a nullable `uuid` FK — fully backwards compatible, existing post rows stay NULL.

**2. Parent post upvote threshold for comment fetching: 25 (up from 10).**
This threshold is on the **Reddit upvote score of the parent post** (not the 0–10 forum score). For a Turkish hair transplant niche (~5% clinic mention rate), low-upvote posts are mostly noise. 25 captures meaningful community engagement while reducing API calls significantly. Expose as `REDDIT_COMMENT_POST_THRESHOLD=25` and `--comment-post-threshold`.

> **Naming note:** The env var was previously drafted as `REDDIT_COMMENT_SCORE_THRESHOLD`. Rename to `REDDIT_COMMENT_POST_THRESHOLD` to avoid confusion with `clinic_forum_profiles.score` (the 0–10 composite). The CLI flag `--comment-score-threshold` → `--comment-post-threshold`.

> **Fetching comments for every post:** Pass `--comment-post-threshold 0` to scrape comments regardless of upvotes (every post has score ≥ 0). No code changes needed. Use only for one-off backfills — at threshold 0, a subreddit with 500 posts × 100 comments = up to 50,000 comment API calls per run, which is too heavy for regular weekly pipeline runs.

**3. Comment attribution: conditional inheritance using `substringMatch`.**
Blindly inheriting the parent's `clinic_id` is wrong — a comment may mention a *different* clinic than the parent thread (e.g. "I considered that clinic but went with AEK instead"). Run `substringMatch` (free, no LLM) on the comment body first and only inherit based on the result:

| `substringMatch` result | Action |
|---|---|
| 0 matches | Inherit parent `clinic_id` — comment doesn't name any clinic |
| 1 match, same as parent | Inherit parent `clinic_id` — clearly about the same clinic |
| 1 match, different from parent | Do NOT inherit — let LLM attribution handle it |
| 2+ matches | Do NOT inherit — ambiguous, let LLM handle it |

Comments that don't inherit fall back to the normal `forum-attribute-threads.ts` LLM run. This keeps LLM cost low for the majority while correctly routing cross-clinic comments.

> **LLM attribution ROI note:** Only inherited comments affect the score. Comments that fail substring match inheritance fall through to LLM attribution — if the LLM attributes them to a clinic, they still won't enter the scorer (only `clinic_attribution_method = 'inherited'` comments do). So LLM-attributing cross-clinic comments only improves `mention_count`, not scores. The current approach (fall through to LLM) is still correct for `mention_count` accuracy, but if LLM cost is a concern these rows can be skipped in `forum-attribute-threads.ts` by filtering `post_type != 'comment'` without any score impact.

**4. Comment limit per post: 100 (up from hardcoded 50).**
Expose as `REDDIT_COMMENTS_PER_POST=100` and `--comments-per-post`. High-signal posts (upvote score > 500) often have 200+ comments — top 100 captures community consensus.

**5. Add `--include-comments` CLI flag.** Comments are opt-in; default remains false.

---

## Scoring Impact

**Inherited comments are included in `computeForumScore` at half weight (0.5).** With only 1–30 post-type threads per clinic, the Bayesian prior dominates most scores. Inherited comments have already passed substringMatch (they don't name a different clinic) and carry genuine sentiment signal that meaningfully improves low-N scores.

Rules:
- `post_type = 'post'` → full weight (1.0), included in all formula steps
- `post_type = 'comment'` AND `clinic_attribution_method = 'inherited'` → half weight (0.5), included in sentiment and severity steps only
- `post_type = 'comment'` with any other attribution → **excluded** (LLM-attributed or unattributed comments are noisier)

What comments affect:
- **Sentiment mean** — inherited comments contribute at 0.5× their `effectiveWeight`
- **Bayesian shrinkage** — `effectiveN` grows (0.5 per inherited comment), pulling the score away from the prior faster
- **Severity penalty** — inherited comments with issue keywords contribute at half penalty (HIGH → −0.15, MED → −0.05)

What comments do NOT affect:
- **Repair rate** — post-only; it's a rate calculation over firsthand posts
- **Follow-up bonus** — post-only; comments don't carry reliable long-term update signals

Comments also increase `mention_count` as before.

---

## Recommended Run Sequence

Run comments *after* attribution so parent `clinic_id` is already set and inheritance works immediately:

```bash
npx tsx scripts/reddit-scrape-subreddits.ts --sorts new,hot,top:all,controversial:all
npx tsx scripts/forum-attribute-threads.ts --source reddit
npx tsx scripts/reddit-scrape-subreddits.ts --include-comments --sorts top:all,hot,controversial:month
npx tsx scripts/forum-attribute-threads.ts --source reddit --include-inherited-comments
npx tsx scripts/forum-recompute-profiles.ts --source reddit
```

Step 4 (`--include-inherited-comments`) runs LLM sentiment analysis on inherited comment rows that have no existing `forum_thread_llm_analysis` entry. Without this, inherited comments enter the scorer with `null` sentiment and contribute only via `effectiveN` and severity keywords — not actual positive/negative signal.

The comments pass uses three sorts to cover different classes of posts:
- `top:all` — all-time popular posts that accumulate comments long-term
- `hot` — currently trending posts (catches older posts receiving a sudden comment spike)
- `controversial:month` — recently active threads that may not rank in `top:all` but are getting engagement now

Posts are deduplicated by `reddit_post_id` on upsert, so re-encountering the same post across sorts is harmless. Only genuinely new comments are inserted.

The final `forum-recompute-profiles.ts` step will update both `mention_count` and `score` — inherited comments enter the scorer at 0.5 weight, so low-N clinics should see score movement.

---

## Schema Change

### `supabase/migrations/20260424000000_add_comment_parent_thread.sql` (NEW)

```sql
-- Add parent_thread_id to reddit_thread_content
-- Links comment rows back to the parent post's forum_thread_index row.
-- Nullable: existing post rows have no parent; only comment rows will be populated.

ALTER TABLE public.reddit_thread_content
  ADD COLUMN parent_thread_id uuid REFERENCES forum_thread_index(id) ON DELETE SET NULL;

CREATE INDEX idx_reddit_content_parent_thread
  ON reddit_thread_content(parent_thread_id)
  WHERE parent_thread_id IS NOT NULL;

COMMENT ON COLUMN reddit_thread_content.parent_thread_id IS
  'For post_type=comment rows: FK to the forum_thread_index row of the parent post. NULL for top-level posts.';
```

---

## Code Changes

### `app/api/redditPipeline/redditConfig.ts`

Add to `REDDIT_CONFIG`:

```typescript
includeComments:        (process.env.REDDIT_INCLUDE_COMMENTS ?? 'false') === 'true',
commentPostThreshold:   parseInt(process.env.REDDIT_COMMENT_POST_THRESHOLD ?? '25'),
commentsPerPost:        parseInt(process.env.REDDIT_COMMENTS_PER_POST ?? '100'),
```

Add to `.env.local`:
```
REDDIT_INCLUDE_COMMENTS=false
REDDIT_COMMENT_POST_THRESHOLD=25
REDDIT_COMMENTS_PER_POST=100
```

---

### `app/api/redditPipeline/redditPipeline.ts`

**A — Add `commentsPerPost` to `PipelineOptions`:**
```typescript
commentsPerPost?: number
```

**B — Read in `runRedditPipeline`:**
```typescript
const commentsPerPost = options.commentsPerPost ?? REDDIT_CONFIG.commentsPerPost
const commentPostThreshold = options.commentPostThreshold ?? REDDIT_CONFIG.commentPostThreshold
```

**C — Replace comment-fetching block** with inheritance + `parent_thread_id` logic:

```typescript
if (includeComments && post.score >= commentPostThreshold) {
  const comments = await fetchPostComments(subreddit, post.id, commentsPerPost)

  // Read parent's clinic_id once for the whole batch — not per comment
  let parentClinicId: string | null = null
  if (threadId) {
    const { data: parentHub } = await supabase
      .from('forum_thread_index')
      .select('clinic_id')
      .eq('id', threadId)
      .single()
    parentClinicId = parentHub?.clinic_id ?? null
  }

  for (const comment of comments) {
    const commentPost: RawRedditPost = {
      id: comment.id,
      subreddit: comment.subreddit,
      title: '',
      selftext: comment.body,
      author: comment.author,
      score: comment.score,
      num_comments: 0,
      created_utc: comment.created_utc,
      permalink: comment.permalink.replace('https://www.reddit.com', ''),
      url: comment.permalink,
    }

    const { threadId: cThreadId, isNew: cIsNew } = await upsertThread(
      supabase, commentPost, sourceId, 'comment'
    )
    if (!cThreadId) continue

    // Back-fill parent_thread_id — idempotent via IS NULL guard
    if (threadId) {
      await supabase
        .from('reddit_thread_content')
        .update({ parent_thread_id: threadId })
        .eq('thread_id', cThreadId)
        .is('parent_thread_id', null)
    }

    // Conditionally inherit clinic_id from parent using substringMatch to detect
    // cross-clinic comments (e.g. "I went with AEK instead") before inheriting.
    // - 0 matches or 1 match same as parent → safe to inherit
    // - 1 match different from parent or 2+ matches → skip, let LLM attribute
    if (parentClinicId) {
      const hits = substringMatch(comment.body, clinicNames)  // clinicNames loaded once per run
      const safeToInherit = hits.length === 0 || (hits.length === 1 && hits[0] === parentClinicId)
      if (safeToInherit) {
        await supabase
          .from('forum_thread_index')
          .update({ clinic_id: parentClinicId, clinic_attribution_method: 'inherited', last_scraped_at: new Date().toISOString() })
          .eq('id', cThreadId)
          .is('clinic_id', null)
      }
      // else: leave clinic_id = NULL — forum-attribute-threads.ts will handle via LLM
    }

    if (cIsNew) {
      result.newThreadsInserted++
      const { inserted } = await extractAndStoreSignals(cThreadId, comment.body)
      result.signalRowsInserted += inserted
    }
  }
}
```

**D — Update dry-run log to show comment estimate:**
```typescript
if (dryRun) {
  const eligibleForComments = posts.filter(p => p.score >= commentPostThreshold).length
  console.info(`[redditPipeline] [DRY RUN] r/${subreddit}: ${posts.length} unique posts across ${sortSlices.length} sort(s)`)
  if (includeComments) {
    console.info(`  Would fetch comments for ${eligibleForComments}/${posts.length} posts (upvote score >= ${commentPostThreshold})`)
    console.info(`  Estimated max comment API calls: ${eligibleForComments} (up to ${commentsPerPost} each)`)
    console.info(`  Note: inherited comment rows affect mention_count and score (at 0.5 weight)`)
  }
  for (const p of posts.slice(0, 3)) console.info(`  - ${p.title.slice(0, 80)} [upvotes: ${p.score}]`)
  continue
}
```

---

### `scripts/reddit-scrape-subreddits.ts`

Add flags after existing arg parsing:

```typescript
const includeComments = args.includes('--include-comments')
const commentThresholdArg = getArg('--comment-post-threshold')
const commentsPerPostArg = getArg('--comments-per-post')
```

Pass to `runRedditPipeline`:
```typescript
includeComments,
commentPostThreshold: commentThresholdArg ? parseInt(commentThresholdArg) : undefined,
commentsPerPost: commentsPerPostArg ? parseInt(commentsPerPostArg) : undefined,
```

Update usage comment:
```
 * Comments (inherited comments affect score at 0.5 weight; run forum-attribute-threads --include-inherited-comments after):
 *   npx tsx scripts/reddit-scrape-subreddits.ts --include-comments
 *   npx tsx scripts/reddit-scrape-subreddits.ts --include-comments --comment-post-threshold 50
 *   npx tsx scripts/reddit-scrape-subreddits.ts --include-comments --comments-per-post 75
```

---

### Optional: Log silent truncation in `redditService.ts`

In `fetchPostComments`, add after the filter:
```typescript
const moreCount = children.filter(c => (c.data as Record<string, unknown>)?.kind === 'more').length
if (moreCount > 0) {
  console.debug(`[reddit] Post ${postId}: ${moreCount} truncated thread(s) skipped (kind=more)`)
}
```

---

## Backwards Compatibility

- `parent_thread_id` is nullable — all existing rows stay valid with NULL
- `includeComments` defaults to `false` — no change to existing runs
- `commentPostThreshold` default 25 only applies when `includeComments` is enabled
- Inherited comments need a separate LLM sentiment pass (`--include-inherited-comments` flag on `forum-attribute-threads.ts`) — without it they enter the scorer at neutral (0) sentiment, helping only via `effectiveN` and severity keywords

---

## GitHub Actions Workflow Update (`.github/workflows/reddit-pipeline.yml`)

### Current state

The existing workflow only scrapes `new` posts from the last 7 days and has no comment step:

```yaml
- name: Scrape subreddits (new posts, last 7 days)
  run: npx tsx scripts/reddit-scrape-subreddits.ts --sorts new --max-posts 1000 --lookback-days 7

- name: Run LLM attribution on new threads
  ...

- name: Recompute stale clinic forum profiles
  ...
```

### Required changes

**1 — Add `hot` to the post scrape step.**
`hot` catches currently trending posts (including older posts resurging) without blowing up the lookback window. `--lookback-days 7` still applies and is correct for weekly runs.

```yaml
- name: Scrape subreddits (new + hot posts)
  run: |
    npx tsx scripts/reddit-scrape-subreddits.ts \
      --sorts new,hot \
      --max-posts 1000 \
      --lookback-days 7
```

**2 — Add comment scraping step after attribution.**
Uses `top:all,hot,controversial:month` with no `--lookback-days` filter — we want to re-check all popular posts for new comments, not just this week's.

```yaml
- name: Scrape comments from active posts
  run: |
    npx tsx scripts/reddit-scrape-subreddits.ts \
      --include-comments \
      --sorts top:all,hot,controversial:month \
      --comment-post-threshold 25 \
      --comments-per-post 100
```

**3 — Increase timeout.**
Comment fetching adds significant runtime. Bump from 120 → 180 minutes.

```yaml
timeout-minutes: 180
```

### Updated full workflow

```yaml
name: Weekly Reddit Pipeline

on:
  schedule:
    - cron: '0 3 * * 1'  # Every Monday at 03:00 UTC
  workflow_dispatch:

jobs:
  reddit-pipeline:
    name: Scrape → Attribute → Comments → Sentiment → Recompute
    runs-on: ubuntu-latest
    timeout-minutes: 180
    env:
      NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
      SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
      OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      # ── Step 1: Scrape posts ────────────────────────────────────────────
      - name: Scrape subreddits (new + hot posts)
        run: |
          npx tsx scripts/reddit-scrape-subreddits.ts \
            --sorts new,hot \
            --max-posts 1000 \
            --lookback-days 7

      # ── Step 2: Attribute ───────────────────────────────────────────────
      - name: Run LLM attribution on new threads
        run: |
          npx tsx scripts/forum-attribute-threads.ts \
            --source reddit \
            --limit 2000

      # ── Step 3: Scrape comments ─────────────────────────────────────────
      - name: Scrape comments from active posts
        run: |
          npx tsx scripts/reddit-scrape-subreddits.ts \
            --include-comments \
            --sorts top:all,hot,controversial:month \
            --comment-post-threshold 25 \
            --comments-per-post 100

      # ── Step 4: Sentiment analysis for inherited comments ───────────────
      - name: LLM sentiment analysis on inherited comments
        run: |
          npx tsx scripts/forum-attribute-threads.ts \
            --source reddit \
            --include-inherited-comments

      # ── Step 5: Recompute profiles ──────────────────────────────────────
      - name: Recompute stale clinic forum profiles
        run: |
          npx tsx scripts/forum-recompute-profiles.ts \
            --source reddit
```

### API key for LLM attribution

LLM attribution uses `gpt-4o-mini` via `OPENAI_API_KEY` — already present in the workflow. No additional secrets needed.

---

## Scoring Code Changes

The scorer in `lib/scoring/forum.ts` and the aggregator in `profileAggregator.ts` need updates to support comment half-weighting. These changes extend the already-implemented scoring logic.

### `lib/scoring/forum.ts`

**A — Add `isComment` to `ForumScorerThread`:**
```ts
export interface ForumScorerThread {
  postDate: string | null
  sentimentScore: number | null
  sentimentLabel: string | null
  isRepairCase: boolean
  issueKeywords: string[]
  hasLongtermUpdate: boolean
  isComment: boolean   // NEW — true for comment rows
}
```

**B — Add `commentWeight` to `ForumScorerOptions`:**
```ts
export interface ForumScorerOptions {
  k?: number
  minEffectiveN?: number
  commentWeight?: number   // NEW — weight for inherited comment rows (default 0.5)
}
```

**C — Apply type weight in Step 1 (sentiment mean):**
```ts
const commentWeight = options?.commentWeight ?? 0.5

// Replace: effectiveWeight = ageDecay
// With:
const typeWeight = thread.isComment ? commentWeight : 1.0
const effectiveWeight = ageDecay * typeWeight

// effectiveN and rawSentiment use effectiveWeight throughout
```

**D — Keep Steps 3 & 4 post-only (no change needed):**
Repair rate and follow-up bonus already filter by `isRepairCase` and `hasLongtermUpdate` across `threads`. Since comment rows are added to the input, add an explicit guard. Guard against division by zero in case a clinic somehow has only comment rows:
```ts
const postThreads = threads.filter(t => !t.isComment)
const totalPostThreads = postThreads.length

repairRate   = totalPostThreads > 0 ? postThreads.filter(t => t.isRepairCase).length / totalPostThreads : 0
followupRate = totalPostThreads > 0 ? postThreads.filter(t => t.hasLongtermUpdate).length / totalPostThreads : 0
```

**E — Apply half penalty for comments in Step 5 (severity):**
```ts
function threadPenalty(t: ForumScorerThread, commentWeight: number): number {
  const base = t.issueKeywords.some(k => HIGH.includes(k)) ? -0.3
             : t.issueKeywords.some(k => MED.includes(k))  ? -0.1
             : 0
  return base * (t.isComment ? commentWeight : 1.0)
}

severityPenalty = Math.min(
  Math.abs(threads.reduce((sum, t) => sum + threadPenalty(t, commentWeight), 0)),
  2.0
)
```

---

### `app/api/forumPipeline/profileAggregator.ts`

**A — Add `clinic_attribution_method` to the threads select:**
```ts
// Before
.select('id, post_date, post_type, ...')

// After
.select('id, post_date, post_type, clinic_attribution_method, ...')
```

**B — Expand scorer input to include inherited comments:**
```ts
const scorerThreads: ForumScorerThread[] = threads
  .filter(t =>
    t.post_type === 'post' ||
    (t.post_type === 'comment' && t.clinic_attribution_method === 'inherited')
  )
  .map(t => {
    const a = analysisMap[t.id]
    const s = signalsMap[t.id]
    return {
      postDate: t.post_date ?? null,
      sentimentScore: a?.sentiment_score != null ? Number(a.sentiment_score) : null,
      sentimentLabel: a?.sentiment_label ?? null,
      isRepairCase: a?.is_repair_case === true,
      issueKeywords: a?.issue_keywords ?? [],
      hasLongtermUpdate: s?.['has_longterm_update'] === true,
      isComment: t.post_type === 'comment',   // NEW
    }
  })
```

No change to the `computeForumScore` call — `commentWeight` defaults to 0.5 automatically.

---

### `scripts/forum-attribute-threads.ts`

**Add `--include-inherited-comments` flag** to run LLM sentiment analysis on inherited comment rows that haven't been analyzed yet. This is sentiment-only — attribution is skipped since `clinic_id` is already set.

```ts
const includeInheritedComments = args.includes('--include-inherited-comments')
```

**Expand the unanalyzed threads query** when the flag is set. Use a `NOT EXISTS` subquery against `forum_thread_llm_analysis` to find inherited comments with no analysis row yet — avoids building an `existingAnalysisIds` set in application code:

```ts
// With --include-inherited-comments, union in inherited comments that have no analysis yet:
const { data: inheritedComments } = includeInheritedComments
  ? await supabase
      .from('forum_thread_index')
      .select('id, post_type, clinic_id, clinic_attribution_method, ...')
      .eq('forum_source', source)
      .eq('post_type', 'comment')
      .eq('clinic_attribution_method', 'inherited')
      .is('forum_thread_llm_analysis.thread_id', null)   // left join — no analysis row exists
      // Supabase equivalent: use .not('forum_thread_llm_analysis', 'is', null) with a join,
      // or run a raw SQL query:
      // WHERE NOT EXISTS (SELECT 1 FROM forum_thread_llm_analysis WHERE thread_id = forum_thread_index.id AND is_current = true)
  : { data: [] }

const allThreadsToProcess = [...unattributedThreads, ...(inheritedComments ?? [])]
```

**Skip attribution step for inherited comments** — `clinic_id` is already set, so only run the LLM analysis and insert the `forum_thread_llm_analysis` row:

```ts
const analysis = await analyzeThread(thread, content, clinicNames)
await insertLlmAnalysis(thread.id, analysis)

if (thread.clinic_attribution_method !== 'inherited') {
  // Normal attribution flow — update clinic_id from LLM result
  await matchAndUpdateClinicId(thread.id, analysis)
}
```

---

### Unit tests to add — `tests/unit/forum-score.test.ts`

**Comment weight — sentiment:**
- Inherited comment (positive) increases `effectiveN` by 0.5 and pulls sentiment toward positive
- Inherited comment (negative) pulls sentiment toward negative at half weight
- Clinic with 2 posts + 6 inherited positive comments → `effectiveN` = 5.0, score meaningfully above prior
- Mix of inherited positive and inherited negative comments → sentiment averages correctly at 0.5 weight each
- Inherited comment with `null` sentiment_score AND `null` sentiment_label → treated as mixed (0), doesn't crash

**Comment weight — severity:**
- Inherited comment with HIGH keyword → −0.15 penalty (not −0.3)
- Inherited comment with MED keyword → −0.05 penalty (not −0.1)
- Inherited comment with both HIGH and MED keywords → −0.15 only (worst tier at half weight, no stacking)

**Comment weight — post-only steps:**
- `postThreads` filter: repair rate ignores comment rows even if `isRepairCase = true`
- `postThreads` filter: follow-up bonus ignores inherited comment with `hasLongtermUpdate = true`

**Aggregator filter (comment exclusion):**
- Comment with `clinic_attribution_method = 'llm'` → excluded from scorer input (not passed in)
- Comment with `clinic_attribution_method = null` → excluded from scorer input
- Comment with `clinic_attribution_method = 'inherited'` → included with `isComment = true`
- Post with any attribution → included with `isComment = false`

**Formula boundary conditions (missing from score plan):**
- `effectiveN` exactly at `minEffectiveN` (3.0) → score returned
- `effectiveN` just below threshold (e.g. 2 old threads → effectiveN = 0.6) → returns `undefined`
- All-negative clinic → `rawScore` clamps to 0
- All-positive clinic (many threads) → `rawScore` clamps to 10
- `repairPenalty` cap: 100% repair rate → penalty capped at 1.5, not higher
- `followupBonus` cap: 100% follow-up rate → bonus capped at 0.8
- `severityPenalty` cap: 10 HIGH-keyword threads → penalty capped at 2.0
- Empty threads array → returns `undefined`

---

## Verification Steps

1. Apply migration: `supabase db push` — confirm `parent_thread_id` column exists on `reddit_thread_content`
2. Dry run: `npx tsx scripts/reddit-scrape-subreddits.ts --include-comments --dry-run` — should print estimated comment call count and the "mention_count only" note
3. Live test: `--subreddits HairTransplants --include-comments --comment-post-threshold 100 --comments-per-post 50`
4. Confirm storage: `SELECT count(*) FROM reddit_thread_content WHERE post_type='comment'` → non-zero; `WHERE post_type='comment' AND parent_thread_id IS NOT NULL` → same count
5. Confirm inheritance: attributed parent posts should have comment rows with matching `clinic_id`
6. Confirm idempotency: re-run scrape, row count should not increase
7. **Confirm score movement:** run `forum-recompute-profiles.ts` after the comments run. Scores for clinics that gained inherited comments should shift — typically upward for low-N clinics as `effectiveN` increases and the Bayesian prior loses dominance. Clinics with no inherited comments should be unchanged. A useful sanity check:
   ```sql
   SELECT clinic_id, score FROM clinic_forum_profiles WHERE forum_source = 'reddit' ORDER BY score DESC;
   ```
   If scores are identical across the board after adding comments, the `isComment` filter or aggregator expansion likely didn't apply — check that `clinic_attribution_method` is being fetched and the scorer input filter is correct.

8. **Attribution breakdown — check non-inherited comment volume:**
   Run this after the first real comment scrape to understand whether LLM-attributed comments are large enough to reconsider including them in scoring:
   ```sql
   SELECT
     clinic_attribution_method,
     COUNT(*)                                                        AS count,
     ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1)            AS pct
   FROM forum_thread_index
   WHERE post_type = 'comment'
     AND forum_source = 'reddit'
   GROUP BY clinic_attribution_method
   ORDER BY count DESC;
   ```
   Expected breakdown:
   - `inherited` — majority; these enter the scorer at 0.5 weight
   - `llm` — comments that named a different clinic and were LLM-attributed; currently excluded from scoring
   - `null` — unattributed (parent had no `clinic_id` at scrape time or LLM couldn't match)

   If `llm`-attributed comments are a significant share (e.g. >30%) and represent genuine patient experiences, revisit including them at a lower weight (e.g. 0.25) in a follow-up plan.
