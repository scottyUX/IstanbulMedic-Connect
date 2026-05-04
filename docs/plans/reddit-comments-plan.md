# Reddit Comments Scraping Plan — IstanbulMedic-Connect

## Design Decisions

**1. Add `parent_thread_id` to `reddit_thread_content`? YES.**
Without it, comments are orphaned rows with no way to query "all comments for post X", inherit `clinic_id` from the parent post, or make comments queryable by the profile aggregator. The migration is a nullable `uuid` FK — fully backwards compatible, existing post rows stay NULL.

**2. Comment score threshold: 25 (up from 10).**
For a Turkish hair transplant niche (~5% clinic mention rate), low-score posts are mostly noise. 25 captures meaningful community engagement while reducing API calls significantly. Expose as `REDDIT_COMMENT_SCORE_THRESHOLD=25` and `--comment-score-threshold`.

**3. Comment attribution: conditional inheritance using `substringMatch`.**
Blindly inheriting the parent's `clinic_id` is wrong — a comment may mention a *different* clinic than the parent thread (e.g. "I considered that clinic but went with AEK instead"). Run `substringMatch` (free, no LLM) on the comment body first and only inherit based on the result:

| `substringMatch` result | Action |
|---|---|
| 0 matches | Inherit parent `clinic_id` — comment doesn't name any clinic |
| 1 match, same as parent | Inherit parent `clinic_id` — clearly about the same clinic |
| 1 match, different from parent | Do NOT inherit — let LLM attribution handle it |
| 2+ matches | Do NOT inherit — ambiguous, let LLM handle it |

Comments that don't inherit fall back to the normal `forum-attribute-threads.ts` LLM run. This keeps LLM cost low for the majority while correctly routing cross-clinic comments.

**4. Comment limit per post: 100 (up from hardcoded 50).**
Expose as `REDDIT_COMMENTS_PER_POST=100` and `--comments-per-post`. High-signal posts (score > 500) often have 200+ comments — top 100 captures community consensus.

**5. Add `--include-comments` CLI flag.** Comments are opt-in; default remains false.

---

## Recommended Run Sequence

Run comments *after* attribution so parent `clinic_id` is already set and inheritance works immediately:

```bash
npx tsx scripts/reddit-scrape-subreddits.ts --sorts new,top:all,controversial:all
npx tsx scripts/forum-attribute-threads.ts --source reddit
npx tsx scripts/reddit-scrape-subreddits.ts --include-comments --sorts top:all
npx tsx scripts/forum-recompute-profiles.ts --source reddit
```

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
includeComments:       (process.env.REDDIT_INCLUDE_COMMENTS ?? 'false') === 'true',
commentScoreThreshold: parseInt(process.env.REDDIT_COMMENT_SCORE_THRESHOLD ?? '25'),
commentsPerPost:       parseInt(process.env.REDDIT_COMMENTS_PER_POST ?? '100'),
```

Add to `.env.local`:
```
REDDIT_INCLUDE_COMMENTS=false
REDDIT_COMMENT_SCORE_THRESHOLD=25
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
```

**C — Replace comment-fetching block** with inheritance + `parent_thread_id` logic:

```typescript
if (includeComments && post.score >= commentScoreThreshold) {
  const comments = await fetchPostComments(subreddit, post.id, commentsPerPost)
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

    // Read parent's clinic_id for potential inheritance
    let parentClinicId: string | null = null
    if (threadId) {
      const { data: parentHub } = await supabase
        .from('forum_thread_index')
        .select('clinic_id')
        .eq('id', threadId)
        .single()
      parentClinicId = parentHub?.clinic_id ?? null
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
  const eligibleForComments = posts.filter(p => p.score >= commentScoreThreshold).length
  console.info(`[redditPipeline] [DRY RUN] r/${subreddit}: ${posts.length} unique posts across ${sortSlices.length} sort(s)`)
  if (includeComments) {
    console.info(`  Would fetch comments for ${eligibleForComments}/${posts.length} posts (score >= ${commentScoreThreshold})`)
    console.info(`  Estimated max comment API calls: ${eligibleForComments} (up to ${commentsPerPost} each)`)
  }
  for (const p of posts.slice(0, 3)) console.info(`  - ${p.title.slice(0, 80)} [score: ${p.score}]`)
  continue
}
```

---

### `scripts/reddit-scrape-subreddits.ts`

Add flags after existing arg parsing:

```typescript
const includeComments = args.includes('--include-comments')
const commentThresholdArg = getArg('--comment-score-threshold')
const commentsPerPostArg = getArg('--comments-per-post')
```

Pass to `runRedditPipeline`:
```typescript
includeComments,
commentScoreThreshold: commentThresholdArg ? parseInt(commentThresholdArg) : undefined,
commentsPerPost: commentsPerPostArg ? parseInt(commentsPerPostArg) : undefined,
```

Update usage comment:
```
 * Comments:
 *   npx tsx scripts/reddit-scrape-subreddits.ts --include-comments
 *   npx tsx scripts/reddit-scrape-subreddits.ts --include-comments --comment-score-threshold 50
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
- `commentScoreThreshold` default changes 10 → 25, but only applies when `includeComments` is enabled
- Attribution script unchanged — comment rows in `forum_thread_index WHERE clinic_id IS NULL` are processed identically to post rows

---

## Verification Steps

1. Apply migration: `supabase db push` — confirm `parent_thread_id` column exists on `reddit_thread_content`
2. Dry run: `npx tsx scripts/reddit-scrape-subreddits.ts --include-comments --dry-run` — should print estimated comment call count
3. Live test: `--subreddits HairTransplants --include-comments --comment-score-threshold 100 --comments-per-post 50`
4. Confirm storage: `SELECT count(*) FROM reddit_thread_content WHERE post_type='comment'` → non-zero; `WHERE post_type='comment' AND parent_thread_id IS NOT NULL` → same count
5. Confirm inheritance: attributed parent posts should have comment rows with matching `clinic_id`
6. Confirm idempotency: re-run scrape, row count should not increase
