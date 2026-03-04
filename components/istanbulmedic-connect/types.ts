export interface Clinic {
  id: string
  name: string
  location: string
  image: string | null
  specialties: string[]
  languages: string[]
  accreditations: string[]
  trustScore: number
  trustBand?: 'A' | 'B' | 'C' | 'D' | null
  description: string
  rating?: number
  reviewCount?: number
  aiInsight?: string
}

export type Language = "English" | "Turkish" | "Arabic" | "German"
export type Accreditation = "JCI" | "ISO" | "Ministry Licensed"
export type TreatmentType = "Hair Transplant" | "Dental" | "Cosmetic Surgery" | "Eye Surgery" | "Bariatric Surgery"

export interface FilterState {
  searchQuery: string
  location: string
  treatments: Record<TreatmentType, boolean>
  budgetRange: [number, number]
  languages: Record<Language, boolean>
  accreditations: Record<Accreditation, boolean>
  aiMatchScore: number
  minRating: number | null      // null = "Any"
  minReviews: number | null     // null = "Any"
}

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
  likesCount?: number
  commentsCount?: number
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

/** View model for Instagram intelligence data (from import results / DB) */
export interface InstagramIntelligenceVM {
  profileUrl?: string
  username?: string
  fullName?: string
  biography?: string
  profilePicUrl?: string

  followersCount?: number
  followsCount?: number
  postsCount?: number
  highlightsCount?: number
  verified?: boolean
  isBusinessAccount?: boolean
  isPrivate?: boolean
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
  posts?: InstagramPostVM[]

  /** Top hashtags used by this profile */
  topHashtags?: TopHashtag[]

  /** Inferred services from hashtag analysis */
  inferredServices?: string[]

  // NOTE: The following fields were removed because the Instagram scraper
  // only captures a single snapshot - no historical data is available:
  //
  // - followerHistory: { month: string; followers: number }[]
  //   Would require periodic re-scraping to build over time
  //
  // - postActivityHistory: { month: string; posts: number }[]
  //   Would require monthly aggregation over time
  //
  // - engagement.benchmark: { engagementTotalPerPost, engagementRate, commentsPerPost }
  //   Would require an industry benchmark data source
  //
  // See docs/instagram-section-data-support.md for full analysis

  /** Engagement metrics (calculated from recent posts) */
  engagement?: {
    engagementTotalPerPost?: number
    engagementRate?: number
    commentsPerPost?: number
    likesPerPost?: number
  }

  confidence?: {
    positioning?: number
    services?: number
    languages?: number
    geography?: number
    contact?: number
  }
}
