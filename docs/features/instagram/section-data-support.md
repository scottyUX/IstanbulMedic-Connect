# Instagram Section - Data Support Analysis

This document outlines what the Instagram scraper actually collects vs what the current UI expects, to guide the redesign of the social section.

## Data Source

The Instagram scraper uses **Apify's Instagram scraper** and collects:
- **Profile data**: 1 result with account details
- **Posts data**: 200 most recent posts (reverse chronological order)

---

## UI Components & Data Support

### ✅ CAN Support (data available from scraper)

| UI Element | Data Field | Source |
|------------|------------|--------|
| Profile URL | `profileUrl` | ✅ scraped |
| Username | `username` | ✅ scraped |
| Full Name | `fullName` | ✅ scraped |
| Biography | `biography` | ✅ scraped |
| Followers Count | `followersCount` | ✅ scraped |
| Posts Count | `postsCount` | ✅ scraped |
| Verified Badge | `verified` | ✅ scraped |
| Business Account | `isBusinessAccount` | ✅ scraped |
| Business Category | `businessCategoryName` | ✅ scraped |
| External URLs | `externalUrls` | ✅ scraped |
| Last Updated | `lastSeenAt` | ✅ can track |

### ⚠️ CAN Calculate (derive from post data)

| UI Element | Data Field | How | Caveat |
|------------|------------|-----|--------|
| Avg Likes per Post | `likesPerPost` | avg(likes) across posts | Based on 200 most recent posts |
| Avg Comments per Post | `commentsPerPost` | avg(comments) across posts | Based on 200 most recent posts |
| Engagement per Post | `engagementTotalPerPost` | avg(likes + comments) | Based on 200 most recent posts |
| Engagement Rate | `engagementRate` | avg engagement / followers | Based on 200 most recent posts |

**Important:** Calculated engagement metrics are based on the 200 most recent posts, not lifetime data. This should be disclosed in the UI.

### ❌ CANNOT Support (not available from scraper)

| UI Element | Data Field | Why Not |
|------------|------------|---------|
| Follower Growth Chart | `followerHistory[]` | Single snapshot - no historical data |
| Posting Activity Chart | `postActivityHistory[]` | Would need monthly aggregation over time |
| Benchmark Comparisons | `engagement.benchmark` | No industry benchmark data source |

---

## Current UI Sections Assessment

### 1. Key Insights Row - ⚠️ Partially supportable
- Shows engagement vs benchmark comparisons
- Currently uses hardcoded fallback values
- **Problem:** Benchmark data doesn't exist

### 2. Metrics Row - ✅ Fully supportable
- Followers, Posts, Category, Links count
- All fields available from scraper

### 3. Follower Growth Chart - ❌ Not supportable
- Shows line chart of follower count over 7 months
- Uses `DEFAULT_FOLLOWER_HISTORY` hardcoded data
- **Problem:** Scraper only captures current snapshot

### 4. Posting Activity Chart - ⚠️ Could partially calculate
- Shows bar chart of posts per month
- Could derive from post `timestamp` data (200 posts)
- But only covers recent history, not 7 months back consistently

### 5. Engagement Section - ⚠️ Partially supportable
- Shows clinic engagement vs benchmark
- Can calculate clinic metrics from posts
- **Problem:** No benchmark data for comparisons

---

## Recommended Design (Option 2: Profile + Engagement Split)

### Keep
| Component | What it shows |
|-----------|---------------|
| Profile header (new) | Avatar, name, @handle, verified badge, external link |
| InstagramMetricsRow | Followers, Posts, Category, Links count |
| Engagement metrics (simplified) | Avg likes/post, Avg comments/post |

### Remove
| Component | Why |
|-----------|-----|
| KeyInsightsRow | Benchmark comparisons - no data source |
| Follower Growth Chart | Historical data - only have snapshot |
| Posting Activity Chart | Incomplete data |
| EngagementSection (current) | Benchmark comparisons - no data source |

### New Structure

