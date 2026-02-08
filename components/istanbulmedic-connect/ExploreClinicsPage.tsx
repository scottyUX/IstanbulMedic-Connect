"use client"

import { Search } from "lucide-react"
import { useMemo, useState } from "react"

import { ClinicCard } from "@/components/istanbulmedic-connect/ClinicCard"
import { UnifiedFilterBar } from "@/components/istanbulmedic-connect/UnifiedFilterBar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import type { Clinic, FilterState, TreatmentType } from "@/components/istanbulmedic-connect/types"

const CLINICS: Clinic[] = [
  {
    id: 1,
    name: "Istanbul Hair Center",
    location: "Şişli, Istanbul",
    image:
      "https://images.unsplash.com/photo-1720180244339-95e56d52e182?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3NwaXRhbCUyMGNsaW5pYyUyMGludGVyaW9yfGVufDF8fHx8MTc3MDEwMDAwN3ww&ixlib=rb-4.1.0&q=80&w=1080",
    specialties: ["Hair Transplant", "FUE", "DHI"],
    trustScore: 96,
    description:
      "Leading hair restoration clinic with over 15 years of experience and 10,000+ successful procedures.",
    rating: 4.9,
    aiInsight: "Strong documentation and high patient-reported outcomes.",
  },
  {
    id: 2,
    name: "Dental Excellence Istanbul",
    location: "Beşiktaş, Istanbul",
    image:
      "https://images.unsplash.com/photo-1764004450351-37fb72cb8e8c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZW50YWwlMjBjbGluaWMlMjBtb2Rlcm58ZW58MXx8fHwxNzcwMTEwMzAxfDA&ixlib=rb-4.1.0&q=80&w=1080",
    specialties: ["Dental Implants", "Veneers", "Cosmetic"],
    trustScore: 94,
    description:
      "Premium dental care with CAD/CAM technology and internationally trained specialists.",
    rating: 4.8,
    aiInsight: "Comprehensive pre-treatment planning and post-care support.",
  },
  {
    id: 3,
    name: "Aesthetic Plus Clinic",
    location: "Nişantaşı, Istanbul",
    image:
      "https://images.unsplash.com/photo-1763887487088-469f68e3d68c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3NtZXRpYyUyMHN1cmdlcnklMjBjbGluaWN8ZW58MXx8fHwxNzcwMTU0MjkyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    specialties: ["Cosmetic Surgery", "Rhinoplasty", "Liposuction"],
    trustScore: 92,
    description:
      "Board-certified plastic surgeons offering natural-looking results with personalized care.",
    rating: 4.7,
    aiInsight: "Transparent pricing and detailed before-and-after documentation.",
  },
  {
    id: 4,
    name: "Medista Health Group",
    location: "Kadıköy, Istanbul",
    image:
      "https://images.unsplash.com/photo-1762625570087-6d98fca29531?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxtZWRpY2FsJTIwY2xpbmljJTIwcmVjZXB0aW9uJTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc3MDEzNDkzNnww&ixlib=rb-4.1.0&q=80&w=1080",
    specialties: ["Multi-specialty", "Eye Surgery", "Orthopedics"],
    trustScore: 95,
    description:
      "Comprehensive healthcare facility with JCI accreditation and multilingual staff.",
    rating: 4.9,
    aiInsight: "Excellent safety protocols and verified medical credentials.",
  },
  {
    id: 5,
    name: "Elite Vision Center",
    location: "Levent, Istanbul",
    image:
      "https://images.unsplash.com/photo-1758691463626-0ab959babe00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxtZWRpY2FsJTIwcHJvZmVzc2lvbmFsJTIwZG9jdG9yfGVufDF8fHx8MTc3MDE1NDI5M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    specialties: ["LASIK", "Eye Surgery", "Cataract"],
    trustScore: 93,
    description:
      "State-of-the-art eye care with the latest laser technology and experienced ophthalmologists.",
    rating: 4.8,
    aiInsight: "Advanced diagnostic equipment and published success rates.",
  },
  {
    id: 6,
    name: "Istanbul Wellness Hospital",
    location: "Beyoğlu, Istanbul",
    image:
      "https://images.unsplash.com/photo-1769147555720-71fc71bfc216?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxob3NwaXRhbCUyMGJ1aWxkaW5nJTIwbW9kZXJufGVufDF8fHx8MTc3MDA4NTE4Mnww&ixlib=rb-4.1.0&q=80&w=1080",
    specialties: ["Bariatric Surgery", "Weight Loss", "Wellness"],
    trustScore: 91,
    description:
      "Specialized obesity treatment center with comprehensive aftercare and nutrition programs.",
    rating: 4.7,
    aiInsight: "Strong follow-up care and patient education programs.",
  },
]

interface ExploreClinicsPageProps {
  onSelectClinic: (clinicId: number) => void
}

