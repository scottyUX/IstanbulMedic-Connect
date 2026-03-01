"use client"

import { Search } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { ClinicCard } from "@/components/istanbulmedic-connect/ClinicCard"
import { UnifiedFilterBar } from "@/components/istanbulmedic-connect/UnifiedFilterBar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import type {
  Accreditation,
  Clinic,
  FilterState,
  Language,
  TreatmentType,
} from "@/components/istanbulmedic-connect/types"
import type { ClinicSortOption } from "@/lib/api/clinics"
import { SORT_CONFIG } from "@/lib/filterConfig"

interface ExploreClinicsPageProps {
  initialClinics: Clinic[]
  totalCount: number
  page: number
  pageSize: number
  initialFilters: FilterState
  initialSort: ClinicSortOption
}

const buildQueryString = (filters: FilterState, sortBy: ClinicSortOption, page: number) => {
  const params = new URLSearchParams()

  if (filters.searchQuery.trim()) params.set("q", filters.searchQuery.trim())
  if (filters.location.trim()) params.set("location", filters.location.trim())

  const selectedTreatments = (Object.keys(filters.treatments) as TreatmentType[])
    .filter((t) => filters.treatments[t])
  if (selectedTreatments.length > 0) {
    params.set("treatments", selectedTreatments.join(","))
  }

  const selectedLanguages = (Object.keys(filters.languages) as Language[])
    .filter((lang) => filters.languages[lang])
  if (selectedLanguages.length > 0) {
    params.set("languages", selectedLanguages.join(","))
  }

  const selectedAccreditations = (Object.keys(filters.accreditations) as Accreditation[])
    .filter((acc) => filters.accreditations[acc])
  if (selectedAccreditations.length > 0) {
    params.set("accreditations", selectedAccreditations.join(","))
  }

  if (filters.aiMatchScore !== 0) {
    params.set("minScore", String(filters.aiMatchScore))
  }

  if (filters.minRating !== null) {
    params.set("minRating", String(filters.minRating))
  }

  if (filters.minReviews !== null) {
    params.set("minReviews", String(filters.minReviews))
  }

  if (sortBy && sortBy !== "Best Match") {
    params.set("sort", sortBy)
  }

  if (page > 1) {
    params.set("page", String(page))
  }

  const query = params.toString()
  return query ? `?${query}` : ""
}

export const ExploreClinicsPage = ({
  initialClinics,
  totalCount,
  page,
  pageSize,
  initialFilters,
  initialSort,
}: ExploreClinicsPageProps) => {
  const router = useRouter()
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [sortBy, setSortBy] = useState<ClinicSortOption>(initialSort)
  const isFirstRender = useRef(true)

  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, totalCount)

  const updateRoute = useCallback((nextFilters: FilterState, nextSort: ClinicSortOption, nextPage: number) => {
    const query = buildQueryString(nextFilters, nextSort, nextPage)
    router.push(`/clinics${query}`)
  }, [router])

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const timeout = setTimeout(() => {
      updateRoute(filters, sortBy, 1)
    }, 400)

    return () => clearTimeout(timeout)
  }, [filters, sortBy, updateRoute])

  const handleSortChange = (value: ClinicSortOption) => {
    setSortBy(value)
    updateRoute(filters, value, 1)
  }

  const handlePageChange = (nextPage: number) => {
    updateRoute(filters, sortBy, nextPage)
  }

  const clinics = useMemo(() => initialClinics, [initialClinics])

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
                onSearch={() => updateRoute(filters, sortBy, 1)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {totalCount} clinics available
            </h2>
            <p className="text-sm text-muted-foreground">
              Showing {rangeStart}-{rangeEnd} of {totalCount}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="im-text-body im-text-muted">Sort by:</span>
            <div className="relative">
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px] h-9 bg-white" aria-label="Sort clinics">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SORT_CONFIG) as (keyof typeof SORT_CONFIG)[])
                    .filter((key) => SORT_CONFIG[key])
                    .map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Clinic Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {clinics.length > 0 ? (
            clinics.map((clinic) => (
              <ClinicCard
                key={clinic.id}
                name={clinic.name}
                location={clinic.location}
                image={clinic.image}
                specialties={clinic.specialties}
                trustScore={clinic.trustScore}
                description={clinic.description}
                rating={clinic.rating}
                reviewCount={clinic.reviewCount}
                aiInsight={clinic.aiInsight}
                onViewProfile={() => router.push(`/clinics/${clinic.id}`)}
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
                onClick={() => {
                  setFilters(initialFilters)
                  updateRoute(initialFilters, sortBy, 1)
                }}
                className="mt-2"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="mt-12 flex flex-wrap items-center justify-between gap-4">
            <Button
              variant="outline"
              size="lg"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              Previous
            </Button>
            <div className="text-sm text-muted-foreground">
              Page {page} of {pageCount}
            </div>
            <Button
              variant="outline"
              size="lg"
              disabled={page >= pageCount}
              onClick={() => handlePageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
