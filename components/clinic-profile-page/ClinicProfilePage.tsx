// ClinicProfilePage.tsx
// The "orchestrator" component that assembles all sections into the full page.
// This is the TOP of the component tree for this page.
//
// === ARCHITECTURE PATTERN ===
// The data flows ONE direction: mockData → ClinicProfilePage → individual sections.
// Each section only receives the "slice" of data it needs (not the entire clinic object).
// This makes each section independently testable and reusable.
//
// === LAYOUT ===
// Two-column layout using CSS Grid:
// - Left column (lg:col-span-2): Main content sections stacked vertically
// - Right column (lg:col-span-1): Sticky sidebar
// The grid switches from 1 column (mobile) to 3 columns (desktop).

"use client";

import { Navbar } from "./Navbar";
import { SectionNav } from "./SectionNav";
import { ClinicHeader } from "./ClinicHeader";
import { ImageGallery } from "./ImageGallery";
import { Sidebar } from "./Sidebar";
import { OverviewSection } from "./OverviewSection";
import { DoctorsSection } from "./DoctorsSection";
import { CommunitySignals } from "./CommunitySignals";
import { TransparencySection } from "./TransparencySection";
import { AIGuidanceSection } from "./AIGuidanceSection";
import { ReviewsSection } from "./ReviewsSection";
import { LocationSection } from "./LocationSection";
import { FloatingCTA } from "./FloatingCTA";
import { CollapsibleSection } from "./CollapsibleSection";
import { clinicData } from "./mockData";

export default function ClinicProfilePage() {
  // In a real app, you'd fetch this data from an API:
  // const { data: clinic } = useSWR(`/api/clinics/${id}`, fetcher);
  // For now, we use the mock data directly.
  const clinic = clinicData;

  return (
    <div className="min-h-screen bg-navy-50 font-body">
      {/* Navbar -- full width, sits above everything */}
      <Navbar />

      {/* Section Navigation -- sticky below navbar */}
      <SectionNav />

      {/* Clinic Header -- full width area for name, rating, tags */}
      <ClinicHeader
        name={clinic.name}
        location={clinic.location}
        rating={clinic.rating}
        reviewCount={clinic.reviewCount}
        specialties={clinic.specialties}
      />

      {/* Main Content Area -- two-column grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <ImageGallery
              images={clinic.images}
              clinicName={clinic.name}
            />

            {/* Overview */}
            <CollapsibleSection id="overview" title="Overview">
              <OverviewSection
                specialties={clinic.specialties}
                yearsInOperation={clinic.yearsInOperation}
                proceduresPerformed={clinic.proceduresPerformed}
                languages={clinic.languages}
                about={clinic.about}
              />
            </CollapsibleSection>

            {/* Doctors */}
            <CollapsibleSection id="doctors" title="Doctors & Medical Team">
              <DoctorsSection doctors={clinic.doctors} />
            </CollapsibleSection>

            {/* Community Signals */}
            <CollapsibleSection id="community" title="Community Signals">
              <CommunitySignals
                posts={clinic.communityPosts}
                summary={clinic.communitySummary}
              />
            </CollapsibleSection>

            {/* Transparency & Safety */}
            <CollapsibleSection id="transparency" title="Transparency & Safety">
              <TransparencySection
                score={clinic.transparencyScore}
                items={clinic.transparencyItems}
                explanation={clinic.transparencyExplanation}
              />
            </CollapsibleSection>

            {/* AI Guidance */}
            <CollapsibleSection id="ai-guidance" title="AI Guidance from Leila">
              <AIGuidanceSection insights={clinic.aiInsights} />
            </CollapsibleSection>

            {/* Reviews */}
            <CollapsibleSection id="reviews" title="Reviews & Community Signals">
              <ReviewsSection
                rating={clinic.rating}
                reviewCount={clinic.reviewCount}
                commonlyMentioned={clinic.commonlyMentioned}
                reviews={clinic.reviews}
              />
            </CollapsibleSection>

            {/* Location & Practical Info */}
            <CollapsibleSection id="location" title="Location & Practical Info">
              <LocationSection
                address={clinic.address}
                openingHours={clinic.openingHours}
                languages={[...clinic.languages, "Russian"]}
                paymentMethods={clinic.paymentMethods}
                additionalServices={clinic.additionalServices}
              />
            </CollapsibleSection>
          </div>

          {/* RIGHT COLUMN: Sticky sidebar */}
          <div className="lg:col-span-1">
            <Sidebar
              transparencyScore={clinic.transparencyScore}
              specialties={clinic.specialties}
            />
          </div>
        </div>
      </div>

      {/* Floating CTA -- fixed position, always visible */}
      <FloatingCTA />
    </div>
  );
}
