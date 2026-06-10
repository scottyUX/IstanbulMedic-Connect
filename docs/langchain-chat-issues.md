# Langchain Chat — Known Issues & Fix Plans

## 1. Duplicate L Avatar / Duplicate Cards ✅ FIXED

**What happens:**
A single user turn was showing 2–4 "L" avatar bubbles instead of one. Every tool call the model made produced its own separate message in CopilotKit's internal messages array, each with a `generativeUI` wrapper that always returns a non-null React element — so `hasGenUI=true` — causing each to render its own L avatar. The "empty L" variant occurred when the wrapper rendered but the underlying render function returned null (e.g. unexpected data format), producing a visible L avatar with nothing inside it.

**Fix applied (2026-06-03):**
- Added `AssistantTurnBubble` component to [components/langchain/MessageBubble.tsx](../components/langchain/MessageBubble.tsx). It takes all `call_*` GenUI messages and the `msg-*` text message and renders them under a **single** L avatar — cards stacked above the text.
- Rewrote [components/langchain/LangchainChat.tsx](../components/langchain/LangchainChat.tsx) to group filteredMessages into turns before rendering. All assistant messages between two user messages are collected into one turn (buffering both `pendingGenUI` and `pendingText` separately), then flushed together as a single `AssistantTurnBubble`.

---

## 1b. L Avatar Flash on First GenUI Render ✅ FIXED

**What happens:**
A brief flash of a second L avatar appeared when the first GenUI card arrived during streaming, before the component fully rendered.

**Root cause:**
In `LangchainChat.tsx`, the turn key was computed as `pendingGenUI[0]?.id ?? pendingText?.id`. Since the text message (`msg-*`) appears first in the array (CopilotKit emits `TEXT_MESSAGE_START` before tool calls), the initial key was `pendingText.id`. When the first `call_*` GenUI message arrived, `pendingGenUI[0]` became defined and the key flipped to `call-*.id` — React unmounted the old bubble and mounted a new one, causing the flash.

**Fix applied (2026-06-03):**
Reversed key priority to `pendingText?.id ?? pendingGenUI[0]?.id` in [components/langchain/LangchainChat.tsx](../components/langchain/LangchainChat.tsx). The text message is always first, so the key is stable once set.

---

## 2. Clinic Profile Not Found (Name Lookup Failure) ✅ FIXED

**What happens:**
When the model passes a slightly-off clinic name (e.g. `"Dr Serkan Aygin"` with ASCII `i` instead of Turkish dotless `ı`), `resolveClinic` returns null and the tool shows "No clinic found matching the given criteria".

**Root cause:**
`resolveClinic` ran a single `ilike("display_name", "%<name>%")` query. `ilike` is ASCII case-insensitive only and won't equate `i` and `ı`, so the full-name pattern fails.

**Fix applied (2026-06-03):**
Added a word-based fallback to `resolveClinic` in [lib/agents/langchain/tools/_shared.ts](../lib/agents/langchain/tools/_shared.ts). If the full `%name%` query returns nothing, significant words are extracted (stop words like `"hair"`, `"clinic"`, `"transplant"`, `"istanbul"`, `"turkey"`, `"dr"` are filtered out), and `ilike` is retried for each word in order, returning on first hit. Tests added in [tests/agents/langchain/tools/_shared.test.ts](../tests/agents/langchain/tools/_shared.test.ts).

---

## 3. Incorrect / Lazy Answers (e.g. "Lowest Rated Clinic") ✅ PARTIALLY FIXED

**What happens:**
For ranking/ordering questions, the model sometimes answers from whatever data is already in its context window rather than fetching the data it needs.

**Root cause:**
`gpt-4o-mini` tends to reason from context rather than following tool-use instructions. Compounded by a prompt gap: no explicit rule about when to fetch vs. reason.

**Fix applied (2026-06-03):**
Added `RANKING_RULE` section to [lib/agents/langchain/prompts/leila-system-prompt.ts](../lib/agents/langchain/prompts/leila-system-prompt.ts) — a mandatory step-by-step procedure for any ranking/superlative question. Also added `order_by` support to `database_lookup` (see issue 5).

**Remaining:**
`gpt-4o-mini` still occasionally ignores this rule. The reliable long-term fix is upgrading `MODEL_NAME` from `gpt-4o-mini` to `gpt-4o` in [lib/agents/langchain/agent.ts](../lib/agents/langchain/agent.ts).

