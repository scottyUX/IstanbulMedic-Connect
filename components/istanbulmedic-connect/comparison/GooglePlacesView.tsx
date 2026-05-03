"use client"

import { ArrowLeft, MapPin, Star } from "lucide-react"
import { Merriweather } from "next/font/google"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ClinicListItem } from "@/lib/api/clinics"

const merriweather = Merriweather({ subsets: ["latin"], weight: ["700"] })

interface GooglePlacesViewProps {
  clinic: ClinicListItem
  onDeselect: () => void
  accentClass: string
}

function StarBar({ stars, count, total }: { stars: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="flex w-14 shrink-0 items-center justify-end gap-0.5 text-muted-foreground">
        {stars} <Star className="h-2.5 w-2.5 fill-[#FFD700] text-[#FFD700]" />
      </span>
      <div className="flex-1 rounded-full bg-muted/30 overflow-hidden h-2">
        <div className="h-full rounded-full bg-[#FFD700]" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right font-medium text-foreground">{pct}%</span>
    </div>
  )
}

export function GooglePlacesView({ clinic, onDeselect, accentClass }: GooglePlacesViewProps) {
  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white border border-border/60 shadow-sm text-lg font-bold">
          <span style={{ background: "linear-gradient(135deg,#4285F4,#EA4335,#FBBC05,#34A853)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>G</span>
        </div>
        <div className="min-w-0">
          <h3 className={cn(merriweather.className, "truncate text-base font-bold leading-snug text-foreground")}>
            {clinic.name}
          </h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {clinic.location}
          </p>
        </div>
      </div>

      {/* Rating summary */}
      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Google Rating
        </p>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className={cn("text-4xl font-bold tabular-nums", accentClass)}>
              {typeof clinic.rating === "number" ? clinic.rating.toFixed(1) : "—"}
            </p>
            <div className="mt-1 flex justify-center gap-0.5">
              {[1, 2, 3, 4, 5].map(n => (
                <Star
                  key={n}
                  className={cn(
                    "h-3.5 w-3.5",
                    typeof clinic.rating === "number" && n <= Math.round(clinic.rating)
                      ? "fill-[#FFD700] text-[#FFD700]"
                      : "text-muted-foreground/30"
                  )}
                />
              ))}
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {clinic.reviewCount ? `${clinic.reviewCount.toLocaleString()} reviews` : "No reviews"}
            </p>
          </div>
          <div className="flex-1 space-y-1">
            <StarBar stars={5} count={0} total={0} />
            <StarBar stars={4} count={0} total={0} />
            <StarBar stars={3} count={0} total={0} />
            <StarBar stars={2} count={0} total={0} />
            <StarBar stars={1} count={0} total={0} />
          </div>
        </div>
      </div>

      {/* Trust score */}
      {clinic.trustScore > 0 && (
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Trust Score
          </p>
          <div className="flex items-baseline gap-2">
            <span className={cn("text-3xl font-bold tabular-nums", accentClass)}>
              {clinic.trustScore}
            </span>
            <span className="text-sm text-muted-foreground">/ 100</span>
            {clinic.trustBand && (
              <span className="ml-auto rounded-full bg-[var(--im-color-primary)]/10 px-3 py-0.5 text-xs font-bold text-[var(--im-color-primary)]">
                Band {clinic.trustBand}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-dashed border-border bg-muted/10 p-5 text-center text-sm text-muted-foreground flex-1">
        Per-star breakdown and recent reviews coming soon
      </div>

      <Button variant="outline" size="sm" onClick={onDeselect} className="w-full shrink-0">
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Change clinic
      </Button>
    </div>
  )
}
