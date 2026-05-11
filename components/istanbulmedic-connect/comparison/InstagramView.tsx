"use client"

import { ArrowLeft, CheckCircle2, Instagram, LinkIcon, MapPin } from "lucide-react"
import { Merriweather } from "next/font/google"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ClinicListItem } from "@/lib/api/clinics"

const merriweather = Merriweather({ subsets: ["latin"], weight: ["700"] })

interface InstagramViewProps {
  clinic: ClinicListItem
  onDeselect: () => void
  accentClass: string
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-border/60 bg-white p-3 text-center">
      <span className="text-xl font-bold text-foreground tabular-nums">{value}</span>
      <span className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  )
}

export function InstagramView({ clinic, onDeselect, accentClass }: InstagramViewProps) {
  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#bc1888] text-white">
          <Instagram className="h-6 w-6" />
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

      {/* Profile stats */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Instagram Profile
        </p>
        <div className="grid grid-cols-3 gap-2">
          <StatBox label="Followers" value="—" />
          <StatBox label="Posts" value="—" />
          <StatBox label="Verified" value="—" />
        </div>
      </div>

      {/* Positioning claims */}
      <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Bio Claims
        </p>
        <ClaimRow icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />} label="Positioning" value="Not yet collected" />
        <ClaimRow icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />} label="Services" value="Not yet collected" />
        <ClaimRow icon={<LinkIcon className="h-3.5 w-3.5 text-blue-400" />} label="Links" value="Not yet collected" />
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
        Full Instagram intelligence coming soon
      </div>

      <Button variant="outline" size="sm" onClick={onDeselect} className="w-full shrink-0">
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Change clinic
      </Button>
    </div>
  )
}

function ClaimRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <span className="text-xs font-medium text-foreground">{label}: </span>
        <span className="text-xs text-muted-foreground">{value}</span>
      </div>
    </div>
  )
}
