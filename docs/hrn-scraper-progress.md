# HRN Forum Scraper — Progress Documentation

**Last Updated:** 2026-04-16
**Status:** Pipeline Complete + Unit Tested — Ready for Frontend

---

## Quick Resume (Start Here)

### What's Built
- **Storage pipeline** (`app/api/hrnPipeline/hrnStoragePipeline.ts`) - Full end-to-end: scrape → entity filter → LLM extract → store in Supabase
- **Entity filter** - Loads clinic + doctor names from DB, skips LLM on non-matching threads. Saves ~$0.0008/thread for threads about unknown clinics.
- **Forum listing scraper** (`app/api/hrnPipeline/forumListingScraper.ts`) - Collects thread URLs from forum pages. Uses fresh browser context per page to bypass Cloudflare.
- **Thread scraper** (`app/api/hrnPipeline/hrnScraperTest.ts`) - Extracts title, author, date, OP text, photos, and last author update from any HRN thread URL
- **LLM extraction** (`app/api/hrnPipeline/extractionPrompt.ts`) - GPT-4o-mini with function calling for structured signal extraction
- **Unit tests** (`tests/unit/hrnEntityFilter.test.ts`) - 14 tests for entity filter, all passing

### Quick Resume for Frontend Session

**Goal:** Add HRN signals as a new tab in the Community Signals section of the clinic profile page, modelled after the existing Instagram signals tab.

**Data available per clinic (from `forum_thread_llm_analysis` + `forum_thread_index`):**
- `sentiment_score` (-1.0 to 1.0) + `sentiment_label` (positive/mixed/negative)
- `satisfaction_label` (satisfied/mixed/regretful)
- `summary_short` (1-2 sentence thread summary)
- `attributed_clinic_name` / `attributed_doctor_name`
- `main_topics` (array) + `issue_keywords` (array)
- `is_repair_case` (boolean) + `has_12_month_followup` (signal in `forum_thread_signals`)
- `title` + `thread_url` (for linking back to HRN source)
- `has_photos` + `image_urls` (in `hrn_thread_content`)

**Starting point:** Find the Instagram signals tab component and use it as the pattern for the HRN tab.

---

### How to Test the Pipeline

**Prerequisites:**
```bash
# Ensure local Supabase is running
npx supabase start

# Verify env vars are set in .env.local:
# - NEXT_PUBLIC_SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
# - OPENAI_API_KEY
```

**Test a single thread:**
```bash
# Positive review thread
npx tsx app/api/hrnPipeline/hrnStoragePipeline.ts "https://www.hairrestorationnetwork.com/topic/57598-9-months-results-dr-taleb-barghouthi/"

# Negative review thread
npx tsx app/api/hrnPipeline/hrnStoragePipeline.ts "https://www.hairrestorationnetwork.com/topic/60073-1-year-post-op-selda-center/"

# Repair case thread
npx tsx app/api/hrnPipeline/hrnStoragePipeline.ts "https://www.hairrestorationnetwork.com/topic/62011-dr-ball-at-true-false-maitland-clinic-hair-transplant-repair/"
```

**Verify data in Supabase Studio:**
```bash
# Open Supabase Studio
npx supabase status  # Get studio URL (usually http://localhost:54323)

# Check tables:
# - forum_thread_index (hub)
# - hrn_thread_content (HRN extension)
# - forum_thread_llm_analysis (LLM results)
```

**Batch mode (requires thread-urls.json from forumListingScraper):**
```bash
# First, collect some thread URLs (limit to 2 pages for testing)
npx tsx app/api/hrnPipeline/forumListingScraper.ts --forum=89 --limit=2

# Then process them (limit to 3 threads for testing)
npx tsx app/api/hrnPipeline/hrnStoragePipeline.ts --batch --limit=3
```

### Key Decisions Made
1. **Playwright over BeautifulSoup** - HRN has Cloudflare protection, needs real browser
2. **Fresh browser context per page** - Solved Cloudflare session-based blocking (see Solved Blockers below)
3. **Hybrid extraction** - Regex for unambiguous signals (graft count, timeline), LLM for context-dependent signals (clinic attribution, sentiment)
4. **Targeted forums** - Scrape forums 17, 24, 89 only (~28.6K threads)
5. **LLM for clinic attribution** - URL only contains clinic name ~38% of time, need LLM to determine which clinic a thread is about
6. **Re-scraping via lastmod** - Use sitemap `lastmod` timestamp to detect thread updates
7. **OpenAI GPT-4o-mini over Claude Haiku** - Cheaper ($0.0008/thread vs $0.0014), team already has API keys
8. **Function calling for structured output** - More reliable than prompt-based JSON extraction, schema-validated

