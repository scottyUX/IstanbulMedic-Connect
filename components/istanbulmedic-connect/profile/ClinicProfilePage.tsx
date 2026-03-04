"use client"

import { HeroSection } from "./HeroSection"
import { SectionNav } from "./SectionNav"
import { OverviewSection } from "./OverviewSection"
import { PricingSection } from "./PricingSection"
import { PackagesSection } from "./PackagesSection"
import { DoctorsSection } from "./DoctorsSection"
import { TransparencySection } from "./TransparencySection"
import { AIInsightsSection } from "./AIInsightsSection"
import { ReviewsSection } from "./ReviewsSection"
import { normalizeReviewSource } from "@/lib/review-sources"
import { CommunitySignalsSection } from "./CommunitySignalsSection"
import { InstagramIntelligenceSection } from "./InstagramIntelligenceSection"
import { LocationInfoSection } from "./LocationInfoSection"
import { SummarySidebar } from "./SummarySidebar"
import type { ClinicDetail } from "@/lib/api/clinics"
import type { InstagramIntelligenceVM } from "@/components/istanbulmedic-connect/types"
import {
  toNumber,
  transformOpeningHours,
  deriveServicesFromPackages,
  type OpeningHoursJson,
} from "@/lib/transformers/clinic"
import { FEATURE_CONFIG } from "@/lib/filterConfig"

type CommunityPostSource = "reddit" | "instagram" | "google" | "facebook" | "youtube" | "forums" | "other"
type CommunitySentiment = "Positive" | "Neutral" | "Negative"

interface ClinicProfilePageProps {
  clinic: ClinicDetail
}

const SOURCE_TYPE_MAP: Record<string, CommunityPostSource> = {
  reddit: "reddit",
  forum: "forums",
  quora: "forums",
  social_media: "other",
  review_platform: "google",
  clinic_website: "other",
  registry: "other",
  mystery_inquiry: "other",
  internal_note: "other",
}

// TODO: Replace with real data from Supabase once clinic_social_profiles table is created
// This is MOCK DATA for UI development purposes only
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
    {
      id: "3779400337086510947",
      type: "Image",
      shortCode: "DRzIJUcCHdj",
      url: "https://www.instagram.com/p/DRzIJUcCHdj/",
      caption: "Before and after transformation",
      hashtags: ["hairtransplant", "fue", "istanbul"],
      likesCount: 12,
      commentsCount: 2,
      timestamp: "2025-11-28T14:30:00.000Z",
      displayUrl: "/results/new2_after.jpg",
      alt: "Before and after hair transplant",
    },
    {
      id: "3779400337086510948",
      type: "Video",
      shortCode: "DRzIJUcCHdk",
      url: "https://www.instagram.com/p/DRzIJUcCHdk/",
      caption: "Watch the procedure in action",
      hashtags: ["hairtransplant", "fue", "procedure"],
      likesCount: 8,
      commentsCount: 1,
      timestamp: "2025-11-20T09:15:00.000Z",
      displayUrl: "/results/new3_after.jpg",
      alt: "Hair transplant procedure video",
    },
    {
      id: "3779400337086510949",
      type: "Image",
      shortCode: "DRzIJUcCHdl",
      url: "https://www.instagram.com/p/DRzIJUcCHdl/",
      caption: "Our state-of-the-art facility",
      hashtags: ["clinic", "istanbul", "medicaltourism"],
      likesCount: 15,
      commentsCount: 3,
      timestamp: "2025-11-15T16:45:00.000Z",
      displayUrl: "/results/new4_after.jpg",
      alt: "Clinic facility",
    },
    {
      id: "3779400337086510950",
      type: "Sidecar",
      shortCode: "DRzIJUcCHdm",
      url: "https://www.instagram.com/p/DRzIJUcCHdm/",
      caption: "Multiple angles of amazing results",
      hashtags: ["hairtransplant", "results", "transformation"],
      likesCount: 20,
      commentsCount: 4,
      timestamp: "2025-11-10T11:00:00.000Z",
      displayUrl: "/results/new5_after.jpg",
      alt: "Multiple angle results",
    },
    {
      id: "3779400337086510951",
      type: "Image",
      shortCode: "DRzIJUcCHdn",
      url: "https://www.instagram.com/p/DRzIJUcCHdn/",
      caption: "Happy patient testimonial",
      hashtags: ["testimonial", "happypatient", "hairtransplant"],
      likesCount: 18,
      commentsCount: 2,
      timestamp: "2025-11-05T13:30:00.000Z",
      displayUrl: "/results/new6_after.jpg",
      alt: "Patient testimonial",
    },
  ],
  topHashtags: [
    { tag: "hairtransplant", count: 85 },
    { tag: "istanbulmedic", count: 78 },
    { tag: "medicaltravel", count: 72 },
    { tag: "fue", count: 45 },
    { tag: "hairrestoration", count: 38 },
    { tag: "istanbul", count: 35 },
    { tag: "turkey", count: 30 },
    { tag: "beforeafter", count: 28 },
  ],
  inferredServices: ["hair_transplant", "medical_travel"],
  // NOTE: followerHistory and postActivityHistory removed - scraper only captures snapshot
  // NOTE: engagement.benchmark removed - no industry benchmark data source
  engagement: {
    engagementTotalPerPost: 4.2,
    engagementRate: 0.002,
    commentsPerPost: 0.17,
    likesPerPost: 4.0,
  },
  confidence: {
    positioning: 85,
    services: 80,
    languages: 0,
    geography: 75,
    contact: 90,
  },
}

