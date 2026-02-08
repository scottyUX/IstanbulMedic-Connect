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
    <Card className="border-border/60 shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Transparency &amp; Safety</h2>
            <p className="text-sm text-muted-foreground">
              Verified signals used to evaluate clinic trust.
            </p>
          </div>
          <div className="shrink-0 rounded-lg border border-border/60 bg-muted/10 px-4 py-3 text-center">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Score</div>
            <div className="text-3xl font-bold text-[#3EBBB7]">{transparencyScore}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.title} className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/5 p-4 h-full">
              <div className="flex items-start justify-between">
                <CheckCircle2 className="h-6 w-6 text-[#3EBBB7]" aria-label="Verified" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground leading-tight mb-1">{item.title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