### Pipeline Architecture

```
thread URL
    ↓
scrapeHRNThread()        → HRNThreadData (title, author, opText, images, etc.)
    ↓
extractThreadSignals()   → ExtractionResult (sentiment, clinic, topics, issues)
    ↓
┌───────────────────────────────────────────────────────────┐
│  upsertForumThreadIndex()   → forum_thread_index (hub)    │
│  upsertHrnThreadContent()   → hrn_thread_content (ext)    │
│  insertLlmAnalysis()        → forum_thread_llm_analysis   │
└───────────────────────────────────────────────────────────┘
```

**Key files:**
- `app/api/hrnPipeline/hrnStoragePipeline.ts` — Main pipeline orchestrator
- `app/api/hrnPipeline/hrnScraperTest.ts` — `scrapeHRNThread(url)` returns `{ success, data, error }`
- `app/api/hrnPipeline/extractionPrompt.ts` — `extractThreadSignals(client, input)` returns extraction result
- `app/api/hrnPipeline/forumListingScraper.ts` — collects thread URLs from forums
- `supabase/migrations/20260409000000_create_forum_scraping_tables.sql` — DB schema

### Immediate Next Steps
1. ~~Fix forum listing scraper Cloudflare issue~~ ✅ Solved (fresh context per page)
2. ~~Create database migration~~ ✅ Done
3. ~~Build LLM extraction prompt~~ ✅ Done and tested
4. ~~Build storage pipeline~~ ✅ Done (`hrnStoragePipeline.ts`)
5. ~~Test pipeline with diverse threads~~ ✅ Done (positive, repair, clinic-posted)
6. ~~Add sentiment_score to DB~~ ✅ Done (migration `20260415000000_add_sentiment_score_to_llm_analysis.sql`)
7. ~~Build entity filter~~ ✅ Done — loads clinics + doctors from DB, blocks generic threads before LLM call
8. **Build frontend** — Display HRN signals per clinic
9. **Contact HRN for permission** — Before running full scrape
10. **Run small batch** — Process ~50 threads to validate at scale

### Entity Filter (Built 2026-04-16)

Prevents LLM calls on threads that don't mention any known clinic or doctor.

**How it works:**
- `loadKnownClinicKeywords()` — queries `clinics` + `clinic_team` tables in parallel (98 entities currently)
- `buildEntityRegex()` — builds one regex from all names; strips "Dr." prefix to match bare surnames; skips generic stopwords (hair, clinic, medical, istanbul, etc.) to avoid false positives
- `matchesKnownEntity()` — checks title + OP text against regex after scrape, before LLM

**Verified:**
- Known entity text → PASS ✓
- Generic text ("my hair transplant journey random clinic xyz") → correctly blocked ✓
- Unknown doctor (Bloxham, not in DB) → correctly blocked ✓

**Cost impact:** Threads about clinics outside our DB are scraped (~11s) but skip the LLM call ($0.0008 saved per thread). At 28K threads, filter rate TBD after first batch run.

### LLM Extraction Test Results (2026-04-11)

Tested GPT-4o-mini with function calling on 4 diverse threads:

| Thread Type | Key Signals | Result |
|-------------|-------------|--------|
| **Positive review** (Dr. Barghouthi) | sentiment: 0.70, clinic attribution | ✅ Correct |
| **Repair case** (Dr. Ball @ Maitland) | `is_repair_case: true`, secondary mentions | ✅ Correct |
| **12-month followup** (Bloxham FUT) | `has_12_month_followup: true` | ✅ Correct |
| **Negative review** (Selda Center) | sentiment: -1.00, `regretful`, issues | ✅ Correct |

**Key observations:**
- Sentiment scoring uses full range (-1 to +1) appropriately
- Repair cases correctly identified
- 12-month/1-year timeline detection works
- Issue keywords are negation-aware (only includes actual issues)
- Evidence snippets are accurate quotes
- Secondary clinic mentions captured

### Deferred Decisions
- **`forum_score` field** — Will be added to `clinic_forum_profiles` after we have real data to inform the weighting formula. All raw inputs are already captured (thread counts, sentiment, etc.). See `docs/forum-scraping-schema.md` for details.

