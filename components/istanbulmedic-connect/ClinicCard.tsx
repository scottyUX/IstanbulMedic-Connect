"use client"

import Image from "next/image"
import { useId, useState } from "react"
import { MapPin, Star } from "lucide-react"
import { Merriweather } from "next/font/google"


import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

interface ClinicCardProps {
  name: string
  location: string
  image: string
  specialties: string[]
  trustScore: number
  description: string
  rating?: number
  aiInsight?: string
  onViewProfile: () => void
}

// Tag color variants matching ArticleCard design
const TAG_VARIANT_STYLES = {
  teal: "bg-[#FFF9E5] text-[#857500]",
  blue: "bg-[#E8EBEF] text-[#102741]",
  green: "bg-[#FFF9E5] text-[#857500]",
  peach: "bg-[#F6EEF1] text-[#723B54]",
  purple: "bg-[#F6EEF1] text-[#723B54]",
  orange: "bg-[#F8F1EB] text-[#835224]",
} as const

type TagVariant = keyof typeof TAG_VARIANT_STYLES

const TAG_VARIANT_SEQUENCE: TagVariant[] = ["teal", "blue", "purple", "orange", "green", "peach"]

const formatTagLabel = (label: string) => {
  const trimmed = label.trim()
  if (!trimmed) return ""
  const lower = trimmed.toLocaleLowerCase()
  return lower.charAt(0).toLocaleUpperCase() + lower.slice(1)
}

export const ClinicCard = ({
  name,
  location,
  image,
  specialties,
  trustScore,
  description,
  rating,
  aiInsight,
  onViewProfile,
}: ClinicCardProps) => {
  const compareId = useId()
  const [isCompared, setIsCompared] = useState(false)

  return (
    <div
      className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-border/60 bg-background p-6 hover:border-primary/20 transition-all duration-300 cursor-pointer"
      onClick={onViewProfile}
    >
      {/* Image Section */}
      <div className="relative w-full overflow-hidden rounded-[16px] aspect-[4/3] sm:aspect-[3/2] lg:aspect-[16/9]">
        <Image
          src={image}
          alt={`${name} clinic photo`}
          fill
          sizes="(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw"
          className="object-cover object-center rounded-[16px]"
        />
      </div>

      {/* Tags Section */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {specialties.slice(0, 4).map((specialty, index) => {
          const formattedLabel = formatTagLabel(specialty)
          if (!formattedLabel) return null

          const variant = TAG_VARIANT_SEQUENCE[index % TAG_VARIANT_SEQUENCE.length]

          return (
            <span
              key={`${specialty}-${index}`}
              className={cn(
                "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors duration-150",
                TAG_VARIANT_STYLES[variant]
              )}
            >
              {formattedLabel}
            </span>
          )
        })}
      </div>

      {/* Clinic Name (Headline) */}
      <h3
        className={cn(
          merriweather.className,
          "mt-4 block font-bold text-foreground leading-[140%] text-2xl line-clamp-2"
        )}
      >
        {name}
      </h3>

      {/* Description */}
      {description ? (
        <p className="mt-3 text-base text-muted-foreground line-clamp-2">{description}</p>
      ) : null}

      {/* AI Insight */}
      {aiInsight ? (
        <div className="mt-3 rounded-lg border border-border/60 bg-muted/20 p-3 text-base text-muted-foreground">
          <span className="font-medium text-foreground">AI insight:</span> {aiInsight}
        </div>
      ) : null}

      {/* Bottom Section: Metadata + Actions */}
      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        {/* Left: Location & Rating */}
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-1.5 text-base text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{location}</span>
          </div>
          {typeof rating === "number" ? (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-current text-[#FFD700]" />
              <span className="font-medium">{rating.toFixed(1)}</span>
              <span className="text-muted-foreground/70">Trust {trustScore}</span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Trust {trustScore}</div>
          )}
        </div>

        {/* Right: Compare + View Profile */}
        <div
          className="flex shrink-0 flex-col items-end gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <Checkbox
              id={compareId}
              checked={isCompared}
              onCheckedChange={(value) => setIsCompared(Boolean(value))}
              aria-label={`Compare ${name}`}
            />
            <label
              htmlFor={compareId}
              className={cn("cursor-pointer select-none text-sm text-muted-foreground")}
            >
              Compare
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

