# Comment Sentiment Toward Clinic

## Problem

The existing `sentiment_label` on `forum_thread_llm_analysis` captures general post sentiment, not
sentiment directed at the attributed clinic. For inherited comments this is noisy — a comment like
"looks great! I had better results at Vera Clinic" on an ASMED thread inherits ASMED as its clinic
but its positivity is about Vera Clinic.

This plan adds `sentiment_toward_clinic` extracted by a separate comment-specific prompt. First-person
posts are unaffected (their prompt and version are unchanged).

## Scope

- Only `analyzeSentimentOnly()` (inherited comment path) changes.
- `attributeThread()` (regular posts) is untouched — no re-processing cost.
- The 44 inherited comments already analyzed with the old prompt need to be re-run.

---

## Changes

### 1. Migration — add column

`supabase/migrations/<timestamp>_add_comment_sentiment_toward_clinic.sql`

```sql
ALTER TABLE public.forum_thread_llm_analysis
  ADD COLUMN sentiment_toward_clinic text
  CHECK (sentiment_toward_clinic IN ('positive', 'mixed', 'negative', 'not_applicable'));

COMMENT ON COLUMN forum_thread_llm_analysis.sentiment_toward_clinic IS
  'For inherited comment rows only: sentiment directed at the attributed clinic specifically.
   NULL on regular post rows. not_applicable = comment discusses a different clinic.';
```

### 2. `llmAttributor.ts` — new prompt + schema field

**New version constant** (keep `PROMPT_VERSION = ''v1.0''` for posts):
```ts
const COMMENT_PROMPT_VERSION = 'v1.1-comment'
```

**Extend `LlmOutputSchema`**:
```ts
sentiment_toward_clinic: z.enum(['positive', 'mixed', 'negative', 'not_applicable'])
  .nullable()
  .default(null),
```

**New `buildCommentPrompt()`** — same as `buildPrompt()` but adds clinic context and the extra field:
```ts
function buildCommentPrompt(title: string, body: string, clinicNames: string[], clinicDisplayName: string): string {
  const text = truncateText([title, body].filter(Boolean).join('\n\n'))
  const clinicList = clinicNames.slice(0, 50).join(', ')

  return `You are analyzing a Reddit comment about hair transplants.
This comment has been attributed to: ${clinicDisplayName}

Clinic/doctor list (match only to these): ${clinicList}

Comment:
"""
${text}
"""

Respond ONLY with valid JSON matching this exact schema (no markdown, no extra text):
{
  "attributed_clinic_name": "<the clinic this comment is primarily about, exact name from list, or null>",
  "attributed_doctor_name": "<doctor name mentioned, or null>",
  "sentiment": "positive" | "mixed" | "negative",
  "satisfaction": "satisfied" | "mixed" | "regretful",
  "sentiment_toward_clinic": "positive" | "mixed" | "negative" | "not_applicable",
  "main_topics": ["<up to 4 from: density, hairline, donor_area, healing, communication, value, doctor_involvement, technician_quality, aftercare, natural_results, other>"],
  "issue_keywords": ["<specific issues mentioned, e.g. shock_loss, scarring, poor_density>"],
  "is_repair_case": true | false,
  "secondary_clinic_mentions": [{"clinic_name": "<str>", "doctor_name": "<str|null>", "role": "mentioned|compared|repair_source", "evidence": "<quote>"}],
  "evidence_snippets": {"sentiment": "<quote>", "is_repair_case": "<quote if true>"},
  "summary": "<1-2 neutral sentences>"
}

For sentiment_toward_clinic: use "not_applicable" if the comment's sentiment is about a different clinic than ${clinicDisplayName}.`
}
```

**Update `analyzeSentimentOnly()`**:
- Look up `clinicDisplayName` from the `clinics` array using `clinicId`
- Call `buildCommentPrompt()` instead of `buildPrompt()`
- Store `sentiment_toward_clinic: llmOutput.sentiment_toward_clinic` in the insert
- Use `prompt_version: COMMENT_PROMPT_VERSION`

### 3. `profileAggregator.ts` — use the new field

When aggregating comment threads (`clinic_attribution_method = 'inherited'`), use
`sentiment_toward_clinic` as the sentiment signal when it is not `null` and not `'not_applicable'`.
Fall back to `sentiment_label` if `sentiment_toward_clinic` is null (handles pre-migration rows).

Comments with `sentiment_toward_clinic = 'not_applicable'` should be **excluded** from the sentiment
aggregation entirely (the comment is about a different clinic).

### 4. Re-run the 44 already-analyzed comments

The 44 inherited comments were analyzed with the old prompt (`v1.0`). Re-run them by deleting their
current analysis rows and re-running the script:

```sql
DELETE FROM forum_thread_llm_analysis
WHERE thread_id IN (
  SELECT fti.id
  FROM forum_thread_index fti
  WHERE fti.clinic_attribution_method = 'inherited'
)
AND is_current = true;
```

Then run:
```
npx tsx scripts/forum-attribute-threads.ts --source reddit --include-inherited-comments
```

---

## Repair case — performer vs. cause

### Problem

`is_repair_case = true` is applied to any thread mentioning repair/revision, but the repair penalty
currently penalizes the attributed clinic regardless of whether it *caused* the damage or is
*performing* the repair. A thread like "I went to Vera Clinic to fix ASMED's botched result" is
attributed to Vera Clinic and unfairly penalizes it.

The LLM already captures this distinction via `secondary_clinic_mentions` with `role: "repair_source"`.
If any secondary mention has `role = "repair_source"`, the attributed clinic is the repair performer —
not the cause — and should not be penalized.

### Changes

**`lib/scoring/forum.ts`**:
- Add `isRepairPerformer?: boolean` to `ForumScorerThread`
- Filter out repair performer threads when computing `repairRate`:
  ```ts
  postThreads.filter(t => t.isRepairCase && !t.isRepairPerformer)
  ```

**`profileAggregator.ts`**:
- Add `secondary_clinic_mentions` to the analyses select query
- When mapping scorer threads, set `isRepairPerformer: true` if any secondary mention has `role = 'repair_source'`

No migration needed — `secondary_clinic_mentions` is already stored in `forum_thread_llm_analysis`.

---

## Implementation order

1. Write and push migration
2. Update `LlmOutputSchema`, add `COMMENT_PROMPT_VERSION`, add `buildCommentPrompt()`
3. Update `analyzeSentimentOnly()` to use new prompt + store `sentiment_toward_clinic`
4. Update `profileAggregator.ts` to consume `sentiment_toward_clinic`
5. Delete the 44 rows + re-run inherited comment analysis
6. Run `forum-recompute-profiles.ts --source reddit` to update scores
