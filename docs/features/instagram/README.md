# Instagram Section Implementation Guide

This document contains all the changes needed to implement the Instagram Intelligence section with proper mock data that matches the actual backend API structure.

---

## Overview

The Instagram section displays:
1. **ProfileHeader** - Profile pic, username, bio, follower/following stats
2. **KeyInsightsRow** - 3 insight cards with smart calculations
3. **PostsSection** - Grid of recent posts with hover overlay
4. **HashtagsSection** - Top hashtags and inferred services
5. **InstagramMetricsRow** - Key metrics (followers, posts, engagement rate)
6. **EngagementSection** - Comparison metrics vs benchmark

---

## Files to Create/Modify

### 1. Update `next.config.ts`

Add Instagram CDN domains to allow images:

```ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // ... existing patterns ...
      // Instagram CDN domains for profile pics and posts
      {
        protocol: "https",
        hostname: "**.cdninstagram.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.fbcdn.net",
        pathname: "/**",
      },
    ],
  },
};
```

---

### 2. Update `components/istanbulmedic-connect/types.ts`

Add these new types before `InstagramIntelligenceVM`:

```ts
/** Instagram post type from backend */
export type InstagramPostType = "Image" | "Video" | "Sidecar"

/** Comment on an Instagram post */
export interface InstagramComment {
  id: string
  text: string
  ownerUsername: string
  timestamp: string
  likesCount: number
  repliesCount?: number
  replies?: InstagramComment[]
}

/** Instagram post data from clinic_instagram_posts table */
export interface InstagramPostVM {
  id: string
  type: InstagramPostType
  shortCode: string
  url: string
  caption?: string
  hashtags: string[]
  likesCount: number
  commentsCount: number
  firstComment?: string
  latestComments?: InstagramComment[]
  timestamp: string
  displayUrl?: string
  alt?: string
}

/** Top hashtag with frequency count */
export interface TopHashtag {
  tag: string
  count: number
}
```

Update `InstagramIntelligenceVM` to include new fields:

```ts
/** View model for Instagram intelligence data (from import results / DB) */
export interface InstagramIntelligenceVM {
  profileUrl?: string
  username?: string
  fullName?: string
  biography?: string
  profilePicUrl?: string  // NEW

  followersCount?: number
  followsCount?: number   // NEW
  postsCount?: number
  highlightsCount?: number  // NEW
  verified?: boolean
  isBusinessAccount?: boolean
  isPrivate?: boolean  // NEW
  businessCategoryName?: string

  externalUrls?: string[]

  extracted?: {
    positioningClaims?: string[]
    servicesClaimed?: string[]
    languagesClaimed?: string[]
    geographyClaimed?: string[]
    addressText?: string
    websiteCandidates?: string[]
    linkAggregatorDetected?: string
  }

  firstSeenAt?: string
  lastSeenAt?: string

  /** Sample posts from the profile (top posts by engagement) */
  posts?: InstagramPostVM[]  // NEW

  /** Top hashtags used by this profile */
  topHashtags?: TopHashtag[]  // NEW

  /** Inferred services from hashtag analysis */
  inferredServices?: string[]  // NEW

  /** Monthly follower counts */
  followerHistory?: { month: string; followers: number }[]
  /** Monthly post counts */
  postActivityHistory?: { month: string; posts: number }[]

  /** Engagement metrics (clinic vs benchmark) */
  engagement?: {
    engagementTotalPerPost?: number
    engagementRate?: number
    commentsPerPost?: number
    likesPerPost?: number  // NEW
    benchmark?: {
      engagementTotalPerPost?: number
      engagementRate?: number
      commentsPerPost?: number
    }
  }

  confidence?: {
    positioning?: number
    services?: number
    languages?: number
    geography?: number
    contact?: number
  }
}
```

---

### 3. Create `components/istanbulmedic-connect/profile/instagram/ProfileHeader.tsx`