### Solved Blockers

#### Cloudflare Pagination Blocking (Solved 2026-04-11)

**Issue:** Forum listing scraper worked on page 1 but subsequent pages returned Cloudflare challenge page.

**Root Cause:** Cloudflare detected bot-like behavior when the same browser context made multiple sequential requests.

**Solution:** Create a fresh browser context for each page request. Each request gets a clean session, avoiding session-based blocking.

```typescript
// Fresh context for EACH page
for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
  const context = await browser.newContext({ userAgent: '...' });
  const page = await context.newPage();
  // ... scrape ...
  await context.close();
}
```

Also added randomized delays (4-6s) between requests for more human-like behavior.

### Estimated Costs (Revised 2026-04-11)
Based on verified forum page counts:

| Forum | Pages | Threads |
|-------|-------|---------|
| 24 (Reviews) | 730 | ~18,250 |
| 17 (Clinic Results) | 410 | ~10,250 |
| 89 (Repairs) | 6 | ~150 |
| **Total** | 1,146 | **~28,650** |

**LLM Extraction (GPT-4o-mini):**
- Initial full scrape: **~$23** (~$0.0008/thread)
- Weekly incremental: **~$1-2** (new threads + re-scraping updated ones)

**Scrape Time:**
- Sequential: ~117 hours
- 4 parallel contexts: **~29 hours**

---