---

## 4. Unnecessary DatabaseResultsCard Rendering ✅ FIXED

**What happens:**
Every `database_lookup` call rendered a full card dumping raw database rows to the user, even for intermediate lookups the model used just to get clinic IDs.

**Fix applied (2026-06-03):**
Removed `DatabaseResultsCard` entirely from [components/langchain/LangchainGenUI.tsx](../components/langchain/LangchainGenUI.tsx). Replaced with a compact inline pill showing `🔍 table · N results` (or a spinner with the table name during in-progress). No raw data is ever shown to the user.

---

## 5. "Top Clinics" Results Are Not Actually Sorted by Score ✅ FIXED

**What happens:**
"Tell me about the clinics with the highest trust score" returned clinics in database insertion order, not by score.

**Root cause:**
`database_lookup` had no `order_by` parameter, so the model couldn't query `clinic_scores ORDER BY overall_score DESC`. It also started from the `clinics` table (which has no score data) rather than `clinic_scores`.

**Fix applied (2026-06-03):**
1. Added `order_by: { column: string; direction: "asc" | "desc" }` parameter to `database_lookup` in [lib/agents/langchain/tools/databaseLookup.ts](../lib/agents/langchain/tools/databaseLookup.ts). Tests updated in [tests/agents/langchain/tools/databaseLookup.test.ts](../tests/agents/langchain/tools/databaseLookup.test.ts).
2. Added `RANKING_RULE` to the system prompt with explicit correct/wrong examples and a note that `clinic_scores` has no location columns — city filters must not be applied to it.

---

## 6. Model Uses Wrong Tool for Comparison ✅ FIXED

**What happens:**
Comparison requests (including implicit ones like "wb serkan and cosmedica") resulted in two `ClinicProfileCard`s instead of a `ClinicComparisonTable`. The model called `clinic_summary` twice rather than `clinic_comparison` once.

**Root cause:**
`clinic_comparison` was listed last in the TOOLS section, and the `CRITICAL` keyword wasn't strong enough for `gpt-4o-mini`. Follow-up comparison requests without the word "compare" were not recognised as comparison triggers. The model also reused cached clinic data from earlier in the conversation instead of calling `clinic_comparison` fresh.

**Fix applied (2026-06-03):**
1. Moved `clinic_comparison` to the **top** of the TOOLS list in the system prompt so the model sees it first.
2. Added explicit "Do NOT call clinic_summary multiple times for a comparison" note to the `clinic_summary` description.
3. Added `COMPARISON_RULE` section — rule is name-count based ("if 2+ clinic names appear in the message, call clinic_comparison"), covers follow-up phrasing, and explicitly says to make a fresh call even when one clinic's data is already in context. Includes WRONG/CORRECT examples.

---

## 7. Review Count Ranking Shows N Full Review Cards ✅ FIXED

**What happens:**
When asked "which clinic has the fewest reviews?", the model called `clinic_reviews` for each clinic individually to get counts, rendering a wall of `ReviewsCard` components before arriving at the answer.

**Fix applied (2026-06-03):**
`clinic_google_places` (already on the allowlist) has a `user_ratings_total` column — a sortable per-clinic Google review count. Updated `RANKING_RULE` in the system prompt to direct the model to `database_lookup(table="clinic_google_places", order_by={ column: "user_ratings_total", direction: "asc" })` for review count questions, avoiding N `clinic_reviews` calls entirely.

---

## 8. Source Scores Not Accessible to Leila ✅ FIXED

**What happens:**
Leila had no way to answer questions about per-source quality scores (e.g. "what is the Reddit score for Serkan?", "which clinic has the best source scores breakdown?").

**Root cause:**
`clinic_source_scores` and `clinic_forum_profiles` were not on the `database_lookup` allowlist.

**Fix applied (2026-06-03):**
- Added `clinic_source_scores` (source_name, summary_score, explanation, breakdown_json, metrics_json) and `clinic_forum_profiles` (forum_source, score, thread_count, sentiment_score, pros, common_concerns, summary) to the allowlist in [lib/agents/langchain/guardrails/schema-allowlist.ts](../lib/agents/langchain/guardrails/schema-allowlist.ts).
- Added searchable columns for both tables in [lib/agents/langchain/tools/databaseLookup.ts](../lib/agents/langchain/tools/databaseLookup.ts).
- Documented both tables in the system prompt TOOLS section.
- Added Reddit score as a ranked query path in `RANKING_RULE`.

