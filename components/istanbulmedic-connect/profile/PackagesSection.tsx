"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { ClinicDetail } from "@/lib/api/clinics"
import type { Json } from "@/lib/supabase/database.types"

interface PackagesSectionProps {
  packages: ClinicDetail["packages"]
}

const normalizeCurrency = (value: string | null | undefined) => {
  if (!value) return null
  return value.toUpperCase()
}

const formatMoney = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${amount.toLocaleString()} ${currency}`
  }
}

const formatPackagePrice = (row: ClinicDetail["packages"][number]) => {
  if (row.price_min == null && row.price_max == null) return "Pricing upon request"

  const currency = normalizeCurrency(row.currency)

  if (row.price_min != null && row.price_max != null) {
    if (!currency) return `${row.price_min.toLocaleString()} - ${row.price_max.toLocaleString()}`
    if (row.price_min === row.price_max) return formatMoney(row.price_min, currency)
    return `${formatMoney(row.price_min, currency)} - ${formatMoney(row.price_max, currency)}`
  }

  if (row.price_min != null) {
    return currency ? formatMoney(row.price_min, currency) : row.price_min.toLocaleString()
  }

  if (row.price_max != null) {
    return currency ? formatMoney(row.price_max, currency) : row.price_max.toLocaleString()
  }

  return "Pricing upon request"
}

const toStringArray = (value: Json | null | undefined) => {
  if (!value || !Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === "string")
}

export const PackagesSection = ({ packages }: PackagesSectionProps) => {
  const packageRows = packages

  return (
    <Card id="packages" variant="profile" className="scroll-mt-32">
      <CardHeader className="pb-3">
        <h2 className="im-heading-2 text-foreground">Packages</h2>
        <p className="text-base text-muted-foreground">
          Structured packages with inclusions, accommodation, and aftercare details.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {packageRows.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-muted/5 p-4 text-base text-muted-foreground">
            Package details are not available yet. Please contact the clinic for custom options.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {packageRows.map((pkg) => {
              const includes = toStringArray(pkg.includes)
              const excludes = toStringArray(pkg.excludes)

              return (
                <div key={pkg.id} className="rounded-xl border border-border/60 bg-muted/5 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-foreground">{pkg.package_name}</div>
                      <div className="text-lg font-bold text-[#17375B]">{formatPackagePrice(pkg)}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {pkg.nights_included != null && (
                        <Badge variant="secondary" className="text-xs">
                          {pkg.nights_included} nights included
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {pkg.transport_included ? "Transfers included" : "No transfers"}
                      </Badge>
                      {pkg.aftercare_duration_days != null && (
                        <Badge variant="secondary" className="text-xs">
                          {pkg.aftercare_duration_days} days aftercare
                        </Badge>
                      )}
                    </div>
                  </div>

                  {(includes.length > 0 || excludes.length > 0) && <Separator className="my-3" />}

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-foreground">Includes</div>
                      {includes.length > 0 ? (
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {includes.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-sm text-muted-foreground">No inclusions listed.</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-foreground">Excludes</div>
                      {excludes.length > 0 ? (
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {excludes.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-sm text-muted-foreground">No exclusions listed.</div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
