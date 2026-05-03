"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { MapPin, Star } from "lucide-react"
import { Merriweather } from "next/font/google"

import { cn } from "@/lib/utils"
import type { ClinicListItem } from "@/lib/api/clinics"

import { AllSourcesView } from "./AllSourcesView"
import { InstagramView } from "./InstagramView"
import { RedditView } from "./RedditView"
import { GooglePlacesView } from "./GooglePlacesView"

const merriweather = Merriweather({ subsets: ["latin"], weight: ["700"] })

const SOURCES = [
  { id: "all",           label: "All Sources",    route: "/clinics/compare"              },
  { id: "instagram",     label: "Instagram",       route: "/clinics/compare/instagram"    },
  { id: "reddit",        label: "Reddit",          route: "/clinics/compare/reddit"       },
  { id: "google_places", label: "Google Places",   route: "/clinics/compare/google-places"},
]

type SourceId = "all" | "instagram" | "reddit" | "google_places"

const SOURCE_VIEWS: Record<SourceId, typeof AllSourcesView> = {
  all:           AllSourcesView,
  instagram:     InstagramView,
  reddit:        RedditView,
  google_places: GooglePlacesView,
}

interface CompareClinicPageProps {
  clinics: ClinicListItem[]
  source: SourceId
}

// ─── Compact clinic row in the selection list ──────────────────────────────
function ClinicRow({
  clinic,
  isDisabled,
  onClick,
}: {
  clinic: ClinicListItem
  isDisabled: boolean
  onClick: () => void
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
        {typeof clinic.rating === "number" && (
          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-[#FFD700] text-[#FFD700]" />
            <span className="font-medium">{clinic.rating.toFixed(1)}</span>
            {clinic.reviewCount ? (
              <span className="text-muted-foreground/60">({clinic.reviewCount.toLocaleString()})</span>
            ) : null}
          </div>
        )}
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
    <div className="flex flex-col rounded-2xl border border-border/60 overflow-hidden bg-[#FEFCF8]">
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

  const currentRoute = SOURCES.find(s => s.id === source)?.route ?? "/clinics/compare"

  const syncUrl = useCallback((left: string | null, right: string | null) => {
    const params = new URLSearchParams()
    if (left)  params.set("left",  left)
    if (right) params.set("right", right)
    const qs = params.toString()
    router.replace(`${currentRoute}${qs ? `?${qs}` : ""}`, { scroll: false })
  }, [router, currentRoute])

  useEffect(() => {
    syncUrl(leftId, rightId)
  }, [leftId, rightId, syncUrl])

  const handleSourceChange = (newSource: string) => {
    const target = SOURCES.find(s => s.id === newSource)
    if (!target) return
    const params = new URLSearchParams()
    if (leftId)  params.set("left",  leftId)
    if (rightId) params.set("right", rightId)
    const qs = params.toString()
    router.push(`${target.route}${qs ? `?${qs}` : ""}`)
  }

  return (
    <div className="flex flex-col bg-background overflow-hidden" style={{ height: "calc(100vh - 80px)" }}>

      {/* ── Control bar ─────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-border/60 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Source pills */}
          <div className="flex items-center gap-2">
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

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              Select one clinic in each panel to compare
            </span>
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
        className="flex-1 min-h-0 mx-auto w-full max-w-7xl px-4 pt-3 pb-3 grid gap-4"
        style={{ gridTemplateColumns: "1fr 1fr" }}
      >
        <ComparePane
          label="Clinic A"
          headerBg="bg-[var(--im-color-primary)]"
          accentClass="text-[var(--im-color-primary)]"
          clinics={clinics}
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
          clinics={clinics}
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