---

## 9. Reddit Score Queries Broken (Multiple Issues) ✅ FIXED

**What happened (series of bugs found during testing):**

**9a. Wrong tool for per-clinic Reddit lookup (0 results):**
When asked "what is the Reddit score for Serkan?", the model called `clinic_reviews` instead of `clinic_forum_profiles`, returning patient review cards instead of the forum score. When it did query `clinic_forum_profiles`, it got 0 results because it tried to filter by clinic name — but `clinic_forum_profiles` only has `clinic_id`, not `display_name`.
*Fix:* Added explicit "Do NOT use clinic_reviews for Reddit scores" to `clinic_reviews` tool description. Added a note to `clinic_forum_profiles` that it requires a `clinic_id` UUID filter — if the ID isn't in context, first resolve it via `database_lookup(table="clinics")`.

**9b. Model called `clinic_summary` after getting forum results:**
After fetching `clinic_forum_profiles`, the model called `clinic_summary` for the top result, got the trust score (e.g. 58, Band C), and reported that as the "Reddit score".
*Fix:* Split RANKING_RULE Step 3 by metric type: trust/price/reviews → call `clinic_summary`; Reddit/forum → present the data directly from `clinic_forum_profiles`, no `clinic_summary` call. Added a WRONG example showing this exact bad pattern.

**9c. Null-score clinics sorting first (root cause of "NIMCLINIC has highest Reddit score"):**
PostgreSQL `ORDER BY score DESC` defaults to `NULLS FIRST`, so clinics with no Reddit data (null score) always appeared at the top of ranked queries. Prompt-level null checks couldn't help because the null rows arrived before any scored rows.
*Fix:* Added `nullsFirst: false` to all `order_by` calls in [lib/agents/langchain/tools/databaseLookup.ts](../lib/agents/langchain/tools/databaseLookup.ts). Null-score clinics now sort last for any direction. Test updated in [tests/agents/langchain/tools/databaseLookup.test.ts](../tests/agents/langchain/tools/databaseLookup.test.ts).

**9d. Score reported as rounded integer (7 instead of 7.2):**
The model was rounding decimal scores in natural language output.
*Fix:* Added "report the exact value — never round" to the forum data presentation rule in the system prompt.

---

## 10. Database Allowlist Too Restrictive ✅ FIXED

**What happens:**
Leila could not answer questions about Instagram follower counts, registry licensing, score breakdowns, or team qualifications — even though that data existed in the database.

**Root cause:**
The `database_lookup` allowlist was conservative and excluded all social/pipeline tables by design, but also excluded several safe clinic-facing tables that had no prompt-injection risk.

**Fix applied (2026-06-04):**
Added 5 tables to the allowlist in [lib/agents/langchain/guardrails/schema-allowlist.ts](../lib/agents/langchain/guardrails/schema-allowlist.ts):
- `clinic_social_media` — Instagram/social follower counts and handles
- `clinic_registry_records` — license and registry status
- `clinic_score_components` — per-pillar score breakdown with weights
- `clinic_team_qualifications` — individual doctor/staff certifications
- `clinic_compliance_history` — compliance events and violations

Kept blocked: all `forum_thread_*`, `hrn_thread_content`, `reddit_thread_content`, `clinic_instagram_posts`, `clinic_reddit_posts` (scraped user content — prompt injection risk), plus all `user_*`, `consultations`, and internal provenance tables (`sources`, `source_documents`, `fact_evidence`, `analyses`).

Added searchable columns and updated tool description in [lib/agents/langchain/tools/databaseLookup.ts](../lib/agents/langchain/tools/databaseLookup.ts). Updated system prompt schema section with descriptions for all new tables. Updated guardrail tests in [tests/agents/langchain/guardrails/schema-allowlist.test.ts](../tests/agents/langchain/guardrails/schema-allowlist.test.ts).

---

## 11. Instagram Score Re-Query Returns 0 Results ✅ FIXED

**What happens:**
After a `clinic_comparison` card showed an Instagram score of 92/100 for Cosmedica, asking "what is the instagram score for Cosmedica?" triggered a `database_lookup` on `clinic_source_scores` with a text search for "cosmedica" — returning 0 results and a "I don't have that data" response.

