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
import { InstagramSignalsCard } from "./InstagramSignalsCard"
import { HRNSignalsCard } from "./HRNSignalsCard"
import { RedditSignalsCard } from "./RedditSignalsCard"
import { LocationInfoSection } from "./LocationInfoSection"
import { SummarySidebar } from "./SummarySidebar"
import { ScoreBreakdownCard } from "./ScoreBreakdownCard"
import type { ClinicDetail } from "@/lib/api/clinics"
import {
  toNumber,
  transformOpeningHours,
  deriveServicesFromPackages,
  type OpeningHoursJson,
} from "@/lib/transformers/clinic"
import { FEATURE_CONFIG } from "@/lib/filterConfig"
import type { RegistryRecord, ComplianceEvent } from "./RegistrySection"
import { RegistrySection } from "./RegistrySection"

interface ClinicProfilePageProps {
  clinic: ClinicDetail
  registryRecords: RegistryRecord[]
  complianceHistory: ComplianceEvent[]
}


export const ClinicProfilePage = ({ clinic, registryRecords, complianceHistory }: ClinicProfilePageProps) => {
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
      verifiedQualifications: t.qualifications.map((q) => ({
        qualification: q.qualification,
        source: q.source,
        sourceUrl: q.source_url,
        verifiedAt: q.verified_at,
      })),
      lastVerifiedAt: t.last_verified_at,
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

  const isMinistryVerified = registryRecords.some(
    (record) =>
      record.source === "turkish_ministry_of_health" &&
      record.license_status === "active"
  )
  const hasActiveMOHRecord = isMinistryVerified

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


  return (
    <div className="min-h-screen bg-background text-base antialiased" data-testid="clinic-profile">
      {/* Hero Section */}
      <HeroSection
        clinicName={clinic.name}
        location={clinic.location}
        images={heroImages}
        transparencyScore={clinic.trustScore}
        trustBand={clinic.trustBand}
        rating={clinic.rating ?? null}
        reviewCount={clinic.totalReviewCount}
        isMinistryVerified={isMinistryVerified}
        sourceScores={clinic.sourceScores}
      />

      {/* Section Navigation */}
      <SectionNav />

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content Column */}
          <div className="space-y-6 lg:col-span-2">
            <ScoreBreakdownCard
              overallScore={clinic.trustScore}
              band={clinic.trustBand}
              scoreComponents={clinic.scoreComponents}
              sourceScores={clinic.sourceScores}
            />
            {FEATURE_CONFIG.profileOverview && (clinic.description || (clinic.techniques ?? []).length > 0) && (
              <OverviewSection
                specialties={specialties}
                yearsInOperation={yearsInOperation}
                proceduresPerformed={proceduresPerformed}
                languages={languages}
                description={clinic.description ?? ''}
                techniques={clinic.techniques ?? []}
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

            {FEATURE_CONFIG.profileDoctors && (
              <DoctorsSection doctors={doctors} />
            )}

            {FEATURE_CONFIG.profileTransparency && (
              <TransparencySection
                transparencyScore={clinic.trustScore}
                items={transparencyItems}
              />
            )}
            {FEATURE_CONFIG.profileRegistry && !hasActiveMOHRecord && (
              <RegistrySection
                registryRecords={registryRecords}
                complianceHistory={complianceHistory}
              />
            )}

            {FEATURE_CONFIG.profileAIInsights && (
              <AIInsightsSection insights={aiInsights} />
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <SummarySidebar
              clinicId={clinic.id}
              clinicName={clinic.name}
              clinicLocation={clinic.location}
              clinicImageUrl={clinic.image}
              rating={clinic.rating ?? null}
              reviewCount={clinic.totalReviewCount}
              websiteUrl={clinic.websiteUrl}
              trustScore={clinic.trustScore}
              trustBand={clinic.trustBand}
              sourceScores={clinic.sourceScores}
            />
          </div>
        </div>
  

        {/* Full Width Sections */}
        <div className="mt-12 space-y-12 w-full">
          <ReviewsSection
            averageRating={clinic.rating ?? null}
            totalReviews={clinic.totalReviewCount}
            reviews={allReviews}
            googleScore={clinic.sourceScores?.find((s) => s.source_name === "google" && s.is_current)?.summary_score ?? null}
          />


          {FEATURE_CONFIG.profileInstagram && clinic.instagramSignals && (
            <div id="instagram-intel" className="scroll-mt-32">
              <InstagramSignalsCard data={clinic.instagramSignals} />
            </div>
          )}

          {FEATURE_CONFIG.profileHRN && clinic.hrnSignals && (
            <div id="hrn-signals" className="scroll-mt-32">
              <HRNSignalsCard data={clinic.hrnSignals} />
            </div>
          )}

          {FEATURE_CONFIG.profileRedditSignals && clinic.redditSignals && (
            <div id="reddit-signals" className="scroll-mt-32">
              <RedditSignalsCard data={clinic.redditSignals} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
