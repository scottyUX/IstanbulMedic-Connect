"use client"

import { CheckCircle2 } from "lucide-react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface TransparencyItem {
  title: string
  description: string
  verified: boolean
}

interface TransparencySectionProps {
  transparencyScore: number
  items: TransparencyItem[]
}

export const TransparencySection = ({ transparencyScore, items }: TransparencySectionProps) => {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Transparency &amp; Safety</h2>
            <p className="text-sm text-muted-foreground">
              Verified signals used to evaluate clinic trust.
            </p>
          </div>
          <div className="shrink-0 rounded-lg border border-border/60 bg-muted/10 px-3 py-2 text-center">
            <div className="text-xs text-muted-foreground">Score</div>
            <div className="text-lg font-semibold text-foreground">{transparencyScore}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Lower</span>
            <span>Higher</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.min(100, Math.max(0, transparencyScore))}%` }}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.title} className="flex gap-3 rounded-xl border border-border/60 bg-muted/5 p-4">
              <div className="mt-0.5">
                <CheckCircle2 className="h-5 w-5 text-primary" aria-label="Verified" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground">{item.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

