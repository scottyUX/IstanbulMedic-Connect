"use client"

import Image from "next/image"
import { useId, useState } from "react"
import { MapPin, Star, Check } from "lucide-react"
import { Merriweather } from "next/font/google"

import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
// import { SpecialtyTag, TAG_VARIANT_SEQUENCE } from "@/components/ui/specialty-tag" // re-enable with tags section
import { cn } from "@/lib/utils"
import { FEATURE_CONFIG } from "@/lib/filterConfig"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { ConsultationConfirmModal } from "@/components/istanbulmedic-connect/ConsultationConfirmModal"
import { BookmarkButton } from "@/components/istanbulmedic-connect/BookmarkButton"

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

interface ClinicCardProps {
  id: string
  name: string
  location: string
  image: string | null
  specialties: string[]
  trustScore: number
  description: string | null
  rating?: number
  reviewCount?: number
  aiInsight?: string
  onViewProfile: () => void
}

export const ClinicCard = ({
  id,
  name,
  location,
  image,
  specialties: _specialties,
  description,
  rating,
  reviewCount,
  aiInsight,
  onViewProfile,
}: ClinicCardProps) => {
  const compareId = useId()
  const [isCompared, setIsCompared] = useState(false)
  const [consultationRequested, setConsultationRequested] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  const handleConsultationClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isAuthenticated) {
      document.cookie = `auth_redirect_next=${encodeURIComponent(window.location.pathname)}; path=/; max-age=300`
      router.push("/auth/login")
      return
    }
    if (!consultationRequested) {
      setModalOpen(true)
    }
  }

  const handleConsultationConfirm = async () => {
    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicIds: [id] }),
      })
      if (!res.ok) throw new Error('request failed')
      setConsultationRequested(true)
    } catch {
      // leave UI unchanged — user can retry
    }
  }

  return (
    <>
    <Card
      variant="interactive"
      radius="xl"
      className="group flex h-full flex-col overflow-hidden cursor-pointer"
      onClick={onViewProfile}
      data-testid="clinic-card"
    >
      <CardContent className="p-6 flex flex-col flex-1">
        {/* Image Section */}
        <div className="relative w-full overflow-hidden rounded-[16px] aspect-[4/3] sm:aspect-[3/2] lg:aspect-[16/9]">
          {image ? (
            <Image
              src={image}
              alt={`${name} clinic photo`}
              fill
              sizes="(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw"
              className="object-cover object-center rounded-[16px]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-[16px] bg-muted/40 text-sm text-muted-foreground">
              No clinic photo uploaded
            </div>
          )}
          {/* Bookmark icon — top-right overlay */}
          {FEATURE_CONFIG.bookConsultation && (
            <div
              className="absolute top-2 right-2"
              onClick={(e) => e.stopPropagation()}
            >
              <BookmarkButton
                clinicId={id}
                clinicName={name}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white"
                iconClassName="h-4 w-4"
              />
            </div>
          )}
        </div>

      {/*
        * Specialty tags hidden until multiple clinic types are supported.
        * Re-enable when clinics beyond hair transplant are added to the platform.
        *
        * <div className="mt-5 flex flex-wrap items-center gap-2">
        *   {specialties.slice(0, 4).map((specialty, index) => {
        *     const variant = TAG_VARIANT_SEQUENCE[index % TAG_VARIANT_SEQUENCE.length]
        *     return <SpecialtyTag key={`${specialty}-${index}`} label={specialty} variant={variant} />
        *   })}
        * </div>
        */}

      {/* Clinic Name (Headline) */}
      <h3
        className={cn(
          merriweather.className,
          "mt-4 block font-bold text-foreground leading-[140%] text-2xl line-clamp-2 min-h-[4.2rem]"
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
            <div className="flex items-center gap-1 text-sm text-muted-foreground" data-testid="clinic-rating">
              <Star className="h-3.5 w-3.5 fill-current text-[#FFD700]" />
              <span className="font-medium">{rating.toFixed(1)}</span>
              {typeof reviewCount === "number" && reviewCount > 0 && (
                <span className="text-muted-foreground/70">({reviewCount.toLocaleString()})</span>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No reviews yet</div>
          )}
        </div>

        {/* Right: Compare + Consultation text link */}
        <div
          className="flex shrink-0 flex-col items-end gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {FEATURE_CONFIG.compare && (
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
          )}
          {FEATURE_CONFIG.bookConsultation && (
            consultationRequested ? (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-[#3EBBB7]" />
                Consultation Requested
              </span>
            ) : (
              <button
                type="button"
                onClick={handleConsultationClick}
                className="text-xs font-medium text-[#3EBBB7] hover:underline underline-offset-2 transition-colors"
              >
                Request Free Consultation
              </button>
            )
          )}
        </div>
      </div>
      </CardContent>
    </Card>

    <ConsultationConfirmModal
      open={modalOpen}
      onOpenChange={(open) => !open && setModalOpen(false)}
      clinicName={name}
      isRemoving={false}
      onConfirm={handleConsultationConfirm}
    />
    </>
  )
}
