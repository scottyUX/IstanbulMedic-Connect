"use client"

import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { HeroSection } from "./HeroSection"
import { OverviewSection } from "./OverviewSection"
import { DoctorsSection } from "./DoctorsSection"
import { TransparencySection } from "./TransparencySection"
import { AIInsightsSection } from "./AIInsightsSection"
import { ReviewsSection } from "./ReviewsSection"
import { CommunitySignalsSection } from "./CommunitySignalsSection"
import { LocationInfoSection } from "./LocationInfoSection"
import { SummarySidebar } from "./SummarySidebar"

type CommunityPostSource = "reddit" | "instagram" | "other"
type CommunitySentiment = "Positive" | "Neutral" | "Negative"

interface ClinicProfilePageProps {
  clinicId: number
  onBack: () => void
}

export const ClinicProfilePage = ({ clinicId, onBack }: ClinicProfilePageProps) => {
  // This would normally fetch data based on clinicId.
  // For now, we preserve the prototype behavior with a local data object.
  void clinicId

  const clinicData = {
    name: "Istanbul Hair Center",
    locationLabel: "Şişli, Istanbul",
    transparencyScore: 96,
    rating: 4.8,
    reviewCount: 347,
    images: [
      "https://images.unsplash.com/photo-1565262353342-6e919eab5b58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBtZWRpY2FsJTIwY2xpbmljJTIwaW50ZXJpb3IlMjBsb2JieXxlbnwxfHx8fDE3NzAxNTQ5MTF8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1758653500534-a47f6cd8abb0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3NwaXRhbCUyMG9wZXJhdGluZyUyMHJvb20lMjBtb2Rlcm58ZW58MXx8fHwxNzcwMTU0OTEzfDA&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1766299892549-b56b257d1ddd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwZXF1aXBtZW50JTIwY2xpbmljfGVufDF8fHx8MTc3MDEzNzE2NHww&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1720180244339-95e56d52e182?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3NwaXRhbCUyMGNsaW5pYyUyMGludGVyaW9yfGVufDF8fHx8MTc3MDEwMDAwN3ww&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    overview: {
      specialties: ["Hair Transplant", "FUE Technique", "DHI Method", "Beard Transplant"],
      yearsInOperation: 15,
      proceduresPerformed: 12000,
      languages: ["English", "Turkish", "Arabic", "German"],
      description:
        "Istanbul Hair Center is a leading hair restoration facility specializing in advanced FUE and DHI techniques. With over 15 years of experience and more than 12,000 successful procedures, our clinic combines cutting-edge technology with personalized patient care. Our internationally trained team is committed to delivering natural-looking results while maintaining the highest standards of safety and medical excellence.",
    },
    doctors: [
      {
        name: "Dr. Mehmet Yilmaz",
        specialty: "Hair Restoration Surgeon",
        photo:
          "https://images.unsplash.com/photo-1755189118414-14c8dacdb082?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBkb2N0b3IlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzAxMDYxMTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
        credentials: ["Board Certified", "ISHRS Member"],
        yearsOfExperience: 18,
        education: "Istanbul University Medical School",
      },
      {
        name: "Dr. Ayşe Demir",
        specialty: "Dermatologist & Hair Specialist",
        photo:
          "https://images.unsplash.com/photo-1632054224477-c9cb3aae1b7e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZW1hbGUlMjBkb2N0b3IlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzcwMDYzNzQ5fDA&ixlib=rb-4.1.0&q=80&w=1080",
        credentials: ["Dermatology Board Certified", "Trichology Specialist"],
        yearsOfExperience: 12,
        education: "Hacettepe University",
      },
      {
        name: "Dr. Can Öztürk",
        specialty: "Cosmetic & Hair Surgeon",
        photo:
          "https://images.unsplash.com/photo-1758206523685-6e69f80a11ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxtZWRpY2FsJTIwcHJvZmVzc2lvbmFsJTIwbWFsZXxlbnwxfHx8fDE3NzAxNTQ5MTN8MA&ixlib=rb-4.1.0&q=80&w=1080",
        credentials: ["Board Certified Surgeon", "International Training"],
        yearsOfExperience: 10,
        education: "Ankara University Medical School",
      },
    ],
    transparency: {
      items: [
        {
          title: "Verified Medical Licenses",
          description: "All physicians licensed by Turkish Ministry of Health",
          verified: true,
        },
        {
          title: "International Accreditations",
          description: "JCI accredited facility with ISO 9001 certification",
          verified: true,
        },
        {
          title: "Hospital Affiliations",
          description: "Partner agreements with major Istanbul hospitals",
          verified: true,
        },
        {
          title: "Clear Procedure Documentation",
          description: "Detailed treatment protocols and informed consent processes",
          verified: true,
        },
        {
          title: "Before/After Case Transparency",
          description: "Extensive photo documentation with patient consent",
          verified: true,
        },
        {
          title: "Published Outcomes Data",
          description: "Regular reporting of success rates and patient satisfaction",
          verified: true,
        },
      ],
    },
    aiInsights: [
      "Strong documentation of surgical procedures with comprehensive pre-operative planning and post-operative care protocols.",
      "Well-suited for patients seeking minimally invasive hair restoration options with FUE and DHI techniques.",
      "High patient satisfaction scores in follow-up care, with dedicated support staff for international patients.",
      "Advanced technology integration including microscopic graft preparation and sapphire blade techniques.",
    ],
    reviews: {
      averageRating: 4.8,
      totalReviews: 347,
      communityTags: ["Helpful staff", "Clear communication", "Natural results", "Good aftercare"],
      recentReviews: [
        {
          author: "James Mitchell",
          rating: 5,
          date: "January 15, 2026",
          text: "Exceptional care from start to finish. Dr. Yilmaz took the time to explain every step of the procedure and the results exceeded my expectations. The staff was incredibly helpful with travel arrangements and translation.",
          verified: true,
        },
        {
          author: "Ahmed Al-Rahman",
          rating: 5,
          date: "January 8, 2026",
          text: "Very professional clinic with modern facilities. The team speaks excellent English and Arabic which made communication easy. Follow-up care has been thorough and responsive.",
          verified: true,
        },
        {
          author: "Thomas Weber",
          rating: 4,
          date: "December 28, 2025",
          text: "Great experience overall. The clinic is well-organized and the medical team is highly skilled. Would recommend for anyone considering hair restoration in Istanbul.",
          verified: true,
        },
      ],
    },
    communitySignals: {
      posts: [
        {
          source: "reddit" as CommunityPostSource,
          date: "2 days ago",
          snippet:
            "Had my consultation at Istanbul Hair Center last week. The doctor was thorough and explained everything in detail. Prices were competitive and transparent. Scheduling my procedure for next month.",
          url: "#",
        },
        {
          source: "reddit" as CommunityPostSource,
          date: "1 week ago",
          snippet:
            "Just finished my 6-month follow-up. Really happy with the results so far. The clinic staff has been responsive to all my questions via WhatsApp. Would definitely recommend.",
          url: "#",
        },
        {
          source: "reddit" as CommunityPostSource,
          date: "2 weeks ago",
          snippet:
            "Comparing clinics in Istanbul for hair transplant. Istanbul Hair Center seems to have good credentials and the doctors have international training. Anyone have recent experience?",
          url: "#",
        },
        {
          source: "instagram" as CommunityPostSource,
          date: "3 days ago",
          snippet:
            "Amazing transformation! 8 months post-op and couldn't be happier. Thank you to the entire team @istanbulhaircenter for the professional care and support throughout the journey. #hairtransplant #istanbul",
          url: "#",
        },
        {
          source: "instagram" as CommunityPostSource,
          date: "1 week ago",
          snippet:
            "Day 1 post-procedure. Feeling great! The team made me feel comfortable and the clinic is spotless. Can't wait to see the final results. #medicaltourism #turkey",
          url: "#",
        },
        {
          source: "other" as CommunityPostSource,
          date: "5 days ago",
          snippet:
            "Article: Medical Tourism in Istanbul - Istanbul Hair Center ranks among top facilities for FUE procedures with high patient satisfaction rates and comprehensive aftercare programs.",
          url: "#",
        },
      ],
      summary: {
        totalMentions: 89,
        sentiment: "Positive" as CommunitySentiment,
        commonThemes: ["Clear pricing", "Professional communication", "Quality aftercare"],
      },
    },
    location: {
      address: "Halaskargazi Cad. No: 124, Şişli, Istanbul 34371, Turkey",
      mapImageUrl:
        "https://images.unsplash.com/photo-1687325599804-b770b48dfc5b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpc3RhbmJ1bCUyMG1hcCUyMHN0cmVldCUyMGNpdHl8ZW58MXx8fHwxNzcwMzM2OTcxfDA&ixlib=rb-4.1.0&q=80&w=1080",
      openingHours: [
        { day: "Monday - Friday", hours: "9:00 AM - 6:00 PM" },
        { day: "Saturday", hours: "9:00 AM - 3:00 PM" },
        { day: "Sunday", hours: "Closed" },
      ],
      languages: ["English", "Turkish", "Arabic", "German", "Russian"],
      paymentMethods: ["Credit Card", "Bank Transfer", "Cash", "Cryptocurrency"],
      services: {
        accommodation: true,
        airportTransfer: true,
      },
    },
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb / Back Button */}
      <div className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="gap-2 px-0 text-muted-foreground hover:text-primary"
            aria-label="Back to Explore Clinics"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Explore Clinics
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <HeroSection
        clinicName={clinicData.name}
        location={clinicData.locationLabel}
        images={clinicData.images}
        transparencyScore={clinicData.transparencyScore}
        rating={clinicData.rating}
        reviewCount={clinicData.reviewCount}
        specialties={clinicData.overview.specialties}
      />

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content Column */}
          <div className="space-y-6 lg:col-span-2">
            <OverviewSection
              specialties={clinicData.overview.specialties}
              yearsInOperation={clinicData.overview.yearsInOperation}
              proceduresPerformed={clinicData.overview.proceduresPerformed}
              languages={clinicData.overview.languages}
              description={clinicData.overview.description}
            />

            <DoctorsSection doctors={clinicData.doctors} />

            <TransparencySection
              transparencyScore={clinicData.transparencyScore}
              items={clinicData.transparency.items}
            />

            <AIInsightsSection insights={clinicData.aiInsights} />

            <ReviewsSection
              averageRating={clinicData.reviews.averageRating}
              totalReviews={clinicData.reviews.totalReviews}
              reviews={clinicData.reviews.recentReviews}
              communityTags={clinicData.reviews.communityTags}
            />

            <CommunitySignalsSection
              posts={clinicData.communitySignals.posts}
              summary={clinicData.communitySignals.summary}
            />

            <LocationInfoSection
              address={clinicData.location.address}
              mapImageUrl={clinicData.location.mapImageUrl}
              openingHours={clinicData.location.openingHours}
              languages={clinicData.location.languages}
              paymentMethods={clinicData.location.paymentMethods}
              services={clinicData.location.services}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <SummarySidebar
              transparencyScore={clinicData.transparencyScore}
              topSpecialties={clinicData.overview.specialties.slice(0, 3)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