export const ClinicProfilePage = ({ clinic }: ClinicProfilePageProps) => {
  // Transform database data to component format

  // Get languages from clinic_languages
  const languages = clinic.languages.map((l) => l.language)

  // Get specialties from services
  const specialties: string[] = [
    ...clinic.services.filter((s) => s.is_primary_service).map((s) => s.service_name as string),
    ...clinic.services.filter((s) => !s.is_primary_service).map((s) => s.service_category as string),
  ].filter((v, i, a) => a.indexOf(v) === i)

  // Transform team members to doctors format
  const doctors = clinic.team
    .filter((t) => ["medical_director", "surgeon", "doctor"].includes(t.role))
    .map((t) => ({
      name: t.name,
      specialty: t.role.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      photo: t.photo_url || null,
      credentials: t.credentials ? [t.credentials] : [],
      yearsOfExperience: t.years_experience,
      education: null, // No fake "Medical School" - show only if we have real data
    }))

  // Transform credentials to transparency items (no fake defaults)
  const transparencyItems = clinic.credentials.map((c) => ({
    title: c.credential_name,
    description: c.issuing_body || `${c.credential_type} credential`,
    verified: true,
  }))

  // Transform reviews (no fake fallbacks)
  const allReviews = clinic.reviews.map((r) => {
    const ratingMatch = r.rating?.match(/(\d+)/)
    const ratingNum = ratingMatch ? parseInt(ratingMatch[1]) : null
    return {
      author: "Patient", // Anonymous but real
      rating: ratingNum ?? 0, // Rating component requires number, 0 means unrated
      date: r.review_date ?? "Unknown date",
      text: r.review_text,
      verified: true,
      source: normalizeReviewSource(r.sources?.source_name ?? "other"),
    }
  })

  // Get primary location
  const primaryLocation = clinic.locations.find((l) => l.is_primary) || clinic.locations[0]

  const imageMedia = clinic.media
    .filter((m) => m.media_type === "image")
    .sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1
      if (!a.is_primary && b.is_primary) return 1
      return (a.display_order ?? 0) - (b.display_order ?? 0)
    })
    .map((m) => m.url)
  const heroImages = imageMedia

  // Build AI insights from score components (no fake defaults)
  const aiInsights = clinic.scoreComponents.map((sc) => sc.explanation)

  const factsMap = clinic.facts.reduce<Record<string, unknown>>((acc, fact) => {
    acc[fact.fact_key] = fact.fact_value
    return acc
  }, {})

  // Use database fields first, fall back to facts, no fake fallbacks
  const yearsInOperation = clinic.yearsInOperation ?? toNumber(factsMap.years_in_operation) ?? null
  const proceduresPerformed = clinic.proceduresPerformed ?? toNumber(factsMap.total_procedures_completed) ?? null

  // Transform opening hours from clinic_facts (key: opening_hours)
  // Handle both direct value and { value: ... } wrapper formats
  const openingHoursRaw = factsMap.opening_hours as OpeningHoursJson | { value: OpeningHoursJson } | null
  const openingHoursData = openingHoursRaw && typeof openingHoursRaw === 'object' && 'value' in openingHoursRaw
    ? (openingHoursRaw as { value: OpeningHoursJson }).value
    : openingHoursRaw as OpeningHoursJson | null
  const openingHours = transformOpeningHours(openingHoursData)

  // Transform payment methods from primary location
  const paymentMethods: string[] = Array.isArray(primaryLocation?.payment_methods)
    ? primaryLocation.payment_methods.filter((m): m is string => typeof m === "string")
    : []

  // Derive services from packages
  const services = deriveServicesFromPackages(clinic.packages)

  const topicLabels: Record<string, string> = {
    pricing: "Pricing transparency",
    results: "Results quality",
    staff: "Staff professionalism",
    logistics: "Logistics",
    complaint: "Concerns",
    praise: "Praise",
    package_accuracy: "Package accuracy",
  }

  const posts = clinic.mentions.map((mention) => {
    const source =
      Array.isArray(mention.sources) ? mention.sources[0] : mention.sources
    const sourceType = source?.source_type ?? "other"
    const sourceName = source?.source_name ?? "Community"
    const url = source?.url ?? "#"
    const author = source?.author_handle ?? sourceName
    const date = mention.created_at
      ? new Date(mention.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Recent"

    return {
      source: SOURCE_TYPE_MAP[sourceType] ?? "other",
      author,
      date,
      snippet: mention.mention_text,
      url,
      topic: mention.topic,
      sentiment: mention.sentiment,
    }
  })

  const sentimentCounts = posts.reduce(
    (acc, post) => {
      if (post.sentiment === "positive") acc.positive += 1
      if (post.sentiment === "negative") acc.negative += 1
      if (post.sentiment === "neutral") acc.neutral += 1
      return acc
    },
    { positive: 0, negative: 0, neutral: 0 }
  )

  const overallSentiment: CommunitySentiment =
    sentimentCounts.positive > sentimentCounts.negative
      ? "Positive"
      : sentimentCounts.negative > sentimentCounts.positive
        ? "Negative"
        : "Neutral"

  const commonThemes = posts
    .map((post) => topicLabels[post.topic] ?? "Other")
    .filter((value, index, self) => self.indexOf(value) === index)
    .slice(0, 3)

  const communitySignals = {
    posts: posts.map((post) => ({
      source: post.source,
      author: post.author,
      date: post.date,
      snippet: post.snippet,
      url: post.url,
    })),
    summary: {
      totalMentions: posts.length,
      sentiment: overallSentiment,
      commonThemes, // No fake fallback
    },
    instagramIntelligence: {
      profileUrl: "https://instagram.com/istanbulhaircenter",
      username: "istanbulhaircenter",
      fullName: "Istanbul Hair Center",
      biography:
        "Leading hair transplant clinic in Istanbul. Premium FUE & DHI specialists with 15+ years experience. Natural results. International patients welcome.",
      followersCount: 12500,
      postsCount: 342,
      verified: true,
      isBusinessAccount: true,
      businessCategoryName: "Medical & Health",
      externalUrls: [
        "https://linktr.ee/istanbulhaircenter",
        "https://istanbulhaircenter.com",
      ],
      extracted: {
        positioningClaims: [
          "Premium FUE",
          "DHI specialists",
          "15+ years experience",
        ],
        servicesClaimed: [
          "Hair transplant",
          "Beard transplant",
          "PRP therapy",
        ],
        geographyClaimed: ["Istanbul", "Turkey", "Europe"],
        languagesClaimed: ["English", "Turkish", "Arabic", "German"],
        addressText: "Halaskargazi Cad. No: 124, Şişli",
        websiteCandidates: ["https://istanbulhaircenter.com"],
        linkAggregatorDetected: "linktr.ee",
      },
      firstSeenAt: "2025-01-15T00:00:00Z",
      lastSeenAt: "2026-02-01T00:00:00Z",
    },
  }

  return (
    <div className="min-h-screen bg-background text-base antialiased">
      {/* Hero Section */}
      <HeroSection
        clinicName={clinic.name}
        location={clinic.location}
        images={heroImages}
        transparencyScore={clinic.trustScore}
        rating={clinic.rating ?? null}
        reviewCount={clinic.totalReviewCount}
      />

      {/* Section Navigation */}
      <SectionNav />

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content Column */}
          <div className="space-y-6 lg:col-span-2">
            {FEATURE_CONFIG.profileOverview && (
              <OverviewSection
                specialties={specialties}
                yearsInOperation={yearsInOperation}
                proceduresPerformed={proceduresPerformed}
                languages={languages}
                description={clinic.description}
              />
            )}

            <LocationInfoSection
              address={primaryLocation?.address_line || clinic.location}
              lat={primaryLocation?.latitude ?? null}
              lng={primaryLocation?.longitude ?? null}
              openingHours={openingHours}
              languages={languages}
              paymentMethods={paymentMethods}
              services={services}
            />

            {FEATURE_CONFIG.profilePricing && (
              <PricingSection pricing={clinic.pricing} />
            )}

            {FEATURE_CONFIG.profilePackages && (
              <PackagesSection packages={clinic.packages} />
            )}

            {FEATURE_CONFIG.profileDoctors && doctors.length > 0 && (
              <DoctorsSection doctors={doctors} />
            )}

            {FEATURE_CONFIG.profileTransparency && (
              <TransparencySection
                transparencyScore={clinic.trustScore}
                items={transparencyItems}
              />
            )}

            {FEATURE_CONFIG.profileAIInsights && (
              <AIInsightsSection insights={aiInsights} />
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <SummarySidebar
              transparencyScore={clinic.trustScore}
              topSpecialties={specialties.slice(0, 3)}
              rating={clinic.rating ?? null}
              reviewCount={clinic.totalReviewCount}
            />
          </div>
        </div>

        {/* Full Width Sections */}
        <div className="mt-12 space-y-12 w-full">
          <ReviewsSection
            averageRating={clinic.rating ?? null}
            totalReviews={clinic.totalReviewCount}
            reviews={allReviews}
          />

          {FEATURE_CONFIG.profileCommunitySignals && (
            <CommunitySignalsSection
              posts={communitySignals.posts}
              summary={communitySignals.summary}
            />
          )}

          {FEATURE_CONFIG.profileInstagram && (
            <InstagramIntelligenceSection data={MOCK_INSTAGRAM_DATA} />
          )}
        </div>
      </div>
    </div>
  )
}
