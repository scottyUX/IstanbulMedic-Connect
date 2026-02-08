"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { MapPin, ShieldCheck, Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface HeroSectionProps {
  clinicName: string
  location: string
  images: string[]
  transparencyScore: number
  rating: number
  reviewCount: number
  specialties: string[]
}

export const HeroSection = ({
  clinicName,
  location,
  images,
  transparencyScore,
  rating,
  reviewCount,
  specialties,
}: HeroSectionProps) => {
  const safeImages = useMemo(() => (images.length > 0 ? images : ["/assets/image2.png"]), [images])
  const [activeIndex, setActiveIndex] = useState(0)

  const activeImage = safeImages[Math.min(activeIndex, safeImages.length - 1)] ?? safeImages[0]

  return (
    <div className="bg-muted/20">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-background text-foreground">
                  <ShieldCheck className="mr-1 h-4 w-4" />
                  Transparency {transparencyScore}
                </Badge>
                <Badge variant="secondary">
                  <Star className="mr-1 h-4 w-4 fill-current" />
                  {rating.toFixed(1)} ({reviewCount})
                </Badge>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {clinicName}
              </h1>

              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {location}
              </p>

              <div className="flex flex-wrap gap-2">
                {specialties.slice(0, 6).map((s) => (
                  <Badge key={s} variant="secondary" className="font-medium">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <Card className="overflow-hidden border-border/60 shadow-sm">
                <div className="relative aspect-[16/9] w-full">
                  <Image
                    src={activeImage}
                    alt={`${clinicName} photo`}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                {safeImages.length > 1 ? (
                  <div className="grid grid-cols-4 gap-2 p-3">
                    {safeImages.slice(0, 4).map((src, idx) => (
                      <button
                        key={`${src}-${idx}`}
                        type="button"
                        onClick={() => setActiveIndex(idx)}
                        className={cn(
                          "relative aspect-[4/3] overflow-hidden rounded-lg border border-border/60",
                          activeIndex === idx ? "border-primary" : "border-transparent"
                        )}
                        aria-label={`View image ${idx + 1}`}
                      >
                        <Image src={src} alt={`${clinicName} thumbnail ${idx + 1}`} fill className="object-cover" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </Card>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="space-y-4 border-border/60 p-6 shadow-sm">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Next step</div>
                <div className="mt-1 text-lg font-semibold text-foreground">
                  Get a private consultation
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ask questions, compare options, and get a personalized plan.
                </p>
              </div>

              <div className="grid gap-3">
                <Button type="button" aria-label="Book consultation">
                  Book Consultation
                </Button>
                <Button type="button" variant="outline" aria-label="Talk to Leila">
                  Talk to Leila (AI Assistant)
                </Button>
              </div>

              <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm text-muted-foreground">
                Transparency score reflects verified licenses, accreditations, and documented outcomes.
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

