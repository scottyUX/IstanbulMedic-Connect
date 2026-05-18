# PR Review: reddit-integration

Branch: `feature/reddit-integration`
Reviewed: 2026-04-23

---

## Status

| Priority | Count | Status |
|----------|-------|--------|
| Blocker | 1 | Must fix before merge |
| High | 4 | Fix before merge |
| Medium | 4 | Strongly recommended |
| Low | 4 | Post-merge cleanup |

`database.types.ts` was empty at time of review — regenerated via `npm run db:types`, now resolved.

---

## Blocker

### Missing tests

The PR description claims 105 unit tests across `tests/api/forumPipeline/` and `tests/api/redditPipeline/`. Neither directory exists in the branch. These need to be located or rewritten before merging.

---

## High — fix before merging

### 1. Race condition in `upsertThread()`

**File:** [app/api/redditPipeline/redditPipeline.ts:55-86](../app/api/redditPipeline/redditPipeline.ts)

The upsert uses `ignoreDuplicates: true`, which returns no data on a conflict. When that happens the code does a second query to fetch the existing row's ID. If two scrape processes run concurrently, the row could be deleted between those two operations, leaving `threadId = null` and silently dropping the post.

**Fix:** Use a single atomic upsert that always returns the ID regardless of whether the row was inserted or already existed.

---

### 2. Silent failures in `profileAggregator.ts`

**File:** [app/api/forumPipeline/profileAggregator.ts:106-126, 260-285](../app/api/forumPipeline/profileAggregator.ts)

Nearly every Supabase query omits `error` from the destructure — only `data` is captured. If the DB is unavailable or a query fails, `data` is `undefined`, the code continues with empty arrays, and a blank or incorrect profile gets written with no indication anything went wrong.

**Fix:** Every query needs `const { data, error } = await ...` with an explicit error throw or log.

---

### 3. LLM response cast without runtime validation

**File:** [app/api/forumPipeline/llmAttributor.ts:178](../app/api/forumPipeline/llmAttributor.ts)

```ts
return JSON.parse(text.trim()) as LlmOutput
```

This is a bare TypeScript cast with no runtime validation. If the model returns a different shape — missing fields, wrong types, a field that's null when the code expects an array — the type system won't catch it and downstream code will either crash or silently write corrupt data.

**Fix:** Validate against a Zod schema before casting.

---

### 4. Silent failures in `loadClinicNames()`

**File:** [app/api/forumPipeline/llmAttributor.ts:290-332](../app/api/forumPipeline/llmAttributor.ts)

Three Supabase queries (clinics, clinic_facts, clinic_team) have no error handling. If any fail, the function returns a partial or empty list silently. Attribution then runs against incomplete clinic data and threads that should match won't — with no error surfaced to explain why.

**Fix:** Destructure and throw errors from all three queries.

---

## Medium — strongly recommended

### 5. No LLM cost controls

**Files:** [app/api/forumPipeline/llmAttributor.ts:168-183](../app/api/forumPipeline/llmAttributor.ts), [app/api/forumPipeline/profileAggregator.ts:49-67](../app/api/forumPipeline/profileAggregator.ts)

`attributeThread()` makes one LLM call per thread with only a 200ms delay between them. `generateSummary()` makes one call per clinic profile. There's no concurrent request limit, no token budget, and no circuit breaker. At low volumes this is fine, but a bug causing a tight loop or a large backlog of unattributed threads could generate significant unexpected OpenAI spend.

**Fix:** At minimum, add `max_tokens` to the attribution call (already present on the summary call at 200 tokens) and document the expected cost per full pipeline run.

---

### 6. Attribution prompt doesn't distinguish primary vs. passing mention

**File:** [app/api/forumPipeline/llmAttributor.ts:158](../app/api/forumPipeline/llmAttributor.ts)

The prompt instructs the LLM to return `attributed_clinic_name: "<exact name from list, or null>"` without specifying that the post should be *primarily about* that clinic. A post that only mentions a clinic in passing (e.g. "I considered Clinic A but went elsewhere") could get attributed to it, polluting that clinic's sentiment profile.

The LLM is always called even when the fast substring match fires, so this is a one-line fix.

**Fix:** Change the prompt field description to:
```
"attributed_clinic_name": "<exact name from list if the post is PRIMARILY about that clinic, or null if the clinic is only mentioned in passing>"
```

No logic changes needed.

---

### 7. Scripts log errors but exit with code 0

**File:** [scripts/forum-attribute-threads.ts:191-200](../scripts/forum-attribute-threads.ts)

When `attributeThread()` returns an error the script logs it, increments `failed`, and continues the loop — exiting with code 0 regardless. A critical failure like "no clinic names loaded" or "DB unavailable" is indistinguishable from a successful run with some unmatched threads.

**Fix:** Exit with a non-zero code when `failed > 0`, so CI or a cron job can detect failures.

---

### 8. No RLS policies on new tables

**File:** [supabase/migrations/20260409000000_create_forum_scraping_tables.sql](../supabase/migrations/20260409000000_create_forum_scraping_tables.sql)

All six new tables (`forum_thread_index`, `reddit_thread_content`, `hrn_thread_content`, `forum_thread_signals`, `forum_thread_llm_analysis`, `clinic_forum_profiles`) have no row-level security policies. Acceptable if these tables are strictly backend-only and never queried with the anon key, but this should be explicitly documented. If the anon key is ever used to query these tables from the client, all data would be exposed.

**Fix:** Either add RLS policies, or add a comment in the migration explaining why they're intentionally omitted and confirming these tables are service-role-only.

---

## Low — post-merge cleanup

### 9. `openai` is not an explicit dependency

The code imports from `openai` directly but the package isn't listed in `package.json` — it arrives transitively via `@langchain/openai`. This works until a package manager update changes the transitive tree.

**Fix:** Add `"openai"` explicitly to `dependencies` in `package.json`.

---

### 10. Hardcoded request timeout

**File:** [app/api/redditPipeline/redditService.ts:33](../app/api/redditPipeline/redditService.ts)

`AbortSignal.timeout(15_000)` is hardcoded. In a slow network or staging environment this is often the first thing that causes mysterious failures.

**Fix:** Extract to a named constant or `REDDIT_REQUEST_TIMEOUT_MS` env var.

---

### 11. No upfront env var validation

Multiple files use `process.env.VAR!` non-null assertions. If a required env var is missing the error will be a cryptic null reference deep in the call stack.

**Fix:** Add a guard at the top of each script entry point that checks required env vars and throws a clear message if any are missing.

---

### 12. Console logging throughout pipeline

`console.info`, `console.warn`, `console.error` are used throughout the pipeline files. Fine for scripts, but in a production API context structured logging (Pino, Winston, etc.) makes it easier to filter, alert on, and correlate errors.

**Fix:** Post-merge, replace with a shared logger instance.
