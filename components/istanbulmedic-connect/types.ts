export interface Clinic {
  id: number
  name: string
  location: string
  image: string
  specialties: string[]
  trustScore: number
  description: string
  rating?: number
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
}

/** View model for Instagram intelligence data (from import results / DB) */
export interface InstagramIntelligenceVM {
  profileUrl?: string
  username?: string
  fullName?: string
  biography?: string

  followersCount?: number
  postsCount?: number
  verified?: boolean
  isBusinessAccount?: boolean
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

  /** Monthly follower counts (e.g. [{ month: "2025-07", followers: 7800 }]) */
  followerHistory?: { month: string; followers: number }[]
  /** Monthly post counts (e.g. [{ month: "2025-07", posts: 42 }]) */
  postActivityHistory?: { month: string; posts: number }[]

  /** Engagement metrics (clinic vs benchmark) */
  engagement?: {
    engagementTotalPerPost?: number
    engagementRate?: number
    commentsPerPost?: number
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