```
┌─────────────────────────────────────────────────────┐
│  INSTAGRAM PRESENCE                                 │
├─────────────────────────────────────────────────────┤
│  [Avatar]  Clinic Name                              │
│            @handle  ✓ verified                      │
│            clinicwebsite.com                        │
│                                                     │
│  "Bio text here..."                                 │
├─────────────────────────────────────────────────────┤
│  12.5K          342           Medical & Health      │
│  Followers      Posts         Category              │
├─────────────────────────────────────────────────────┤
│  48             3.2                                 │
│  Avg Likes      Avg Comments                        │
│  ─────────────────────────────────────────────────  │
│  Based on 200 most recent posts                     │
└─────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Action |
|------|--------|
| `InstagramIntelligenceSection.tsx` | Simplify to new structure |
| `InstagramTabContent.tsx` | Remove charts, add profile header |
| `InstagramMetricsRow.tsx` | Keep as-is |
| `KeyInsightsRow.tsx` | Remove or repurpose |
| `EngagementSection.tsx` | Simplify - remove benchmark comparisons |
| `types.ts` | Clean up unused fields from `InstagramIntelligenceVM` |

---

## Data Not Being Used

The scraper collects some data that the UI doesn't currently surface:

- `profilePicUrlHD` - Could show avatar in profile header
- `highlightReelCount` - Story highlights count
- `igtvVideoCount` - IGTV videos count
- `isBusinessAccount` - Could show business badge
- `businessAddress` - Address from Instagram
- Post `hashtags` - Could show common hashtags
- Post `displayUrl` - Could show recent post images

These could be added to a richer social section in the future.

---

## Implementation Status (Updated 2026-03-03)

Based on this analysis, the Instagram section was simplified to a **minimal, patient-focused UI** that only shows data we can actually support.

### Current UI Structure

```
┌─────────────────────────────────────────────────────┐
│  [Avatar]  @username  ✓                             │
│            2.1K followers · 100 posts               │
│            ~4 likes · ~1 comments per post          │
│                                                     │
│  "Bio text here..."                                 │
│                                                     │
│  ⓘ Based on recent posts                            │
├─────────────────────────────────────────────────────┤
│  [post] [post] [post] [post] [post] [post]          │
│         (hover shows ❤️ likes  💬 comments)         │
│                                                     │
│           View all posts on Instagram →             │
└─────────────────────────────────────────────────────┘
```

### Components Kept (Minimal)

| Component | Purpose |
|-----------|---------|
| `ProfileHeader.tsx` | Avatar, @handle, verified badge, followers/posts count, avg likes/comments per post, bio, "Based on recent posts" note |
| `PostsSection.tsx` | Grid of recent posts with hover overlay (likes/comments), link to Instagram |
| `InstagramTabContent.tsx` | Combines ProfileHeader + PostsSection |

### Components Removed

| Component | Why Removed | How to Re-add |
|-----------|-------------|---------------|
| `KeyInsightsRow.tsx` | Relied on benchmark comparisons | Need industry benchmark data source |
| `HashtagsSection.tsx` | Not essential for patient decision-making | Import and add to InstagramTabContent |
| `InstagramMetricsRow.tsx` | Redundant - stats now inline in ProfileHeader | Import and add to InstagramTabContent |
| `EngagementSection.tsx` | Redundant - engagement now inline in ProfileHeader | Import and add to InstagramTabContent |
| Follower Growth Chart | Requires `followerHistory[]` - no historical data | Implement periodic re-scraping |
| Posting Activity Chart | Requires `postActivityHistory[]` - no historical data | Implement monthly aggregation |
| Benchmark comparisons | No industry benchmark data source | Need industry averages by category |

### Type Changes

The following fields were removed from `InstagramIntelligenceVM` in `types.ts`:

```ts
// REMOVED - would require periodic re-scraping:
followerHistory?: { month: string; followers: number }[]
postActivityHistory?: { month: string; posts: number }[]

// REMOVED - would require benchmark data source:
engagement.benchmark?: {
  engagementTotalPerPost?: number
  engagementRate?: number
  commentsPerPost?: number
}
```

### Data Currently Displayed

| UI Element | Data Field | Source |
|------------|------------|--------|
| Avatar | `profilePicUrl` | Scraped |
| @handle | `username` | Scraped |
| Verified badge | `verified` | Scraped |
| Followers count | `followersCount` | Scraped |
| Posts count | `postsCount` | Scraped |
| Avg likes per post | `engagement.likesPerPost` | Calculated from 200 posts |
| Avg comments per post | `engagement.commentsPerPost` | Calculated from 200 posts |
| Bio | `biography` | Scraped |
| Post images | `posts[].displayUrl` | Scraped |
| Post likes/comments | `posts[].likesCount`, `posts[].commentsCount` | Scraped |

### To Restore Removed Features

1. **Hashtags section:**
   - Re-create `HashtagsSection.tsx`
   - Add `topHashtags` and `inferredServices` to data model
   - Import and add to `InstagramTabContent.tsx`

2. **Historical data (charts):**
   - Set up periodic Instagram scraping (e.g., weekly/monthly)
   - Store snapshots in a time-series table
   - Aggregate data to populate `followerHistory` and `postActivityHistory`

3. **Benchmark comparisons:**
   - Source industry benchmark data (by category like "Medical & Health")
   - Store benchmarks in a lookup table
   - Populate `engagement.benchmark` field from lookup
