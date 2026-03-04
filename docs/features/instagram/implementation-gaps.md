# Instagram Implementation Gaps

## Current State

The Instagram UI components are built and use mock data (`MOCK_INSTAGRAM_DATA` in `ClinicProfilePage.tsx`). The Apify scraper collects all the data we need, but some fields aren't being stored in the database.

---

## Gap 1: Missing Database Columns

### `clinic_social_media` - add columns:
```sql
ALTER TABLE clinic_social_media
  ADD COLUMN IF NOT EXISTS profile_pic_url text,
  ADD COLUMN IF NOT EXISTS biography text,
  ADD COLUMN IF NOT EXISTS full_name varchar,
  ADD COLUMN IF NOT EXISTS external_urls text[];
```

### `clinic_instagram_posts` - add column:
```sql
ALTER TABLE clinic_instagram_posts
  ADD COLUMN IF NOT EXISTS display_url text;
```

---

## Gap 2: Import Endpoint Not Storing Fields

**File:** `/app/api/import/instagram/route.ts`

### Update `clinic_social_media` upsert (lines 306-327):
Add these fields to the upsert object:
```typescript
profile_pic_url: instagramData.instagram.profilePicUrl ?? null,
biography: instagramData.instagram.biography ?? null,
full_name: instagramData.instagram.fullName ?? null,
external_urls: instagramData.instagram.externalUrls ?? [],
```

### Update `clinic_instagram_posts` upsert (lines 384-400):
Add this field to each post row:
```typescript
display_url: p.displayUrl ?? null,
```

---

## What Apify Scraper Provides (all available)

| Field | Type | Collected? | Stored? |
|-------|------|------------|---------|
| `profilePicUrl` | string | ✅ | ❌ |
| `biography` | string | ✅ | ❌ |
| `fullName` | string | ✅ | ❌ |
| `externalUrls` | string[] | ✅ | ❌ |
| `displayUrl` (per post) | string | ✅ | ❌ |
| `username` | string | ✅ | ✅ |
| `followersCount` | number | ✅ | ✅ |
| `postsCount` | number | ✅ | ✅ |
| `verified` | boolean | ✅ | ✅ |
| `likesCount` (per post) | number | ✅ | ✅ |
| `commentsCount` (per post) | number | ✅ | ✅ |

---

## Next Steps: Backend Integration

**Assuming the migration and endpoint updates are done**, implement these to wire up the UI to real data:

### Step 1: Create fetch function

**File to create:** `/lib/api/instagram.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import type { InstagramIntelligenceVM, InstagramPostVM } from '@/components/istanbulmedic-connect/types'

export async function getClinicInstagramData(clinicId: string): Promise<InstagramIntelligenceVM | null> {
  const supabase = await createClient()

  // 1. Fetch from clinic_social_media
  const { data: socialMedia } = await supabase
    .from('clinic_social_media')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('platform', 'instagram')
    .single()

  if (!socialMedia) return null

  // 2. Fetch recent posts from clinic_instagram_posts
  const { data: posts } = await supabase
    .from('clinic_instagram_posts')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('posted_at', { ascending: false })
    .limit(6)

  // 3. Fetch engagement facts from clinic_facts
  const { data: facts } = await supabase
    .from('clinic_facts')
    .select('fact_key, fact_value')
    .eq('clinic_id', clinicId)
    .in('fact_key', [
      'instagram_avg_likes_per_post',
      'instagram_avg_comments_per_post'
    ])

  // 4. Transform to InstagramIntelligenceVM
  return transformToInstagramVM(socialMedia, posts, facts)
}
```

### Step 2: Create transformer

**Add to `/lib/api/instagram.ts`:**

```typescript
function transformToInstagramVM(
  socialMedia: any,
  posts: any[] | null,
  facts: any[] | null
): InstagramIntelligenceVM {
  const factsMap = (facts ?? []).reduce((acc, f) => {
    acc[f.fact_key] = f.fact_value
    return acc
  }, {} as Record<string, any>)

  return {
    profileUrl: `https://instagram.com/${socialMedia.account_handle}`,
    username: socialMedia.account_handle,
    fullName: socialMedia.full_name,
    biography: socialMedia.biography,
    profilePicUrl: socialMedia.profile_pic_url,
    followersCount: socialMedia.follower_count,
    followsCount: socialMedia.follows_count,
    postsCount: socialMedia.posts_count,
    highlightsCount: socialMedia.highlights_count,
    verified: socialMedia.verified,
    isBusinessAccount: true,
    isPrivate: socialMedia.is_private,
    businessCategoryName: socialMedia.business_category,
    externalUrls: socialMedia.external_urls ?? [],
    lastSeenAt: socialMedia.last_checked_at,

    posts: (posts ?? []).map(p => ({
      id: p.instagram_post_id,
      type: p.post_type,
      shortCode: p.short_code,
      url: p.url,
      caption: p.caption,
      hashtags: p.hashtags ?? [],
      likesCount: p.likes_count,
      commentsCount: p.comments_count,
      timestamp: p.posted_at,
      displayUrl: p.display_url,
    })),

    engagement: {
      likesPerPost: factsMap.instagram_avg_likes_per_post ?? null,
      commentsPerPost: factsMap.instagram_avg_comments_per_post ?? null,
    },
  }
}
```

### Step 3: Update ClinicProfilePage

**File:** `/components/istanbulmedic-connect/profile/ClinicProfilePage.tsx`

1. Remove `MOCK_INSTAGRAM_DATA` constant
2. Pass real data from the clinic detail page

**Option A:** Add Instagram data to existing clinic detail fetch (in `/lib/api/clinics.ts`)

**Option B:** Fetch Instagram data separately in the page component

### Step 4: Update clinic detail API (if using Option A)

**File:** `/lib/api/clinics.ts`

Add Instagram data to the `getClinicDetail` function by calling `getClinicInstagramData(clinicId)` and including it in the response.

---

## Data Flow (After Implementation)

```
ClinicProfilePage
  ↓
getClinicDetail() or getClinicInstagramData()
  ↓
Supabase queries:
  - clinic_social_media (profile info)
  - clinic_instagram_posts (recent posts)
  - clinic_facts (engagement metrics)
  ↓
transformToInstagramVM()
  ↓
InstagramIntelligenceVM
  ↓
InstagramIntelligenceSection → ProfileHeader + PostsSection
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `/lib/api/instagram.ts` | CREATE - fetch function + transformer |
| `/lib/api/clinics.ts` | MODIFY - include Instagram data in clinic detail |
| `/components/.../ClinicProfilePage.tsx` | MODIFY - remove mock data, use real data |

---

## Testing

Once implemented, test with a clinic that has Instagram data imported:

1. Check that profile header shows real avatar, username, followers, bio
2. Check that posts grid shows real post images
3. Check that engagement stats (avg likes/comments) display correctly
4. Check empty state works for clinics without Instagram data