```tsx
"use client"

import { BadgeCheck, ExternalLink, Globe, Lock, Briefcase } from "lucide-react"
import Image from "next/image"
import type { InstagramIntelligenceVM } from "@/components/istanbulmedic-connect/types"
import { formatNumber } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface ProfileHeaderProps {
  data: InstagramIntelligenceVM
}

export function ProfileHeader({ data }: ProfileHeaderProps) {
  const {
    profilePicUrl,
    username,
    fullName,
    biography,
    verified,
    isBusinessAccount,
    isPrivate,
    businessCategoryName,
    followersCount,
    followsCount,
    postsCount,
    highlightsCount,
    externalUrls,
    profileUrl,
  } = data

  const primaryUrl = externalUrls?.[0]

  return (
    <div className="flex flex-col gap-6 rounded-lg border border-border/60 bg-card p-6 sm:flex-row sm:items-start">
      {/* Profile Picture */}
      <div className="flex-shrink-0">
        {profilePicUrl ? (
          <div className="relative h-20 w-20 overflow-hidden rounded-full ring-2 ring-border/60 sm:h-24 sm:w-24">
            <Image
              src={profilePicUrl}
              alt={fullName || username || "Profile"}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 text-2xl font-bold text-white sm:h-24 sm:w-24">
            {(fullName || username || "?").charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Profile Info */}
      <div className="flex-1 space-y-3">
        {/* Username & Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={profileUrl || `https://instagram.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-semibold text-foreground hover:underline"
          >
            @{username}
          </a>
          {verified && (
            <span title="Verified account">
              <BadgeCheck className="h-5 w-5 text-blue-500" fill="currentColor" />
            </span>
          )}
          {isPrivate && (
            <span
              className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
              title="Private account"
            >
              <Lock className="h-3 w-3" />
              Private
            </span>
          )}
          {isBusinessAccount && (
            <span
              className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary"
              title="Business account"
            >
              <Briefcase className="h-3 w-3" />
              Business
            </span>
          )}
        </div>

        {/* Full Name & Category */}
        {(fullName || businessCategoryName) && (
          <div className="space-y-0.5">
            {fullName && (
              <p className="text-sm font-medium text-foreground">{fullName}</p>
            )}
            {businessCategoryName && (
              <p className="text-xs text-muted-foreground">{businessCategoryName}</p>
            )}
          </div>
        )}

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {postsCount != null && (
            <div>
              <span className="font-semibold text-foreground">{formatNumber(postsCount)}</span>{" "}
              <span className="text-muted-foreground">posts</span>
            </div>
          )}
          {followersCount != null && (
            <div>
              <span className="font-semibold text-foreground">{formatNumber(followersCount)}</span>{" "}
              <span className="text-muted-foreground">followers</span>
            </div>
          )}
          {followsCount != null && (
            <div>
              <span className="font-semibold text-foreground">{formatNumber(followsCount)}</span>{" "}
              <span className="text-muted-foreground">following</span>
            </div>
          )}
          {highlightsCount != null && highlightsCount > 0 && (
            <div>
              <span className="font-semibold text-foreground">{highlightsCount}</span>{" "}
              <span className="text-muted-foreground">highlights</span>
            </div>
          )}
        </div>

        {/* Biography */}
        {biography && (
          <p className="whitespace-pre-line text-sm text-foreground/90">{biography}</p>
        )}

        {/* External Link */}
        {primaryUrl && (
          <a
            href={primaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Globe className="h-3.5 w-3.5" />
            {primaryUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  )
}
```

---

### 4. Create `components/istanbulmedic-connect/profile/instagram/PostsSection.tsx`

```tsx
"use client"

import { ExternalLink, Heart, MessageCircle, Play, Images } from "lucide-react"
import { ReportSection } from "@/components/ui/report-section"
import type { InstagramPostVM } from "@/components/istanbulmedic-connect/types"
import { formatNumber } from "@/lib/utils"
import Image from "next/image"

interface PostsSectionProps {
  posts?: InstagramPostVM[]
  username?: string
}

function PostTypeIcon({ type }: { type: InstagramPostVM["type"] }) {
  if (type === "Video") {
    return <Play className="h-4 w-4 text-white drop-shadow-md" fill="white" />
  }
  if (type === "Sidecar") {
    return <Images className="h-4 w-4 text-white drop-shadow-md" />
  }
  return null
}

function PostCard({ post }: { post: InstagramPostVM }) {
  const imageUrl = post.displayUrl || "/hero/landing_hero_new.png"

  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative aspect-square overflow-hidden rounded-lg bg-muted transition-all hover:ring-2 hover:ring-primary/50"
    >
      <Image
        src={imageUrl}
        alt={post.alt || post.caption?.slice(0, 50) || "Instagram post"}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      />

      {post.type !== "Image" && (
        <div className="absolute right-2 top-2">
          <PostTypeIcon type={post.type} />
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex items-center gap-1 text-white">
          <Heart className="h-5 w-5" fill="white" />
          <span className="text-sm font-semibold">{formatNumber(post.likesCount)}</span>
        </div>
        <div className="flex items-center gap-1 text-white">
          <MessageCircle className="h-5 w-5" fill="white" />
          <span className="text-sm font-semibold">{formatNumber(post.commentsCount)}</span>
        </div>
      </div>
    </a>
  )
}

export function PostsSection({ posts, username }: PostsSectionProps) {
  if (!posts || posts.length === 0) {
    return null
  }

  const profileUrl = username ? `https://instagram.com/${username}` : null

  return (
    <ReportSection
      title="Recent Posts"
      description="Sample of recent Instagram posts from this clinic profile."
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {posts.slice(0, 6).map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {profileUrl && (
        <div className="mt-4 flex justify-center">
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            View all posts on Instagram
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}
    </ReportSection>
  )
}
```

---

### 5. Create `components/istanbulmedic-connect/profile/instagram/HashtagsSection.tsx`

```tsx
"use client"

import { Hash } from "lucide-react"
import { ReportSection } from "@/components/ui/report-section"
import type { TopHashtag } from "@/components/istanbulmedic-connect/types"
import { cn } from "@/lib/utils"

interface HashtagsSectionProps {
  hashtags?: TopHashtag[]
  inferredServices?: string[]
}

function HashtagPill({ tag, count, maxCount }: { tag: string; count: number; maxCount: number }) {
  const ratio = count / maxCount
  const sizeClass = ratio > 0.7 ? "text-sm" : ratio > 0.4 ? "text-xs" : "text-[11px]"

  return (
    <a
      href={`https://instagram.com/explore/tags/${tag}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary",
        sizeClass
      )}
    >
      <Hash className="h-3 w-3" />
      {tag}
      <span className="ml-0.5 text-[10px] text-muted-foreground/60">({count})</span>
    </a>
  )
}

function ServiceBadge({ service }: { service: string }) {
  const formatted = service
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  return (
    <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
      {formatted}
    </span>
  )
}

export function HashtagsSection({ hashtags, inferredServices }: HashtagsSectionProps) {
  if ((!hashtags || hashtags.length === 0) && (!inferredServices || inferredServices.length === 0)) {
    return null
  }

  const maxCount = hashtags?.[0]?.count || 1

  return (
    <ReportSection
      title="Content Signals"
      description="Hashtags and topics frequently used in this clinic's Instagram posts."
    >
      <div className="space-y-6">
        {inferredServices && inferredServices.length > 0 && (
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Inferred Services
            </h4>
            <div className="flex flex-wrap gap-2">
              {inferredServices.map((service) => (
                <ServiceBadge key={service} service={service} />
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground/80">
              Derived from hashtag patterns. Confidence: moderate.
            </p>
          </div>
        )}

        {hashtags && hashtags.length > 0 && (
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Top Hashtags
            </h4>
            <div className="flex flex-wrap gap-2">
              {hashtags.slice(0, 12).map((h) => (
                <HashtagPill key={h.tag} tag={h.tag} count={h.count} maxCount={maxCount} />
              ))}
            </div>
          </div>
        )}
      </div>
    </ReportSection>
  )
}
```

---

### 6. Update `components/istanbulmedic-connect/profile/instagram/InstagramTabContent.tsx`

Add imports for the new components:

```tsx
import { ProfileHeader } from "./ProfileHeader"
import { PostsSection } from "./PostsSection"
import { HashtagsSection } from "./HashtagsSection"
```

Update the return JSX to include the new sections:

```tsx
return (
  <div className="space-y-8">
    {/* Last Updated */}
    {data.lastSeenAt && (
      <div className="im-text-body-xs im-text-muted">
        Last updated: {formatDate(data.lastSeenAt)}
      </div>
    )}

    {/* Profile Header */}
    <ProfileHeader data={data} />

    {/* Key Insights */}
    <KeyInsightsRow data={data} />

    {/* Recent Posts Grid */}
    <PostsSection posts={data.posts} username={data.username} />

    {/* Content Signals (Hashtags & Inferred Services) */}
    <HashtagsSection
      hashtags={data.topHashtags}
      inferredServices={data.inferredServices}
    />

    {/* Audience Metrics */}
    <ReportSection
      title="Audience"
      description="Who's behind the profile. Follower count and post volume signal reach and activity level."
    >
      <InstagramMetricsRow data={data} />
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LineChartCard
          title="Follower Growth"
          icon={LineChartIcon}
          data={followerData}
          dataKeyX="month"
          dataKeyY="followers"
          config={followerChartConfig}
        />
        <BarChartCard
          title="Posting Activity"
          icon={Calendar}
          data={postData}
          dataKeyX="month"
          dataKeyY="posts"
          config={postChartConfig}
        />
      </div>
    </ReportSection>

    {/* Engagement Comparison */}
    <EngagementSection data={data} />
  </div>
)
```

---

### 7. Update `KeyInsightsRow.tsx`

Replace with the updated version that uses smart calculations based on actual data structure. See the full file in the backup repo at:
`components/istanbulmedic-connect/profile/instagram/KeyInsightsRow.tsx`

Key changes:
- Added severity-based coloring (positive/neutral/warning)
- Smart insight generation based on engagement, audience size, and content signals
- Uses `topHashtags` and `inferredServices` data

---

### 8. Update `InstagramMetricsRow.tsx`

Add new metrics for:
- Following count
- Engagement rate
- Highlights count

See the full file in the backup repo.

---

### 9. Update `EngagementSection.tsx`

- Better handling of empty engagement data
- Shows likes per post if available
- Improved empty state

---

### 10. Update Mock Data in `ClinicProfilePage.tsx`

Replace `MOCK_INSTAGRAM_DATA` with realistic data that matches the API structure:

```tsx
const MOCK_INSTAGRAM_DATA: InstagramIntelligenceVM = {
  profileUrl: "https://www.instagram.com/istanbulmedic",
  username: "istanbulmedic",
  fullName: "IstanbulMedic",
  biography: "IstanbulMedic is accredited medical travel expert in Turkey.",
  profilePicUrl: "https://scontent-sjc6-1.cdninstagram.com/v/t51.2885-19/40276107_1026305597540543_875196665705791488_n.jpg",
  followersCount: 2139,
  followsCount: 77,
  postsCount: 100,
  highlightsCount: 9,
  verified: false,
  isBusinessAccount: true,
  isPrivate: false,
  businessCategoryName: "Medical & Health",
  externalUrls: ["https://linktr.ee/istanbulmedic"],
  extracted: {
    positioningClaims: ["accredited"],
    servicesClaimed: ["medical travel"],
    languagesClaimed: [],
    geographyClaimed: ["Kadikoy"],
    addressText: "Caferaga Mahallesi, Moda Caddesi No: 72 Daire:5, Kadikoy",
    websiteCandidates: ["https://linktr.ee/istanbulmedic"],
    linkAggregatorDetected: "linktr.ee",
  },
  firstSeenAt: "2026-02-15T00:00:00Z",
  lastSeenAt: "2026-02-22T00:00:00Z",
  posts: [
    {
      id: "3779400337086510946",
      type: "Image",
      shortCode: "DRzIJUcCHdi",
      url: "https://www.instagram.com/p/DRzIJUcCHdi/",
      caption: "Real patient with a real growth. Your journey can be next.",
      hashtags: ["istanbulmedic", "medicaltravel", "hairtransplant"],
      likesCount: 4,
      commentsCount: 0,
      timestamp: "2025-12-03T11:00:50.000Z",
      displayUrl: "/results/new1_after.jpg",
      alt: "Hair transplant results",
    },
    // Add more posts as needed...
  ],
  topHashtags: [
    { tag: "hairtransplant", count: 85 },
    { tag: "istanbulmedic", count: 78 },
    { tag: "medicaltravel", count: 72 },
    { tag: "fue", count: 45 },
    { tag: "hairrestoration", count: 38 },
  ],
  inferredServices: ["hair_transplant", "medical_travel"],
  engagement: {
    engagementTotalPerPost: 4.2,
    engagementRate: 0.002,
    commentsPerPost: 0.17,
    likesPerPost: 4.0,
    benchmark: {
      engagementTotalPerPost: 360,
      engagementRate: 0.047,
      commentsPerPost: 12,
    },
  },
  confidence: {
    positioning: 85,
    services: 80,
    languages: 0,
    geography: 75,
    contact: 90,
  },
}
```

---

## Summary of Changes

| File | Action |
|------|--------|
| `next.config.ts` | Add Instagram CDN domains |
| `types.ts` | Add `InstagramPostVM`, `TopHashtag`, `InstagramComment` types; update `InstagramIntelligenceVM` |
| `ProfileHeader.tsx` | **CREATE** - Profile display component |
| `PostsSection.tsx` | **CREATE** - Posts grid component |
| `HashtagsSection.tsx` | **CREATE** - Hashtags and inferred services |
| `InstagramTabContent.tsx` | Update to include new components |
| `KeyInsightsRow.tsx` | Update with smart calculations |
| `InstagramMetricsRow.tsx` | Update with new metrics |
| `EngagementSection.tsx` | Update with better empty states |
| `ClinicProfilePage.tsx` | Update mock data to match API structure |

---

## Backend Integration (Next Step)

Once the UI is working with mock data, the next step is to:

1. Create a transformer in `lib/transformers/instagram.ts` to map DB data to `InstagramIntelligenceVM`
2. Fetch data from `clinic_social_media`, `clinic_instagram_posts`, and `clinic_facts` tables
3. Replace `MOCK_INSTAGRAM_DATA` with real data fetched from Supabase
