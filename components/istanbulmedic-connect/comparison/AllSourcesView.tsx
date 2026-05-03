"use client"

import Image from "next/image"
import { MapPin, Star, ArrowLeft } from "lucide-react"
import { Merriweather } from "next/font/google"

import { Button } from "@/components/ui/button"
import { SpecialtyTag, TAG_VARIANT_SEQUENCE } from "@/components/ui/specialty-tag"
import { cn } from "@/lib/utils"
import type { ClinicListItem } from "@/lib/api/clinics"

const merriweather = Merriweather({ subsets: ["latin"], weight: ["700"] })

interface AllSourcesViewProps {
  clinic: ClinicListItem
  onDeselect: () => void
  accentClass: string
}

export function AllSourcesView({ clinic, onDeselect, accentClass }: AllSourcesViewProps) {
  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted/40 shrink-0">
        {clinic.image ? (
          <Image src={clinic.image} alt={clinic.name} fill sizes="50vw" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            No photo
          </div>
        )}
      </div>

      <div>
        <h3 className={cn(merriweather.className, "text-lg font-bold leading-snug text-foreground")}>
          {clinic.name}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {clinic.location}
          </span>
          {typeof clinic.rating === "number" && (
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-[#FFD700] text-[#FFD700]" />
              <span className="font-medium">{clinic.rating.toFixed(1)}</span>
              {clinic.reviewCount ? (
                <span className="text-muted-foreground/60">
                  ({clinic.reviewCount.toLocaleString()} reviews)
                </span>
              ) : null}
            </span>
          )}
        </div>
      </div>

      {clinic.specialties.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {clinic.specialties.slice(0, 4).map((s, i) => (
            <SpecialtyTag
              key={s}
              label={s}
              variant={TAG_VARIANT_SEQUENCE[i % TAG_VARIANT_SEQUENCE.length]}
            />
          ))}
        </div>
      )}

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

      <div className="rounded-xl border border-dashed border-border bg-muted/10 p-6 text-center text-sm text-muted-foreground flex-1">
        Full comparison details coming soon
      </div>

      <Button variant="outline" size="sm" onClick={onDeselect} className="w-full shrink-0">
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Change clinic
      </Button>
    </div>
  )
}
