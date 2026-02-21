"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { ShieldCheck, Star, Share, Heart, Grid3X3, X, ChevronLeft, ChevronRight, Trophy, Sparkles } from "lucide-react"
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"

interface HeroSectionProps {
  clinicName: string
  location: string
  images: string[]
  transparencyScore: number
  rating: number | null
  reviewCount: number
}

export const HeroSection = ({
  clinicName,
  location,
  images,
  transparencyScore,
  rating,
  reviewCount,
}: HeroSectionProps) => {
  const safeImages = useMemo(() => images.slice(0, 5), [images])
  const hasImages = safeImages.length > 0

  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index)
    setIsLightboxOpen(true)
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % safeImages.length)
  }

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length)
  }

  return (
    <>
      <div className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

          {/* Header Section */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-start justify-between">
              <h1 className="im-heading-1 text-foreground">
                {clinicName}
              </h1>
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="link" size="sm" className="gap-2 text-base font-medium text-foreground hover:text-[#3EBBB7] underline-offset-4">
                  <Share className="h-4 w-4" />
                  Share
                </Button>
                <Button variant="link" size="sm" className="gap-2 text-base font-medium text-foreground hover:text-[#3EBBB7] underline-offset-4">
                  <Heart className="h-4 w-4" />
                  Save
                </Button>
              </div>
            </div>

            {/* Sub-header Stats */}
            <div className="flex flex-wrap items-center gap-4 text-base text-foreground">
              <Button
                variant="link"
                className="h-auto p-0 text-foreground hover:text-[#3EBBB7] font-medium underline-offset-4 flex items-center gap-1"
                onClick={() => {
                  const reviewsSection = document.getElementById("reviews")
                  if (reviewsSection) {
                    reviewsSection.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                }}
              >
                <Star className="h-4 w-4 fill-[#FFD700] text-[#FFD700]" />
                <span>{rating !== null ? rating.toFixed(2) : "—"}</span>
                <span className="text-muted-foreground font-normal">·</span>
                <span className="text-muted-foreground font-normal">{reviewCount} reviews</span>
              </Button>
              <span className="hidden sm:inline text-muted-foreground">•</span>
              <Button
                variant="link"
                className="h-auto p-0 text-foreground hover:text-[#3EBBB7] font-medium underline-offset-4"
                onClick={() => {
                  const transparencySection = document.getElementById("transparency")
                  if (transparencySection) {
                    transparencySection.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                }}
              >
                <ShieldCheck className="h-4 w-4 text-[#FFD700] mr-1" />
                <span>Transparency {transparencyScore}</span>
              </Button>
              <span className="hidden sm:inline text-muted-foreground">•</span>
              <Button
                variant="link"
                className="h-auto p-0 text-muted-foreground hover:text-[#3EBBB7] font-medium underline-offset-4"
                onClick={() => {
                  const locationSection = document.getElementById("location")
                  if (locationSection) {
                    locationSection.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                }}
              >
                {location}
              </Button>
            </div>
          </div>

          {/* Patient Favorite Banner - only show if clinic qualifies (rating >= 4.5 with at least 5 reviews) */}
          {rating !== null && rating >= 4.5 && reviewCount >= 5 && (
            <div className="border border-border/60 rounded-xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-background shadow-sm">

              {/* Left: Badge */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="relative">
                  <Trophy className="h-12 w-12 text-[#FFD700] fill-[#FFD700]" />
                  <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-[#FFD700] fill-[#FFD700] animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <span className="im-heading-4 text-foreground">Patient</span>
                  <span className="im-heading-4 text-foreground">favorite</span>
                </div>
              </div>

              {/* Middle: Text */}
              <div className="flex-1 text-center md:text-left px-4">
                <p className="im-text-body-lg font-medium text-foreground">
                  One of the most loved clinics on Istanbul Medic Connect
                </p>
                <p className="text-muted-foreground">
                  Rated highly for hygiene, outcome, and service.
                </p>
              </div>

              {/* Right: Stats */}
              <div className="flex items-center gap-6 shrink-0 md:border-l md:pl-6 border-border/60">
                <div className="text-center">
                  <div className="im-heading-3 text-foreground">{rating.toFixed(2)}</div>
                  <div className="flex gap-0.5 mt-1 justify-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-[#FFD700] text-[#FFD700]" />
                    ))}
                  </div>
                </div>
                <div className="h-10 w-px bg-border/60 hidden md:block"></div>
                <div className="text-center">
                  <div className="im-heading-3 text-foreground">{reviewCount}</div>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-sm text-foreground hover:text-[#3EBBB7] underline-offset-4 mt-1"
                    onClick={() => {
                      const reviewsSection = document.getElementById("reviews")
                      if (reviewsSection) {
                        reviewsSection.scrollIntoView({ behavior: "smooth", block: "start" })
                      }
                    }}
                  >
                    Reviews
                  </Button>
                </div>
              </div>

            </div>
          )}

          {/* Image Grid */}
          <div className="relative mb-8 md:mb-12">
            {hasImages ? (
              <>
                <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-2 h-[400px] lg:h-[480px] rounded-xl overflow-hidden">
                  {/* Main Image */}
                  <div
                    className="col-span-2 row-span-2 relative cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={() => openLightbox(0)}
                  >
                    <Image src={safeImages[0]} alt="Clinic Main View" fill className="object-cover" priority />
                  </div>

                  {/* Secondary Images */}
                  {safeImages[1] ? (
                    <div
                      className="col-span-1 row-span-1 relative cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() => openLightbox(1)}
                    >
                      <Image src={safeImages[1]} alt="Clinic Interior" fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="col-span-1 row-span-1 flex items-center justify-center bg-muted/40 text-sm text-muted-foreground">No photo</div>
                  )}
                  {safeImages[2] ? (
                    <div
                      className="col-span-1 row-span-1 relative cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() => openLightbox(2)}
                    >
                      <Image src={safeImages[2]} alt="Clinic Detail" fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="col-span-1 row-span-1 flex items-center justify-center bg-muted/40 text-sm text-muted-foreground">No photo</div>
                  )}
                  {safeImages[3] ? (
                    <div
                      className="col-span-1 row-span-1 relative cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() => openLightbox(3)}
                    >
                      <Image src={safeImages[3]} alt="Clinic Equipment" fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="col-span-1 row-span-1 flex items-center justify-center bg-muted/40 text-sm text-muted-foreground">No photo</div>
                  )}
                  {safeImages[4] ? (
                    <div
                      className="col-span-1 row-span-1 relative cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() => openLightbox(4)}
                    >
                      <Image src={safeImages[4]} alt="Clinic Staff" fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="col-span-1 row-span-1 flex items-center justify-center bg-muted/40 text-sm text-muted-foreground">No photo</div>
                  )}
                </div>

                {/* Mobile View (single image) */}
                <div className="md:hidden relative h-[300px] w-full rounded-xl overflow-hidden">
                  <Image src={safeImages[0]} alt="Clinic Main View" fill className="object-cover" priority />
                </div>

                {/* Show All Photos Button */}
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-4 right-4 gap-2 bg-white/90 hover:bg-white shadow-sm border border-black/10 text-black font-semibold text-base"
                  onClick={() => openLightbox(0)}
                >
                  <Grid3X3 className="h-4 w-4" />
                  Show all photos
                </Button>
              </>
            ) : (
              <div className="flex h-[300px] md:h-[400px] lg:h-[480px] w-full items-center justify-center rounded-xl bg-muted/40 text-muted-foreground">
                No clinic photos uploaded yet
              </div>
            )}
          </div>

        </div>
      </div>

      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-[95vw] h-[95vh] p-0 bg-black border-none flex flex-col items-center justify-center">
          <DialogClose className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white z-50">
            <X className="h-6 w-6" />
          </DialogClose>

          <div className="relative w-full h-full flex items-center justify-center">
            {hasImages && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 z-50 text-white hover:bg-black/50 hover:text-white rounded-full h-12 w-12"
                onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}

            {hasImages && safeImages[currentImageIndex] ? (
              <div className="relative w-full h-full max-h-[85vh] max-w-[85vw]">
                <Image
                  src={safeImages[currentImageIndex]}
                  alt={`Photo ${currentImageIndex + 1}`}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                No clinic photos uploaded yet
              </div>
            )}

            {hasImages && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 z-50 text-white hover:bg-black/50 hover:text-white rounded-full h-12 w-12"
                onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            )}
          </div>

          {hasImages && (
            <div className="absolute bottom-4 text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
              {currentImageIndex + 1} / {safeImages.length}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
