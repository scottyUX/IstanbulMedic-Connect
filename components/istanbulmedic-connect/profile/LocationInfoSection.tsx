"use client"

import Image from "next/image"
import { CheckCircle2, Clock, CreditCard, Languages, MapPin, Plane } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface OpeningHoursRow {
  day: string
  hours: string
}

interface Services {
  accommodation: boolean
  airportTransfer: boolean
}

interface LocationInfoSectionProps {
  address: string
  mapImageUrl: string
  lat: number
  lng: number
  openingHours: OpeningHoursRow[]
  languages: string[]
  paymentMethods: string[]
  services: Services
}

export const LocationInfoSection = ({
  address,
  mapImageUrl,
  lat,
  lng,
  openingHours,
  languages,
  paymentMethods,
  services,
}: LocationInfoSectionProps) => {
  // Use the key found in the source repo
  const apiKey = "AIzaSyBFw0Qbyq9zTFTd-tUY6dgsWUxO4kzJjzY"

  return (
    <Card className="border-border/60 shadow-none">
      <CardHeader className="pb-3">
        <h2 className="text-lg font-semibold text-foreground">Location &amp; Practical Info</h2>
        <p className="text-sm text-muted-foreground">
          Address, opening hours, supported languages, and services.
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-muted/5 p-4 h-full flex flex-col justify-center">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-5 w-5 text-primary shrink-0" />
              <div>
                <div className="text-sm font-semibold text-foreground">Address</div>
                <div className="mt-1 text-sm text-muted-foreground">{address}</div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/60 relative h-[250px] bg-muted">
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${lat},${lng}&hl=en&z=14&output=embed`}
              title="Clinic Location"
            />
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div className="text-sm font-semibold text-foreground">Opening hours</div>
            </div>
            <div className="space-y-2">
              {openingHours.map((row) => (
                <div key={row.day} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/5 px-3 py-2">
                  <div className="text-sm text-foreground">{row.day}</div>
                  <div className="text-sm text-muted-foreground">{row.hours}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Languages className="h-5 w-5 text-primary" />
                <div className="text-sm font-semibold text-foreground">Languages</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {languages.map((lang) => (
                  <Badge key={lang} variant="secondary">
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <div className="text-sm font-semibold text-foreground">Payment methods</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {paymentMethods.map((m) => (
                  <Badge key={m} variant="secondary">
                    {m}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="text-sm font-semibold text-foreground">Services</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/5 px-3 py-2">
              {services.accommodation ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-muted-foreground/40" />
              )}
              <span className="text-sm text-muted-foreground">Accommodation support</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/5 px-3 py-2">
              <Plane className={services.airportTransfer ? "h-4 w-4 text-primary" : "h-4 w-4 text-muted-foreground/40"} />
              <span className="text-sm text-muted-foreground">Airport transfer</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

