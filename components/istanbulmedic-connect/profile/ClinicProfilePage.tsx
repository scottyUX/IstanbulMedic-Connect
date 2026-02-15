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
import { CommunitySignalsSection } from "./CommunitySignalsSection"
import { LocationInfoSection } from "./LocationInfoSection"
import { SummarySidebar } from "./SummarySidebar"
import type { ClinicDetail } from "@/lib/api/clinics"
import {
  toNumber,
  transformOpeningHours,
  deriveServicesFromPackages,
  deriveCommunityTags,
  type OpeningHoursJson,
} from "@/lib/transformers/clinic"

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
  const recentReviews = clinic.reviews.slice(0, 4).map((r) => {
    const ratingMatch = r.rating?.match(/(\d+)/)
    const ratingNum = ratingMatch ? parseInt(ratingMatch[1]) : null
    return {
      author: "Patient", // Anonymous but real
      rating: ratingNum ?? 0, // Rating component requires number, 0 means unrated
      date: r.review_date ?? "Unknown date",
      text: r.review_text,
      verified: true,
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

  // Transform opening hours from primary location
  const openingHours = transformOpeningHours(primaryLocation?.opening_hours as OpeningHoursJson | null)

  // Transform payment methods from primary location
  const paymentMethods: string[] = Array.isArray(primaryLocation?.payment_methods)
    ? primaryLocation.payment_methods.filter((m): m is string => typeof m === "string")
    : []

  // Derive services from packages
  const services = deriveServicesFromPackages(clinic.packages)

  // Derive community tags from positive mentions
  const communityTags = deriveCommunityTags(clinic.mentions)

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
        reviewCount={clinic.reviews.length}
      />

      {/* Section Navigation */}
      <SectionNav />

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content Column */}
          <div className="space-y-6 lg:col-span-2">
            <OverviewSection
              specialties={specialties}
              yearsInOperation={yearsInOperation}
              proceduresPerformed={proceduresPerformed}
              languages={languages}
              description={clinic.description}
            />

            <PricingSection pricing={clinic.pricing} />

            <PackagesSection packages={clinic.packages} />

            {doctors.length > 0 && <DoctorsSection doctors={doctors} />}

            <TransparencySection
              transparencyScore={clinic.trustScore}
              items={transparencyItems}
            />

            <AIInsightsSection insights={aiInsights} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <SummarySidebar
              transparencyScore={clinic.trustScore}
              topSpecialties={specialties.slice(0, 3)}
              rating={clinic.rating ?? null}
              reviewCount={clinic.reviews.length}
            />
          </div>
        </div>

        {/* Full Width Sections */}
        <div className="mt-12 space-y-12 w-full">
          <ReviewsSection
            averageRating={clinic.rating ?? null}
            totalReviews={clinic.reviews.length}
            reviews={recentReviews}
            communityTags={communityTags}
          />

          <CommunitySignalsSection
            posts={communitySignals.posts}
            summary={communitySignals.summary}
          />

          <LocationInfoSection
            address={primaryLocation?.address_line || clinic.location}
            lat={primaryLocation?.latitude ?? null}
            lng={primaryLocation?.longitude ?? null}
            openingHours={openingHours}
            languages={languages}
            paymentMethods={paymentMethods}
            services={services}
          />
        </div>
      </div>
    </div>
  )
}
