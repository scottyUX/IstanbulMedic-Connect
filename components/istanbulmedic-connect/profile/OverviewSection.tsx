"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface OverviewSectionProps {
  specialties: string[]
  /** Reserved for future use — not currently rendered */
  yearsInOperation: number | null
  /** Reserved for future use — not currently rendered */
  proceduresPerformed: number | null
  /** Reserved for future use — not currently rendered */
  languages: string[]
  description: string | null
  techniques: string[]
}

export const OverviewSection = ({
  specialties,
  yearsInOperation: _yearsInOperation,
  proceduresPerformed: _proceduresPerformed,
  languages: _languages,
  description,
  techniques,
}: OverviewSectionProps) => {
  return (
    <Card id="overview" variant="profile" className="scroll-mt-32">
      <CardHeader className="pb-3">
        <h2 className="im-heading-2 text-foreground">Overview</h2>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Specialties */}
        <div className="flex flex-wrap gap-2">
          {specialties.map((s) => (
            <Badge key={s} variant="secondary" className="font-medium text-sm">
              {s}
            </Badge>
          ))}
        </div>

        {/* Summary */}
        {description && (
          <div className="text-base leading-relaxed text-muted-foreground">{description}</div>
        )}

        {/* Hair Transplant Techniques */}
        {techniques.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground tracking-wide uppercase">
              Hair Transplant Techniques
            </p>
            <div className="flex flex-wrap gap-2">
              {techniques.map((t) => (
                <Badge key={t} variant="outline" className="text-sm font-medium px-3 py-1">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