export const ExploreClinicsPage = ({ onSelectClinic }: ExploreClinicsPageProps) => {
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: "",
    location: "Istanbul, Turkey",
    treatments: {
      "Hair Transplant": false,
      "Dental": false,
      "Cosmetic Surgery": false,
      "Eye Surgery": false,
      "Bariatric Surgery": false,
    },
    budgetRange: [500, 12000],
    languages: {
      English: true,
      Turkish: false,
      Arabic: false,
      German: false,
    },
    accreditations: {
      JCI: false,
      ISO: false,
      "Ministry Licensed": true,
    },
    aiMatchScore: 75,
  })

  const [sortBy, setSortBy] = useState("Best Match")

  const filteredClinics = useMemo(() => {
    return CLINICS.filter((clinic) => {
      // 1. Search Query (Name or Specialty)
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        const matchesName = clinic.name.toLowerCase().includes(query)
        const matchesSpecialty = clinic.specialties.some((s) => s.toLowerCase().includes(query))
        if (!matchesName && !matchesSpecialty) return false
      }

      // 2. Location (simple includes check for now)
      if (filters.location && !clinic.location.toLowerCase().includes(filters.location.toLowerCase())) {
        // Being lenient for demo purposes if location is generic like "Istanbul"
        if (!filters.location.toLowerCase().includes("istanbul")) {
          // If user types specific location that doesn't match, filter out
          // otherwise keep all Istanbul clinics
        }
      }

      // 3. Treatments (Checkboxes)
      const selectedTreatments = (Object.keys(filters.treatments) as TreatmentType[])
        .filter((t) => filters.treatments[t])

      if (selectedTreatments.length > 0) {
        // If any treatment is selected, clinic must match at least one (OR logic) 
        // OR clinic must have "Multi-specialty"
        const matchesTreatment = selectedTreatments.some(t =>
          clinic.specialties.some(s => s.toLowerCase().includes(t.toLowerCase()) || s === "Multi-specialty")
        )
        if (!matchesTreatment) return false
      }

      // 4. Budget (Mock logic since clinics don't have prices in data)
      // In a real app, we'd check clinic.priceRange

      // 5. Trust Score / AI Match
      if (clinic.trustScore < filters.aiMatchScore) return false

      return true
    })
  }, [filters])

  const handleSearch = () => {
    // Trigger any side effects if needed, currently filtering is reactive
    console.log("Searching with filters:", filters)
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Banner */}
      <div className="bg-[#FEFCF8] border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-8 lg:py-12">
          <div className="space-y-6">
            {/* Headline */}
            <div className="text-center lg:text-left">
              <h1
                className="text-4xl font-bold leading-tight text-[#0D1E32] lg:text-6xl"
                style={{ fontFamily: "var(--im-font-heading), serif" }}
              >
                Connect with a Trusted Hair Transplant Clinic
              </h1>
              <p className="mt-4 text-xl text-muted-foreground max-w-3xl">
                We know how overwhelming it can be to choose the right clinic for your hair transplant. That’s why we’re here to take the stress away—connecting you with qualified clinics in seconds, completely free and with no obligations.
              </p>
            </div>

            {/* Unified Filter Bar */}
            <div className="mt-8">
              <UnifiedFilterBar
                filters={filters}
                onFilterChange={setFilters}
                onSearch={handleSearch}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="mx-auto max-w-7xl px-4 py-8">

        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-foreground">
            {filteredClinics.length} clinics available
          </h2>

          <div className="flex items-center gap-2">
            <span className="text-base text-muted-foreground">Sort by:</span>
            <div className="relative">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] h-9 bg-white" aria-label="Sort clinics">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Best Match">Best Match</SelectItem>
                  <SelectItem value="Highest Rated">Highest Rated</SelectItem>
                  <SelectItem value="Most Transparent">Most Transparent</SelectItem>
                  <SelectItem value="Price: Low to High">Price: Low to High</SelectItem>
                  <SelectItem value="Price: High to Low">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Clinic Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClinics.length > 0 ? (
            filteredClinics.map((clinic) => (
              <ClinicCard
                key={clinic.id}
                {...clinic}
                onViewProfile={() => onSelectClinic(clinic.id)}
              />
            ))
          ) : (
            <div className="col-span-full py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium">No clinics found</h3>
              <p className="mt-2 text-base text-muted-foreground">
                Try adjusting your filters or search terms.
              </p>
              <Button
                variant="link"
                onClick={() => setFilters({
                  ...filters,
                  searchQuery: "",
                  treatments: {
                    "Hair Transplant": false, "Dental": false, "Cosmetic Surgery": false, "Eye Surgery": false, "Bariatric Surgery": false
                  }
                })}
                className="mt-2"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>

        {/* Load More */}
        {filteredClinics.length > 0 && (
          <div className="mt-12 text-center">
            <Button variant="outline" size="lg" className="min-w-[200px]" onClick={() => { }}>
              Load More Clinics
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
