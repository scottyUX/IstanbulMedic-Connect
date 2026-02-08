"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

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
    <Card className="border-border/60 shadow-none">
      <CardHeader className="pb-3">
        <h2 className="text-2xl font-semibold text-foreground">Overview</h2>
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
          <div className="rounded-lg bg-muted/10 p-3">
            <div className="text-sm text-muted-foreground">Years in operation</div>
            <div className="mt-1 text-lg font-semibold">{yearsInOperation}</div>
          </div>
          <div className="rounded-lg bg-muted/10 p-3">
            <div className="text-sm text-muted-foreground">Procedures performed</div>
            <div className="mt-1 text-lg font-semibold">
              {proceduresPerformed.toLocaleString()}
            </div>
          </div>
          <div className="rounded-lg bg-muted/10 p-3">
            <div className="text-sm text-muted-foreground">Languages</div>
            <div className="mt-1 text-lg font-semibold">{languages.length}</div>
          </div>
        </div>

        <div className="text-base leading-relaxed text-muted-foreground">{description}</div>
      </CardContent>
    </Card>
  )
}

