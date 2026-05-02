"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { CheckCircle2, MapPin, Star } from "lucide-react"
import { Merriweather } from "next/font/google"

import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import type { ClinicListItem } from "@/lib/api/clinics"

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["700"],
})

// Default subsignal thresholds (0–1). "The number we currently have it set at."
const DEFAULT_TRANSPARENCY = 0.7
const DEFAULT_REPUTATION = 0.6

const SOURCES = [
  { id: "all", label: "All Sources" },
  { id: "instagram", label: "Instagram" },
  { id: "reddit", label: "Reddit" },
  { id: "google", label: "Google" },
]

interface CompareClinicPageProps {
  clinics: ClinicListItem[]
}

// ------------------------------------------------------------------
// Compact clinic row used inside each selection pane
// ------------------------------------------------------------------
interface ClinicRowProps {
  clinic: ClinicListItem
  isSelected: boolean
  isDisabled: boolean
  onClick: () => void
}

function ClinicRow({ clinic, isSelected, isDisabled, onClick }: ClinicRowProps) {
  return (
    <button
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      aria-pressed={isSelected}
      className={cn(
        "w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
        isSelected
          ? "border-[var(--im-color-primary)] bg-[var(--im-color-primary)]/5 shadow-sm"
          : isDisabled
          ? "cursor-not-allowed border-border/40 bg-muted/20 opacity-40"
          : "border-border/60 bg-white hover:border-[var(--im-color-primary)]/50 hover:bg-muted/30 cursor-pointer"
      )}
    >
      {/* Thumbnail */}
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted/40">
        {clinic.image ? (
          <Image
            src={clinic.image}
            alt={clinic.name}
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground text-center leading-tight px-1">
            No photo
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            merriweather.className,
            "truncate text-sm font-bold leading-snug",
            isSelected ? "text-[var(--im-color-primary)]" : "text-foreground"
          )}
        >
          {clinic.name}
        </p>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{clinic.location}</span>
        </div>
        {typeof clinic.rating === "number" && (
          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-current text-[#FFD700]" />
            <span>{clinic.rating.toFixed(1)}</span>
            {clinic.reviewCount ? (
              <span className="text-muted-foreground/60">
                ({clinic.reviewCount.toLocaleString()})
              </span>
            ) : null}
          </div>
        )}
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--im-color-primary)]" />
      )}
      {isDisabled && !isSelected && (
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
          Taken
        </span>
      )}
    </button>
  )
}

// ------------------------------------------------------------------
// Selection pane (one half of the split view)
// ------------------------------------------------------------------
interface SelectionPaneProps {
  label: string
  accentColor: string
  clinics: ClinicListItem[]
  selectedId: string | null
  disabledId: string | null
  onSelect: (id: string | null) => void
}