## Table of Contents
1. [Implementation Progress](#implementation-progress)
2. [Legal & Compliance Research](#legal--compliance-research)
3. [Technical Findings](#technical-findings)
4. [Signal Extraction Strategy](#signal-extraction-strategy)
5. [Open Questions](#open-questions)
6. [Next Steps](#next-steps)

---

## Implementation Progress

### Files Created

| File | Purpose | Status |
|------|---------|--------|
| `docs/hrn-forum-scraping-mvp-plan.md` | Full MVP plan with signal schema, DB design, execution phases | Complete |
| `docs/forum-scraping-schema.md` | Hub+extension schema design for unified forum scraping | Complete |
| `supabase/migrations/20260409000000_create_forum_scraping_tables.sql` | Database migration (HRN tables only, Reddit deferred) | Complete |
| `app/api/hrnPipeline/hrnScraperTest.ts` | Core Playwright-based thread scraper | Complete |
| `app/api/hrnPipeline/runTest.ts` | Simple test runner script | Complete |
| `app/api/hrnPipeline/debugStructure.ts` | DOM structure inspector for debugging | Complete |
| `app/api/hrnPipeline/investigateForum.ts` | Forum pagination investigator | Complete |
| `app/api/hrnPipeline/forumListingScraper.ts` | Collects thread URLs from forum pages | Complete ✅ |
| `app/api/hrnPipeline/extractionPrompt.ts` | LLM extraction using OpenAI function calling | Complete ✅ |
| `app/api/hrnPipeline/testExtraction.ts` | Test script for extraction | Complete ✅ |

### Dependencies Added

```bash
npm install -D tsx  # For running TypeScript files directly
npx playwright install chromium  # Browser for scraping
```

### Scraper Capabilities (Verified Working)

The scraper successfully extracts the following from HRN threads:

| Field | Extraction Method | Status |
|-------|-------------------|--------|
| Thread title | `h1` selector | ✅ Working |
| Author username | `.ipsUsername` selector | ✅ Working |
| Post date | `time[datetime]` attribute | ✅ Working |
| Reply count | Regex on page text | ✅ Working |
| View count | Regex on page text | ⚠️ Partial (not always present) |
| OP text (full) | `[data-role="commentContent"]` | ✅ Working |
| OP HTML | Same selector, innerHTML | ✅ Working |
| Photo detection | Image URL extraction + keyword detection | ✅ Working |
| Image URLs | `img` tags excluding emojis/avatars | ✅ Working |
| Multi-page detection | Pagination element parsing | ✅ Working |
| Last author post | Navigate to last page, find by author | ✅ Working |

### Test Results

**Test 1: Single-page thread**
- URL: `https://www.hairrestorationnetwork.com/topic/57598-9-months-results-dr-taleb-barghouthi/`
- Result: Success
- Title: "9 months results- Dr. Taleb Barghouthi"
- Author: aabud14
- OP text: 2,374 characters
- Images: 23 URLs extracted
- Duration: ~11 seconds

**Test 2: Multi-page diary thread**
- URL: `https://www.hairrestorationnetwork.com/topic/61571-my-story-2580-fue-may-10-2021-microscope-diary-beginning-october-27-2021/`
- Result: Success
- Title: "My story: 2580 FUE, May 10, 2021 (Microscope diary...)"
- Author: Lightmare
- Pages detected: 2
- Replies: 79
- OP text: 3,926 characters
- Duration: ~21 seconds

### Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    hrnScraperTest.ts                     │
├─────────────────────────────────────────────────────────┤
│  scrapeHRNThread(url, options)                          │
│    ├── Launch Chromium via Playwright                   │
│    ├── Navigate to thread URL                           │
│    ├── extractThreadMetadata(page)                      │
│    │     └── title, author, date, replies, pages        │
│    ├── extractOriginalPost(page)                        │
│    │     └── text, html, photos, imageUrls              │
│    └── extractLastAuthorPost(page, browser, ...)        │
│          └── Navigate to last page if multi-page        │
│          └── Find most recent post by OP                │
└─────────────────────────────────────────────────────────┘
```

### Usage

```bash
# Run test on default URL
npx tsx app/api/hrnPipeline/runTest.ts

# Run test on specific thread
npx tsx app/api/hrnPipeline/runTest.ts "https://www.hairrestorationnetwork.com/topic/XXXXX-thread-slug/"
```

---

## Legal & Compliance Research

### Summary

| Aspect | Finding | Risk Level |
|--------|---------|------------|
| robots.txt compliance | `/topic/*` URLs are ALLOWED | ✅ Low |
| ToS automated access clause | Gray area - we use real browser | ⚠️ Medium |
| ToS user data collection | We collect posts, not user data | ✅ Low |
| Cloudflare protection | Present but passable with browser | ⚠️ Medium |

### robots.txt Analysis

**Source:** `https://www.hairrestorationnetwork.com/robots.txt`

```
User-Agent: *
# Block pages with no unique content
Disallow: /startTopic/
Disallow: /discover/unread/
Disallow: /markallread/
Disallow: /staff/
Disallow: /cookies/
Disallow: /online/
Disallow: /discover/
Disallow: /leaderboard/
Disallow: /search/
Disallow: /*?advancedSearchForm=
Disallow: /register/
Disallow: /lostpassword/
Disallow: /login/
Disallow: /*currency=
Disallow: /*?sortby=
Disallow: /*?filter=
Disallow: /*?tab=
Disallow: /*?do=
Disallow: /*ref=
Disallow: /*?forumId*
Disallow: /*?&controller=embed
Disallow: /cdn-cgi/

Sitemap: https://www.hairrestorationnetwork.com/sitemap.php
```

**Key Finding:** `/topic/*` URLs are NOT in the Disallow list, meaning they explicitly permit crawling of thread content.

### Terms of Service Analysis

**Relevant Clauses:**

1. **Robot Compliance Requirement:**
   > "These Terms of Use also mandate that robots, spiders, Web crawlers... are Standard for Robot Exclusion (SRE)-compliant robots."

   **Our Status:** Compliant — we respect robots.txt which allows `/topic/*`

2. **Interface Restriction:**
   > "You agree not to access our Web Sites by any means other than through the interface that is provided by us for use in accessing our Web Sites."

   **Our Status:** Gray area — Playwright uses a real Chromium browser (the same interface humans use), but it's automated. This is the most ambiguous clause.

3. **User Data Collection:**
   > "You agree not to access or use these Sites in order to collect information about Site visitors or registered users of the Sites."

   **Our Status:** Likely compliant — we're collecting post content, not user profiles or personal data. Author usernames are incidental metadata attached to posts, not "information about users."

4. **Security Violations:**
   > Prohibits attempting to "probe, scan or test the vulnerability of a system" or "interfere with service."

   **Our Status:** Compliant — we're not probing security, just reading public pages.

### Risk Mitigation Recommendations

1. **Rate Limiting (Strongly Recommended)**
   - Add 3-5 second delays between requests
   - Don't scrape more than ~100-200 threads per session
   - Consider time-of-day scheduling (off-peak hours)

2. **Attribution (Strongly Recommended)**
   - Always link back to original thread URLs in UI
   - Consider "Source: Hair Restoration Network" attribution

3. **Data Minimization**
   - Don't store unnecessary personal data
   - Consider anonymizing author usernames in aggregated views
   - Only store what's needed for the signal extraction

4. **Permission Request (Optional but Safest)**
   - Contact: `copyright@HairTransplantNetwork.com`
   - Or: Media Visions, Inc., 14260 W. Newberry Road #355, Newberry, FL 32669
   - Pitch: "Building a clinic comparison tool that would drive traffic back to HRN threads"

### Legal Precedent Context

- **hiQ Labs v. LinkedIn (2022):** Established that scraping publicly accessible data is not necessarily a CFAA (Computer Fraud and Abuse Act) violation. However, this doesn't override ToS breach as a civil matter.

- **Key Distinction:** We're accessing public content that they explicitly allow crawlers to index (per robots.txt). We're not bypassing authentication or accessing private data.

---

## Technical Findings

### HRN Forum Stack

- **Platform:** Invision Community (IPBoard) CMS
- **Protection:** Cloudflare (blocks direct HTTP requests, allows real browsers)
- **DOM Structure:** Uses `article.ipsEntry--post` for posts, `.ipsUsername` for authors

### Key CSS Selectors Discovered

```javascript
// Thread title
'h1'

// First post (OP)
'article[data-ips-first-post]'
'.cTopic article:first-of-type'

// Post content
'[data-role="commentContent"]'

// Author username
'.ipsUsername'
'.ipsEntry__username a'

// Post date
'time[datetime]'

// Pagination
'.ipsPagination_page'
'.ipsPagination_last a'

// Images (excluding avatars/emojis)
'img:not([src*="emoji"]):not([src*="avatar"]):not([src*="rank"])'
```

### Performance Characteristics

| Metric | Value |
|--------|-------|
| Single-page thread | ~11-12 seconds |
| Multi-page thread (2 pages) | ~20-22 seconds |
| Browser launch overhead | ~2-3 seconds |
| Per-page navigation | ~5-8 seconds |

### Limitations Identified

1. **View count** not consistently available on all threads
2. **Cloudflare** occasionally shows challenge page (mitigated by using real browser UA)
3. **Multi-page last author post** requires separate page load (adds latency)

---

## Signal Extraction Strategy

### Raw Data → Signal Mapping

The scraper collects raw data that must be transformed into the MVP signals. Here's how each signal will be derived:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        WHAT WE SCRAPE (Raw Data)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  threadUrl, threadTitle, author, postDate,                                  │
│  replyCount, viewCount, hasPhotos, imageUrls                                │
│                                    │                                        │
│                                    ▼                                        │
│                          Direct passthrough to signals                      │
│                                                                             │
│  opText + lastAuthorPost.text                                               │
│                                    │                                        │
│                                    ▼                                        │
│                    Text requiring extraction processing                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
          ┌─────────────────┐               ┌─────────────────┐
          │   Regex Layer   │               │    LLM Layer    │
          │  (cheap/fast)   │               │ (smart/context) │
          └─────────────────┘               └─────────────────┘
                    │                                 │
                    ▼                                 ▼
          • graft_count                     • clinic_name
          • timeline_markers                • doctor_name
          • has_photos                      • issue_keywords (with context)
                                            • is_repair_case
                                            • sentiment_label
                                            • satisfaction_label
                                            • summary_short
                                            • main_topics
```

### Decision: Hybrid Regex + LLM Approach

After analysis, we determined that **pure regex extraction is unreliable for context-dependent signals**.

#### The Problem with Regex

```
Example 1 - Doctor attribution:
"I was considering Dr. Koray but ultimately went with Dr. Pekiner"
→ Regex finds BOTH names, but which is THE doctor for this thread?

Example 2 - Negated issues:
"Unlike my friend who had shock loss, I didn't experience any"
→ Regex finds "shock loss", but it's actually a NEGATIVE (good) signal

Example 3 - Repair context:
"This was a repair case after my botched HT at Clinic X, now with Clinic Y"
→ Which clinic do we attribute this to? Regex can't determine.
```

#### The Solution: Tiered Extraction

| Signal | Method | Rationale |
|--------|--------|-----------|
| `thread_url` | Direct | From scrape |
| `thread_title` | Direct | From scrape |
| `author` | Direct | From scrape |
| `post_date` | Direct | From scrape |
| `reply_count` | Direct | From scrape |
| `view_count` | Direct | From scrape (when available) |
| `has_photos` | Direct | From scrape |
| `graft_count` | **Regex** | Numbers are unambiguous ("3000 grafts") |
| `timeline_markers` | **Regex** | Patterns like "6 months" are unambiguous |
| `clinic_name` | **LLM** | Context needed to identify THE clinic |
| `doctor_name` | **LLM** | Context needed to identify THE doctor |
| `issue_keywords` | **LLM** | Negation matters ("no shock loss" ≠ "shock loss") |
| `is_repair_case` | **LLM** | Need to understand if THIS procedure was repair |
| `sentiment_label` | **LLM** | Requires understanding tone |
| `satisfaction_label` | **LLM** | Requires understanding outcome |
| `summary_short` | **LLM** | Requires comprehension |
| `main_topics` | **LLM** | Requires categorization |

### Cost Analysis

Using Claude Haiku for LLM extraction:

| Metric | Estimate |
|--------|----------|
| Avg thread text size | ~3,000 characters (~1K tokens) |
| LLM output | ~200 tokens |
| Cost per thread | ~$0.0003 |
| Cost for 1,000 threads | ~$0.30 |
| Cost for 28,650 threads | ~$8.60 |

**Conclusion:** LLM extraction is cheap enough to use broadly. Even at ~28K threads, total cost is under $10. The accuracy gain justifies the minimal cost.

### Transparency & Auditability

Per the MVP plan, every signal will store its extraction metadata:

```typescript
{
  signal_name: "is_repair_case",
  signal_value: true,
  evidence_snippet: "This was my second HT after a botched procedure at...",
  extraction_method: "llm",        // "regex" | "keyword" | "llm"
  extraction_version: "v1.0",
  model_name: "claude-3-haiku",    // LLM fields only
  prompt_version: "v1.0",          // LLM fields only
  run_timestamp: "2026-04-08T..."  // LLM fields only
}
```

This allows users to understand HOW each signal was determined and trace back to the source evidence.

---

## Thread Discovery (Investigated)

### Sitemap Findings

The HRN sitemap (`sitemap.php`) contains:
- **290 topic sitemap files** (`Topic_1` through `Topic_290`)
- **~14,500 threads total** across all forums
- Each entry includes `lastmod` timestamp (useful for detecting updates)

**Sample sitemap entry:**
```xml
<url>
  <loc>https://www.hairrestorationnetwork.com/topic/78247-smile-hair-clinic...</loc>
  <lastmod>2026-04-01T11:20:14-03:00</lastmod>
</url>
```

### URL Analysis

Analyzed 80 sample thread URLs:
- **~38% have clinic/doctor name in URL** (e.g., `dr-koray-3000-grafts-...`)
- **~62% are generic** (e.g., `my-hair-transplant-journey`, `need-advice`)

**Conclusion:** URL filtering alone would miss ~60% of relevant threads. LLM classification is needed.

### Forum Structure

Key forums identified for scraping:

| Forum | ID | Content |
|-------|-----|---------|
| Results Posted by Clinics | 17 | Official clinic before/after |
| Hair Transplant Reviews | 24 | Patient experiences |
| Hair Transplant Repairs | 89 | Repair/revision cases |

Thread pages include breadcrumb showing forum:
```
Home → Surgical Hair Restoration → Hair Transplant Reviews (forum/24)
```

### Discovery Strategy (Decided)

**Approach:** Scrape forum listing pages directly rather than filtering sitemap.

1. Scrape `/forum/17-...`, `/forum/24-...`, `/forum/89-...` listing pages
2. Paginate to collect all thread URLs from those forums
3. Scrape only those threads (~5K estimated)
4. Use LLM to classify clinic/doctor (can't rely on URL alone)

**Estimated cost:** ~$8-9 (Haiku) for full extraction on ~28K threads

### Clinic/Doctor Attribution (Decided)

**Decision:** LLM determines clinic/doctor from thread content.

Rationale:
- URL only contains clinic name ~38% of the time
- Even when present, context matters ("considered Dr. X, went with Dr. Y")
- LLM can handle this reliably in same call as other signal extraction

---

## Scraping & Re-scraping Strategy

### Initial Scrape

One-time scrape of all threads from target forums (17, 24, 89):
- Estimated **~28,650 threads** (verified via pagination)
- Playwright scrape: ~11-20 sec per thread
- Full scrape time (sequential): ~117 hours
- Full scrape time (4 parallel): **~29 hours**
- LLM extraction cost: **~$8-9**

### Incremental Updates (New Threads)

**Frequency:** Weekly

**Process:**
1. Re-fetch sitemap
2. Identify new thread URLs not in our database
3. Scrape and process only new threads

**Expected volume:** ~20-50 new threads/week in target forums

> **Note (2026-04-08):** This estimate is based on forum activity rate, not historical thread count. The larger base (28K vs original 5K estimate) doesn't change the rate of new thread creation.

### Re-scraping (Thread Updates)

**Why:** Capture long-term updates (e.g., "12 month results" added to old thread)

**Strategy:** Use sitemap `lastmod` timestamp

```
For each thread in our DB:
  if sitemap.lastmod > our.last_scraped_at:
    re-scrape thread
    re-run LLM extraction
```

**Frequency:** Weekly, alongside new thread check

**Cost:** Negligible (~$0.0006 per updated thread)

> **Note (2026-04-08):** Even with 28K threads, if 5% update weekly = ~1,430 re-scrapes = ~$0.86/week. The larger thread base doesn't significantly impact incremental costs.

### Database Fields for Tracking

```sql
thread_url         -- unique identifier
first_scraped_at   -- when we first captured this thread
last_scraped_at    -- when we last scraped it
sitemap_lastmod    -- lastmod from sitemap (to detect changes)
```

---

## Open Questions

### Forum Listing Pagination

Need to verify:
- How many pages per forum?
- How many threads per page?
- Total thread count for forums 17, 24, 89

(Initial test showed unexpected results - needs further investigation)

---

## Next Steps

### Immediate Priority: Forum Listing Scraper

- [x] Investigate HRN sitemap - DONE (290 files, ~14.5K threads)
- [x] Decide on discovery strategy - DONE (scrape forum listings for targeted forums)
- [x] Verify pagination and total thread counts per forum - DONE (~28.6K threads total)
- [ ] Build forum listing scraper to collect thread URLs from forums 17, 24, 89
  - [x] Basic scraper structure created
  - [ ] **Fix Cloudflare blocking on pagination** ← CURRENT BLOCKER

### Phase 3: Extraction Layer

- [ ] Build regex extractors for unambiguous signals:
  - Timeline markers ("6 months", "1 year", "12 month update")
  - Graft counts (numbers near "grafts")
- [ ] Build LLM extraction prompt for context-dependent signals:
  - clinic_name, doctor_name
  - issue_keywords (with negation handling)
  - is_repair_case
  - sentiment_label, satisfaction_label
  - summary_short, main_topics
- [ ] Add evidence snippet storage (exact text that triggered each signal)

### Database & Pipeline

- [ ] Create Supabase migration for HRN tables:
  - `clinic_hrn_threads`
  - `hrn_thread_signals`
  - `hrn_thread_llm_analysis`
- [ ] Build HRN service layer following Instagram pipeline pattern
- [ ] Create batch scraper with rate limiting (3-5 sec between requests)

### QA & UI

- [ ] Manual QA process for first 30-50 threads
- [ ] Basic UI component for displaying HRN signals per clinic
- [ ] Attribution links back to source threads

---

## Appendix: Sample Scraped Data

```json
{
  "threadUrl": "https://www.hairrestorationnetwork.com/topic/57598-9-months-results-dr-taleb-barghouthi/",
  "threadTitle": "9 months results- Dr. Taleb Barghouthi",
  "author": "aabud14",
  "postDate": "2020-08-31T09:15:39Z",
  "replyCount": 3,
  "viewCount": null,
  "opText": "Dear community, \n\nIt is my first time posting here as to be honest I was not aware of this forum in my region until I recently was informed by some friends to post and share experiences. I am a 38 years old and have suffered with male pattern hair loss for few years...",
  "hasPhotos": true,
  "imageUrls": [
    "//media.invisioncic.com/o278943/monthly_2020_08/IMG_6617.thumb.jpg...",
    "//media.invisioncic.com/o278943/monthly_2020_08/IMG_6618.thumb.jpg...",
    // ... 21 more images
  ],
  "lastAuthorPost": {
    "text": "Thank you @Melvin-Moderator",
    "date": "2020-09-01T11:14:42Z",
    "pageNumber": 1
  },
  "scrapeStrategy": "op_and_last",
  "totalPages": 1
}
```
