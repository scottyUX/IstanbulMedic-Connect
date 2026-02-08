"use client"

import { ChevronDown, Search } from "lucide-react"
import { useMemo, useState } from "react"

import { ClinicCard } from "@/components/istanbulmedic-connect/ClinicCard"
import { FilterPanel } from "@/components/istanbulmedic-connect/FilterPanel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import type { Clinic } from "@/components/istanbulmedic-connect/types"

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
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("Best Match")
  const [treatmentSearch, setTreatmentSearch] = useState("")
  const [location, setLocation] = useState("Istanbul, Turkey")
  const [insurance, setInsurance] = useState("")

  const filteredClinics = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return CLINICS
    return CLINICS.filter((clinic) => clinic.name.toLowerCase().includes(query))
  }, [searchQuery])

  const handleFindClinics = () => {
    // Handle search logic here
    if (treatmentSearch) {
      setSearchQuery(treatmentSearch)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner - Zocdoc Style */}
      <div className="bg-[#FEFCF8] border-b border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
          <div className="space-y-8">
            {/* Headline */}
            <div>
              <h1
                className="text-4xl font-bold leading-tight text-[#0D1E32] lg:text-5xl"
                style={{ fontFamily: "var(--im-font-heading), serif" }}
              >
                Find trusted clinics
                <br />
                in Istanbul
              </h1>
            </div>

            {/* Search Form - Full Width (12 columns) */}
            <div className="bg-white rounded-xl border border-border/60 shadow-sm p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                {/* Treatment Search */}
                <div className="sm:col-span-4">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Search
                  </label>
                  <Input
                    value={treatmentSearch}
                    onChange={(e) => setTreatmentSearch(e.target.value)}
                    placeholder="Treatment or clinic name"
                    className="h-11"
                    aria-label="Search for treatment or clinic"
                  />
                </div>

                {/* Location */}
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Location
                  </label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-11 font-semibold"
                    aria-label="Location"
                  />
                </div>

                {/* Insurance/Budget */}
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Budget
                  </label>
                  <Input
                    value={insurance}
                    onChange={(e) => setInsurance(e.target.value)}
                    placeholder="Optional"
                    className="h-11"
                    aria-label="Budget range"
                  />
                </div>

                {/* Find Button */}
                <div className="sm:col-span-2 flex items-end">
                  <Button
                    onClick={handleFindClinics}
                    className="h-11 w-full bg-[#FFD700] hover:bg-[#FFC700] text-[#0D1E32] font-semibold rounded-lg shadow-sm"
                    aria-label="Find clinics"
                  >
                    <Search className="h-4 w-4" />
                    Find
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Below-hero: Title + Filters (12-col) */}
      <div className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <h2 className="text-2xl font-bold text-foreground">
            Explore Clinics in Istanbul
          </h2>
          <p className="mt-2 text-muted-foreground">
            Browse verified clinics evaluated using transparency and trust
            signals. All facilities are vetted for quality, safety, and patient
            satisfaction.
          </p>

          <div className="mt-6">
            <FilterPanel />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Search */}
        <div className="mb-6 rounded-xl border border-border/60 bg-card p-4 text-card-foreground shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clinics by name..."
              className="h-11 pl-10"
              aria-label="Search clinics by name"
            />
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 bg-card p-4 text-card-foreground shadow-sm">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {filteredClinics.length}
            </span>{" "}
            clinics found
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <div className="relative">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[200px]" aria-label="Sort clinics">
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
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Clinic Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {filteredClinics.length > 0 ? (
            filteredClinics.map((clinic) => (
              <ClinicCard
                key={clinic.id}
                {...clinic}
                onViewProfile={() => onSelectClinic(clinic.id)}
              />
            ))
          ) : (
            <div className="col-span-2 rounded-xl border border-border/60 bg-card p-12 text-center text-card-foreground shadow-sm">
              <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
              <h3 className="text-lg font-medium">No clinics found</h3>
              <p className="mt-2 text-muted-foreground">
                We couldn&apos;t find any clinics matching &quot;{searchQuery}&quot;
              </p>
              <Button
                variant="link"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="mt-4"
              >
                Clear search
              </Button>
            </div>
          )}
        </div>

        {/* Load More */}
        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => {}} aria-label="Load more clinics">
            Load More Clinics
          </Button>
        </div>
      </div>
    </div>
  )
}

