"use client"

import { CheckCircle2, Clock, CreditCard, Languages, MapPin, Plane } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FEATURE_CONFIG } from "@/lib/filterConfig"

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
  lat: number | null
  lng: number | null
  openingHours: OpeningHoursRow[]
  languages: string[]
  paymentMethods: string[]
  services: Services | null
}

export const LocationInfoSection = ({
  address,
  lat,
  lng,
  openingHours,
  languages,
  paymentMethods,
  services,
}: LocationInfoSectionProps) => {
  return (
    <Card id="location" variant="profile" className="scroll-mt-32">
      <CardHeader className="pb-3">
        <h2 className="im-heading-2 text-foreground">Location &amp; Practical Info</h2>
        <p className="text-base text-muted-foreground">
          Address, opening hours, supported languages, and services.
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-lg text-foreground font-medium">
            <MapPin className="h-5 w-5 text-[#17375B] shrink-0" />
            <span>{address}</span>
          </div>

          {lat !== null && lng !== null ? (
            <div className="overflow-hidden rounded-2xl relative h-[450px] w-full bg-muted shadow-sm">
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${lat},${lng}&hl=en&z=14&output=embed`}
                title="Clinic Location"
                className="grayscale-[0.1]"
              />
            </div>
          ) : (
            <div className="rounded-2xl h-[200px] w-full bg-muted/30 flex items-center justify-center">
              <p className="text-muted-foreground italic">Map location not available</p>
            </div>
          )}
        </div>

        <Separator />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#17375B]" />
              <div className="text-base font-semibold text-foreground">Opening hours</div>
            </div>
            <div className="space-y-2">
              {openingHours.length > 0 ? (
                openingHours.map((row) => (
                  <div key={row.day} className="flex items-center justify-between gap-3 rounded-lg bg-muted/5 px-3 py-2">
                    <div className="text-base text-foreground">{row.day}</div>
                    <div className="text-base text-muted-foreground">{row.hours}</div>
                  </div>
                ))
              ) : (
                <div className="text-base text-muted-foreground italic">Contact clinic for hours</div>
              )}
            </div>
          </div>

          {(FEATURE_CONFIG.profileLanguages || FEATURE_CONFIG.profilePaymentMethods) && (
            <div className="space-y-4">
              {FEATURE_CONFIG.profileLanguages && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Languages className="h-5 w-5 text-[#17375B]" />
                    <div className="text-base font-semibold text-foreground">Languages</div>
                  </div>
                  {languages.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {languages.map((lang) => (
                        <Badge key={lang} variant="secondary" className="text-sm">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="text-base text-muted-foreground italic">Contact clinic for language support</div>
                  )}
                </div>
              )}

              {FEATURE_CONFIG.profilePaymentMethods && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-[#17375B]" />
                    <div className="text-base font-semibold text-foreground">Payment methods</div>
                  </div>
                  {paymentMethods.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {paymentMethods.map((m) => (
                        <Badge key={m} variant="secondary" className="text-sm">
                          {m}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="text-base text-muted-foreground italic">Contact clinic for payment options</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {FEATURE_CONFIG.profileServices && (
          <>
            <Separator />

            <div className="space-y-3">
              <div className="text-base font-semibold text-foreground">Services</div>
              {services !== null ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2 rounded-lg bg-muted/5 px-3 py-2">
                    {services.accommodation ? (
                      <CheckCircle2 className="h-4 w-4 text-[#17375B]" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground/40" />
                    )}
                    <span className="text-base text-muted-foreground">Accommodation support</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-muted/5 px-3 py-2">
                    <Plane className={services.airportTransfer ? "h-4 w-4 text-[#17375B]" : "h-4 w-4 text-muted-foreground/40"} />
                    <span className="text-base text-muted-foreground">Airport transfer</span>
                  </div>
                </div>
              ) : (
                <div className="text-base text-muted-foreground italic">Contact clinic for service details</div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
