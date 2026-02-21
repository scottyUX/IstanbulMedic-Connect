"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { ClinicDetail } from "@/lib/api/clinics"

interface PricingSectionProps {
  pricing: ClinicDetail["pricing"]
}

const PRICING_TYPE_LABEL: Record<string, string> = {
  range: "Range",
  fixed: "Fixed",
  quote_only: "Quote only",
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

const formatPrice = (row: PricingSectionProps["pricing"][number]) => {
  const currency = normalizeCurrency(row.currency)

  if (row.pricing_type === "quote_only") {
    return "Quote only"
  }

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

  return "Contact for pricing"
}

export const PricingSection = ({ pricing }: PricingSectionProps) => {
  return (
    <Card id="pricing" variant="profile" className="scroll-mt-32">
      <CardHeader className="pb-3">
        <h2 className="im-heading-2 text-foreground">Pricing</h2>
        <p className="text-base text-muted-foreground">
          Transparent pricing pulled from verified sources when available.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {pricing.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-muted/5 p-4 text-base text-muted-foreground">
            Pricing details are not available yet. Please contact the clinic for a quote.
          </div>
        ) : (
          <div className="space-y-4">
            {pricing.map((row) => (
              <div key={row.id} className="rounded-xl border border-border/60 bg-muted/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-foreground">{row.service_name}</div>
                    <div className="text-lg font-bold text-[#17375B]">{formatPrice(row)}</div>
                  </div>
                  <Badge variant="secondary" className="text-xs uppercase tracking-wide">
                    {PRICING_TYPE_LABEL[row.pricing_type] ?? "Pricing"}
                  </Badge>
                </div>

                {row.notes ? (
                  <>
                    <Separator className="my-3" />
                    <div className="text-sm text-muted-foreground">{row.notes}</div>
                  </>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