function SelectionPane({
  label,
  accentColor,
  clinics,
  selectedId,
  disabledId,
  onSelect,
}: SelectionPaneProps) {
  const selected = clinics.find((c) => c.id === selectedId) ?? null

  return (
    <div className="flex flex-col rounded-2xl border border-border/60 bg-[#FEFCF8] overflow-hidden">
      {/* Pane header */}
      <div
        className="shrink-0 px-4 py-3 border-b border-border/60"
        style={{ background: accentColor }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
          {label}
        </p>
        <p
          className={cn(
            merriweather.className,
            "mt-0.5 truncate text-base font-bold text-white leading-snug"
          )}
        >
          {selected ? selected.name : "Select a clinic below"}
        </p>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {clinics.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No clinics match the current filters.
          </div>
        ) : (
          clinics.map((clinic) => (
            <ClinicRow
              key={clinic.id}
              clinic={clinic}
              isSelected={clinic.id === selectedId}
              isDisabled={clinic.id !== selectedId && clinic.id === disabledId}
              onClick={() =>
                onSelect(clinic.id === selectedId ? null : clinic.id)
              }
            />
          ))
        )}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// Main page
// ------------------------------------------------------------------
export function CompareClinicPage({ clinics }: CompareClinicPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Read initial state from URL
  const [source, setSource] = useState(searchParams.get("source") ?? "all")
  const [transparency, setTransparency] = useState(
    parseFloat(searchParams.get("transparency") ?? String(DEFAULT_TRANSPARENCY))
  )
  const [reputation, setReputation] = useState(
    parseFloat(searchParams.get("reputation") ?? String(DEFAULT_REPUTATION))
  )
  const [leftId, setLeftId] = useState<string | null>(
    searchParams.get("left") ?? null
  )
  const [rightId, setRightId] = useState<string | null>(
    searchParams.get("right") ?? null
  )

  // Keep URL in sync so users can share the link
  const syncUrl = useCallback(
    (
      nextSource: string,
      nextTransparency: number,
      nextReputation: number,
      nextLeft: string | null,
      nextRight: string | null
    ) => {
      const params = new URLSearchParams()
      if (nextSource !== "all") params.set("source", nextSource)
      if (nextTransparency !== DEFAULT_TRANSPARENCY)
        params.set("transparency", nextTransparency.toFixed(2))
      if (nextReputation !== DEFAULT_REPUTATION)
        params.set("reputation", nextReputation.toFixed(2))
      if (nextLeft) params.set("left", nextLeft)
      if (nextRight) params.set("right", nextRight)
      const qs = params.toString()
      router.replace(`/clinics/compare${qs ? `?${qs}` : ""}`, { scroll: false })
    },
    [router]
  )

  // Debounce URL updates for sliders
  useEffect(() => {
    const t = setTimeout(
      () => syncUrl(source, transparency, reputation, leftId, rightId),
      300
    )
    return () => clearTimeout(t)
  }, [source, transparency, reputation, leftId, rightId, syncUrl])

  // Filter clinics by transparency + reputation thresholds
  // trustScore is 0–100; map to 0–1 for comparison
  const filteredClinics = useMemo(
    () =>
      clinics.filter((c) => {
        const score = (c.trustScore ?? 0) / 100
        return score >= transparency * 0.5 && score >= reputation * 0.5
      }),
    [clinics, transparency, reputation]
  )

  return (
    <div className="min-h-screen bg-background">
      {/* ----------------------------------------------------------------
          Sticky top control bar
      ---------------------------------------------------------------- */}
      <div className="sticky top-[80px] z-20 border-b border-border/60 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {/* Source filter pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {SOURCES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSource(s.id)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium transition-colors border",
                    source === s.id
                      ? "border-[var(--im-color-primary)] bg-[var(--im-color-primary)] text-white"
                      : "border-border bg-white text-muted-foreground hover:border-[var(--im-color-primary)]/50 hover:text-foreground"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Subsignal sliders */}
            <div className="ml-auto flex flex-wrap items-center gap-6">
              {/* Transparency */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                  Transparency
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">0</span>
                  <div className="w-28">
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      value={[transparency]}
                      onValueChange={([v]) => setTransparency(v)}
                      variant="navy"
                      size="sm"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">1</span>
                </div>
                <span className="w-9 text-right font-mono text-sm font-medium tabular-nums text-[var(--im-color-primary)]">
                  {transparency.toFixed(2)}
                </span>
              </div>

              {/* Reputation */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                  Reputation
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">0</span>
                  <div className="w-28">
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      value={[reputation]}
                      onValueChange={([v]) => setReputation(v)}
                      variant="teal"
                      size="sm"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">1</span>
                </div>
                <span className="w-9 text-right font-mono text-sm font-medium tabular-nums text-[var(--im-color-secondary)]">
                  {reputation.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------
          Split clinic-selection view
      ---------------------------------------------------------------- */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Helper text */}
        <p className="mb-4 text-sm text-muted-foreground">
          Select one clinic in each panel — they must be different — to compare
          them side by side.
          {(leftId || rightId) && (
            <button
              onClick={() => {
                setLeftId(null)
                setRightId(null)
              }}
              className="ml-3 text-[var(--im-color-primary)] underline-offset-2 hover:underline"
            >
              Clear selection
            </button>
          )}
        </p>

        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "1fr 1fr", height: "calc(100vh - 260px)" }}
        >
          <SelectionPane
            label="Clinic A"
            accentColor="var(--im-color-primary)"
            clinics={filteredClinics}
            selectedId={leftId}
            disabledId={rightId}
            onSelect={setLeftId}
          />
          <SelectionPane
            label="Clinic B"
            accentColor="var(--im-color-secondary)"
            clinics={filteredClinics}
            selectedId={rightId}
            disabledId={leftId}
            onSelect={setRightId}
          />
        </div>
      </div>
    </div>
  )
}
