"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { StatBlock } from "@/components/ui/stat-block"

interface OverviewSectionProps {
  specialties: string[]
  yearsInOperation: number
  proceduresPerformed: number
  languages: string[]
  description: string
}

export const OverviewSection = ({
  specialties,
  yearsInOperation,
  proceduresPerformed,
  languages,
  description,
}: OverviewSectionProps) => {
  return (
    <Card id="overview" variant="profile" className="scroll-mt-32">
      <CardHeader className="pb-3">
        <h2 className="im-heading-2 text-foreground">Overview</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {specialties.map((s) => (
            <Badge key={s} variant="secondary" className="font-medium text-sm">
              {s}
            </Badge>
          ))}
        </div>

        <Separator />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatBlock label="Years in operation" value={yearsInOperation} />
          <StatBlock
            label="Procedures performed"
            value={proceduresPerformed.toLocaleString()}
          />
          <StatBlock label="Languages" value={languages.length} />
        </div>

        <div className="text-base leading-relaxed text-muted-foreground">{description}</div>
      </CardContent>
    </Card>
  )
}

