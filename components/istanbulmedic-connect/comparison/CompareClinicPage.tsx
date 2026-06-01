"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { MapPin } from "lucide-react"
import { Merriweather } from "next/font/google"

import { cn } from "@/lib/utils"
import type { ClinicListItem } from "@/lib/api/clinics"
import { getMockHRNSignals } from "@/lib/api/hrn.mock"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { AllSourcesView } from "./AllSourcesView"
import { InstagramView } from "./InstagramView"
import { RedditView } from "./RedditView"
import { GooglePlacesView } from "./GooglePlacesView"
import { HRNView } from "./HRNView"

const merriweather = Merriweather({ subsets: ["latin"], weight: ["700"] })

const SOURCES = [
  { id: "all",           label: "All Sources",    route: "/clinics/compare"              },
  { id: "google_places", label: "Google Places",   route: "/clinics/compare/google-places"},
  { id: "reddit",        label: "Reddit",          route: "/clinics/compare/reddit"       },
  { id: "hrn",           label: "HRN",             route: "/clinics/compare/hrn"          },
  { id: "instagram",     label: "Instagram",       route: "/clinics/compare/instagram"    },
]

type SourceId = "all" | "instagram" | "reddit" | "google_places" | "hrn"

const SOURCE_VIEWS: Record<SourceId, typeof AllSourcesView> = {
  all:           AllSourcesView,
  instagram:     InstagramView,
  reddit:        RedditView,
  google_places: GooglePlacesView,
  hrn:           HRNView,
}

interface CompareClinicPageProps {
  clinics: ClinicListItem[]
  source: SourceId
}

function resolveHRNScore(clinic: ClinicListItem): number | null {
  if (process.env.NEXT_PUBLIC_USE_MOCK_HRN === "true")
    return getMockHRNSignals(clinic.id, clinic.name)?.hrnScore ?? null
  return clinic.hrnScore ?? null
}

