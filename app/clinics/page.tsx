import { getClinics, type ClinicsQuery, type ClinicSortOption } from "@/lib/api/clinics"
import { ExploreClinicsPage } from "@/components/istanbulmedic-connect/ExploreClinicsPage"
import type { FilterState } from "@/components/istanbulmedic-connect/types"

interface ClinicsPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

const DEFAULT_FILTERS: FilterState = {
  searchQuery: "",
  location: "",
  treatments: {
    "Hair Transplant": false,
    "Dental": false,
    "Cosmetic Surgery": false,
    "Eye Surgery": false,
    "Bariatric Surgery": false,
  },
  budgetRange: [500, 12000],
  languages: {
    English: false,
    Turkish: false,
    Arabic: false,
    German: false,
  },
  accreditations: {
    JCI: false,
    ISO: false,
    "Ministry Licensed": false,
  },
  aiMatchScore: 75,
  minRating: null,
  minReviews: null,
}

const parseList = (value?: string | string[]) => {
  if (!value) return []
  const str = Array.isArray(value) ? value.join(",") : value
  return str
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
}

const parseNumber = (value?: string | string[], fallback?: number) => {
  if (!value) return fallback
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = Number(raw)
  return Number.isNaN(parsed) ? fallback : parsed
}

const parseSort = (value?: string | string[]): ClinicSortOption => {
  const raw = Array.isArray(value) ? value[0] : value
  switch (raw) {
    case "Alphabetical":
    case "Highest Rated":
    case "Most Transparent":
    case "Price: Low to High":
    case "Price: High to Low":
    case "Best Match":
      return raw
    default:
      return "Alphabetical"
  }
}

const buildFilters = (searchParams?: { [key: string]: string | string[] | undefined }) => {
  if (!searchParams) return { filters: DEFAULT_FILTERS, query: {} as ClinicsQuery }

  const searchQuery = (searchParams.q as string) ?? ""
  const location = (searchParams.location as string) ?? ""
  const treatments = parseList(searchParams.treatments)
  const languages = parseList(searchParams.languages)
  const accreditations = parseList(searchParams.accreditations)
  const aiMatchScore = parseNumber(searchParams.minScore, DEFAULT_FILTERS.aiMatchScore) ?? DEFAULT_FILTERS.aiMatchScore
  const minRating = parseNumber(searchParams.minRating) ?? null
  const minReviews = parseNumber(searchParams.minReviews) ?? null

  const filters: FilterState = {
    ...DEFAULT_FILTERS,
    searchQuery,
    location,
    treatments: {
      ...DEFAULT_FILTERS.treatments,
      "Hair Transplant": treatments.includes("Hair Transplant"),
      "Dental": treatments.includes("Dental"),
      "Cosmetic Surgery": treatments.includes("Cosmetic Surgery"),
      "Eye Surgery": treatments.includes("Eye Surgery"),
      "Bariatric Surgery": treatments.includes("Bariatric Surgery"),
    },
    languages: {
      ...DEFAULT_FILTERS.languages,
      English: languages.includes("English"),
      Turkish: languages.includes("Turkish"),
      Arabic: languages.includes("Arabic"),
      German: languages.includes("German"),
    },
    accreditations: {
      ...DEFAULT_FILTERS.accreditations,
      JCI: accreditations.includes("JCI"),
      ISO: accreditations.includes("ISO"),
      "Ministry Licensed": accreditations.includes("Ministry Licensed"),
    },
    aiMatchScore,
    minRating,
    minReviews,
  }

  const query: ClinicsQuery = {
    searchQuery,
    location,
    treatments,
    languages,
    accreditations,
    // minTrustScore disabled for now - clinics without scores were being excluded
    // minTrustScore: aiMatchScore,
    minRating: minRating ?? undefined,
    minReviews: minReviews ?? undefined,
  }

  return { filters, query }
}

export default async function ConnectExplorePage({ searchParams }: ClinicsPageProps) {
  if (process.env.NODE_ENV === "development") {
    if (process.env.NEXT_PUBLIC_IM_FORCE_ERROR === "1") {
      throw new Error("Forced clinics error for preview")
    }
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const { filters, query } = buildFilters(resolvedSearchParams)

  const page = Math.max(1, parseNumber(resolvedSearchParams?.page, 1) ?? 1)
  const sort = parseSort(resolvedSearchParams?.sort)
  const pageSize = 12

  const { clinics, total } = await getClinics({
    ...query,
    page,
    pageSize,
    sort,
  })

  return (
    <ExploreClinicsPage
      initialClinics={clinics}
      totalCount={total}
      page={page}
      pageSize={pageSize}
      initialFilters={filters}
      initialSort={sort}
    />
  )
}