**Root cause (two issues):**
1. `MEMORY_RULE` was already present but Leila re-queried anyway instead of using data from the comparison result already in context.
2. `clinic_source_scores` has no clinic name column — text search on `source_name`/`explanation` will never match a clinic name.

**Fix applied (2026-06-04):**
- Added a concrete WRONG/CORRECT example to `MEMORY_RULE` in [lib/agents/langchain/prompts/leila-system-prompt.ts](../lib/agents/langchain/prompts/leila-system-prompt.ts) covering this exact scenario.
- Added an "IMPORTANT: no clinic name column" note to `clinic_source_scores` in the schema section, with the two-step lookup pattern (resolve clinic_id first, then filter by clinic_id + source_name).

---

## 12. clinic_comparison Missing Instagram and HRN Dimensions ✅ FIXED

**What happens:**
The comparison table had no Instagram or HRN (Hair Restoration Network forum) rows, even though both data sources exist in the database.

**Fix applied (2026-06-04):**

**Tool** ([lib/agents/langchain/tools/clinicComparison.ts](../lib/agents/langchain/tools/clinicComparison.ts)):
- Added `instagram` dimension — fetches `clinic_social_media` (follower count, handle, verified) + `clinic_source_scores` (summary_score) in parallel; returns combined object.
- Added `hrn` dimension — fetches `clinic_forum_profiles` with `forum_source='hrn'`; same shape as reddit.
- Both added to `DEFAULT_DIMENSIONS` (rows auto-hide when all clinics have null data).

**GenUI component** ([components/langchain/LangchainGenUI.tsx](../components/langchain/LangchainGenUI.tsx)):
- `instagram` renders as `142K followers / @handle ✓ / Score: 74/100`; highlights clinic with highest source_score.
- `hrn` renders identically to reddit (`8.2/10 · 43 threads · Mostly positive`); highlights highest score.

---

## 13. Clinic Profile Card Missing Key Signals ✅ FIXED

**What happens:**
The `ClinicProfileCard` rendered by `clinic_summary` was missing accreditations, community signals (Reddit + Instagram), registry status, procedures count, and Google rating — data that was either already returned by the tool but not rendered, or available with an extra fetch.

**Fix applied (2026-06-04):**

**Tool additions** ([lib/agents/langchain/tools/clinicSummary.ts](../lib/agents/langchain/tools/clinicSummary.ts)):
Added 4 parallel fetches alongside `fetchClinicData`:
- `clinic_social_media` → `instagram` (handle, follower_count, verified)
- `clinic_forum_profiles` (reddit) → `reddit` (score, thread_count, sentiment_score)
- `clinic_registry_records` → `registry_verified` boolean
- `clinic_google_places` → `google` (rating, user_ratings_total)

**Card additions** ([components/langchain/LangchainGenUI.tsx](../components/langchain/LangchainGenUI.tsx)):
- **Trust badges row** — `✓ Licensed` chip (emerald, if registry_verified) + accreditation name chips (up to 3), displayed after the clinic header.
- **Community section** — Reddit row (icon + score + thread count + sentiment label) and Instagram row (icon + follower count + @handle + verified checkmark), displayed after team.
- **Stats row** — Added Google rating (`G` logo + star rating + total count) and procedures performed count. Removed the misleading "available reviews" count (was count of reviews in DB, not Google total).

---

## 14. Linter Errors (CI Failure) ✅ FIXED

Fixed 1 error and 7 warnings across 6 files (2026-06-04):

| File | Issue | Fix |
|---|---|---|
| `components/langchain/LangchainChat.tsx` | Non-null assertion on optional chain (`?.id!`) | Removed `?` — guard above guarantees array is non-empty |
| `components/leila/LeilaHero.tsx` | `_onGetStarted` unused | Removed from destructuring |
| `components/leila/LeilaInput.tsx` | `_onStop`, `_hideStopButton` unused | Removed from destructuring |
| `components/ui/button.tsx` | `_type` unused (destructured to exclude from spread) | Added `eslint-disable-next-line` |
| `components/ui/section.tsx` | `_noPadding` unused | Removed from destructuring |
| `tests/components/ComparisonViews.test.tsx` | `<img>` in mock, unused `_id`/`_name` args | Added `eslint-disable-next-line` comments |