// ─── Compact clinic row in the selection list ──────────────────────────────
function ClinicRow({
  clinic,
  isDisabled,
  onClick,
  source,
}: {
  clinic: ClinicListItem
  isDisabled: boolean
  onClick: () => void
  source: SourceId
}) {
  return (
    <button
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      className={cn(
        "w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
        isDisabled
          ? "cursor-not-allowed border-border/40 bg-muted/20 opacity-40"
          : "border-border/60 bg-white hover:border-[var(--im-color-primary)]/40 hover:shadow-sm cursor-pointer"
      )}
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted/40">
        {clinic.image ? (
          <Image src={clinic.image} alt={clinic.name} fill sizes="48px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-muted-foreground">
            {clinic.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className={cn(merriweather.className, "truncate text-sm font-bold text-foreground leading-snug")}>
          {clinic.name}
        </p>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{clinic.location}</span>
        </div>
        {(() => {
          const score =
            source === "google_places" ? (clinic.googleScore    ?? null) :
            source === "instagram"     ? (clinic.instagramScore ?? null) :
            source === "reddit"        ? (clinic.redditScore    ?? null) :
            source === "hrn"           ? resolveHRNScore(clinic) :
            (clinic.trustScore > 0 ? clinic.trustScore / 10 : null)

          const denom = "/10"

          const colorClass =
            source === "google_places" ? "bg-yellow-50 text-yellow-700" :
            source === "instagram"     ? "bg-fuchsia-50 text-fuchsia-700" :
            source === "reddit"        ? "bg-orange-50 text-orange-700" :
            source === "hrn"           ? "bg-teal-50 text-teal-700" :
            "bg-[var(--im-color-primary)]/10 text-[var(--im-color-primary)]"

          return (
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] tabular-nums", colorClass)}>
                {score != null
                  ? <><span className="font-bold">{score.toFixed(1)}</span><span className="font-medium">{denom}</span></>
                  : <><span className="font-medium">—</span><span className="font-medium">{denom}</span></>
                }
              </span>
              {source === "all" && clinic.trustBand && (
                <span className="rounded-full bg-[var(--im-color-primary)]/10 px-1.5 py-0.5 text-[10px] font-bold text-[var(--im-color-primary)]">
                  Band {clinic.trustBand}
                </span>
              )}
            </div>
          )
        })()}
      </div>

      {isDisabled && (
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
          Selected
        </span>
      )}
    </button>
  )
}

// ─── One half of the split view ────────────────────────────────────────────
function ComparePane({
  label,
  headerBg,
  accentClass,
  className,
  clinics,
  selectedId,
  disabledId,
  source,
  onSelect,
  onDeselect,
}: {
  label: string
  headerBg: string
  accentClass: string
  className?: string
  clinics: ClinicListItem[]
  selectedId: string | null
  disabledId: string | null
  source: SourceId
  onSelect: (id: string) => void
  onDeselect: () => void
}) {
  const selected = clinics.find(c => c.id === selectedId) ?? null
  const SelectedView = SOURCE_VIEWS[source]

  return (
    <div className={cn("flex flex-col rounded-2xl border border-border/60 overflow-hidden bg-[#FEFCF8]", className)}>
      <div className={cn("shrink-0 px-4 py-3", headerBg)}>
        <p className="text-xs font-semibold uppercase tracking-widest text-white/70">{label}</p>
        <p className={cn(merriweather.className, "mt-0.5 truncate text-base font-bold text-white leading-snug")}>
          {selected ? selected.name : "Select a clinic below"}
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {selected ? (
          <SelectedView clinic={selected} onDeselect={onDeselect} accentClass={accentClass} />
        ) : (
          <div className="h-full overflow-y-auto p-3 space-y-2">
            {clinics.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No clinics available.</p>
            ) : (
              clinics.map(clinic => (
                <ClinicRow
                  key={clinic.id}
                  clinic={clinic}
                  isDisabled={clinic.id === disabledId}
                  onClick={() => onSelect(clinic.id)}
                  source={source}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────
export function CompareClinicPage({ clinics, source }: CompareClinicPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [leftId,  setLeftId]  = useState<string | null>(searchParams.get("left")  ?? null)
  const [rightId, setRightId] = useState<string | null>(searchParams.get("right") ?? null)
  const [mobilePane, setMobilePane] = useState<"left" | "right">("left")
  const isMounted = useRef(false)

  // Scroll to top on mount. The root layout always renders a Footer
  // below this component, making the body taller than 100vh and leaving the
  // window scroll position from the previous page intact on navigation.
  // Use the numeric overload for broad mobile Safari compatibility.
  useEffect(() => {
    try {
      window.scrollTo(0, 0)
    } catch {
      // Ignore scroll API failures so page interactivity remains intact.
    }
  }, [])
  const rawSort = searchParams.get("sort")
  const [sortBy, setSortBy] = useState<"A-Z" | "Z-A" | "Highest Rated" | "Lowest Rated">(
    rawSort === "highest" ? "Highest Rated" : rawSort === "lowest" ? "Lowest Rated" : rawSort === "za" ? "Z-A" : "A-Z"
  )

  const sortedClinics = useMemo(() => {
    const sorted = [...clinics]
    if (sortBy === "A-Z") {
      sorted.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === "Z-A") {
      sorted.sort((a, b) => b.name.localeCompare(a.name))
    } else {
      const getScore = (c: ClinicListItem): number => {
        if (source === "google_places") return c.googleScore    ?? 0
        if (source === "instagram")     return c.instagramScore ?? 0
        if (source === "reddit")        return c.redditScore    ?? 0
        if (source === "hrn")           return resolveHRNScore(c) ?? 0
        return c.trustScore / 10
      }
      sorted.sort((a, b) =>
        sortBy === "Highest Rated" ? getScore(b) - getScore(a) : getScore(a) - getScore(b)
      )
    }
    return sorted
  }, [clinics, sortBy, source])

  const currentRoute = SOURCES.find(s => s.id === source)?.route ?? "/clinics/compare"

  const syncUrl = useCallback((left: string | null, right: string | null, sort: typeof sortBy) => {
    const params = new URLSearchParams()
    if (left)  params.set("left",  left)
    if (right) params.set("right", right)
    if (sort === "Z-A")           params.set("sort", "za")
    if (sort === "Highest Rated") params.set("sort", "highest")
    if (sort === "Lowest Rated")  params.set("sort", "lowest")
    const qs = params.toString()
    router.replace(`${currentRoute}${qs ? `?${qs}` : ""}`, { scroll: false })
  }, [router, currentRoute])

  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }
    syncUrl(leftId, rightId, sortBy)
  }, [leftId, rightId, sortBy, syncUrl])

  const handleSourceChange = (newSource: string) => {
    const target = SOURCES.find(s => s.id === newSource)
    if (!target) return
    const params = new URLSearchParams()
    if (leftId)  params.set("left",  leftId)
    if (rightId) params.set("right", rightId)
    if (sortBy === "Highest Rated") params.set("sort", "highest")
    if (sortBy === "Lowest Rated")  params.set("sort", "lowest")
    const qs = params.toString()
    router.push(`${target.route}${qs ? `?${qs}` : ""}`)
  }

  const leftClinic = sortedClinics.find(c => c.id === leftId) ?? null
  const rightClinic = sortedClinics.find(c => c.id === rightId) ?? null

  return (
    <div className="flex flex-col bg-background overflow-hidden" style={{ height: "calc(100vh - 80px)" }}>

      {/* ── Control bar ─────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-border/60 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Source pills */}
          <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1">
            {SOURCES.map(s => (
              <button
                key={s.id}
                onClick={() => handleSourceChange(s.id)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                  source === s.id
                    ? "bg-[var(--im-color-primary)] text-white shadow-sm"
                    : "border border-border/60 bg-white text-muted-foreground hover:border-[var(--im-color-primary)]/40 hover:text-foreground"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex w-full rounded-lg border border-border/60 bg-muted/30 p-1 md:hidden" aria-label="Choose comparison clinic">
            <button
              type="button"
              aria-pressed={mobilePane === "left"}
              onClick={() => setMobilePane("left")}
              className={cn(
                "min-w-0 flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                mobilePane === "left"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="block truncate">Clinic A</span>
              <span className="block truncate text-[11px] font-normal opacity-75">
                {leftClinic?.name ?? "Select a clinic"}
              </span>
            </button>
            <button
              type="button"
              aria-pressed={mobilePane === "right"}
              onClick={() => setMobilePane("right")}
              className={cn(
                "min-w-0 flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                mobilePane === "right"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="block truncate">Clinic B</span>
              <span className="block truncate text-[11px] font-normal opacity-75">
                {rightClinic?.name ?? "Select a clinic"}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:block whitespace-nowrap">Sort by:</span>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-[152px] h-8 bg-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A-Z">A-Z</SelectItem>
                  <SelectItem value="Z-A">Z-A</SelectItem>
                  <SelectItem value="Highest Rated">Highest Rated</SelectItem>
                  <SelectItem value="Lowest Rated">Lowest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(leftId || rightId) && (
              <button
                onClick={() => { setLeftId(null); setRightId(null) }}
                className="text-sm text-[var(--im-color-primary)] hover:underline underline-offset-2 whitespace-nowrap"
              >
                Clear selection
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Split panes ─────────────────────────────────────────── */}
      <div
        className="grid flex-1 min-h-0 w-full max-w-7xl gap-4 px-4 pt-3 pb-3 mx-auto grid-cols-1 md:grid-cols-2"
      >
        <ComparePane
          label="Clinic A"
          headerBg="bg-[var(--im-color-primary)]"
          accentClass="text-[var(--im-color-primary)]"
          className={cn(mobilePane === "left" ? "flex" : "hidden md:flex")}
          clinics={sortedClinics}
          selectedId={leftId}
          disabledId={rightId}
          source={source}
          onSelect={setLeftId}
          onDeselect={() => setLeftId(null)}
        />
        <ComparePane
          label="Clinic B"
          headerBg="bg-[var(--im-color-secondary)]"
          accentClass="text-[var(--im-color-secondary)]"
          className={cn(mobilePane === "right" ? "flex" : "hidden md:flex")}
          clinics={sortedClinics}
          selectedId={rightId}
          disabledId={leftId}
          source={source}
          onSelect={setRightId}
          onDeselect={() => setRightId(null)}
        />
      </div>
    </div>
  )
}
