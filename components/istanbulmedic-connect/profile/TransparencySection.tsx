"use client"

import { CheckCircle2 } from "lucide-react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { StatBlock } from "@/components/ui/stat-block"

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
    <Card id="transparency" variant="profile" className="scroll-mt-32">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="im-heading-2 text-foreground">Transparency &amp; Safety</h2>
            <p className="text-base text-muted-foreground">
              Verified signals used to evaluate clinic trust.
            </p>
          </div>
          <StatBlock
            label="Score"
            value={transparencyScore}
            variant="centered"
            className="shrink-0 px-4 py-3"
            labelClassName="font-medium uppercase tracking-wider"
            valueClassName="text-4xl font-bold text-[#17375B]"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.title} className="flex flex-col gap-3 rounded-xl bg-muted/5 p-4 h-full">
              <div className="flex items-start justify-between">
                <CheckCircle2 className="h-6 w-6 text-[#17375B]" aria-label="Verified" />
              </div>
              <div>
                <div className="text-base font-semibold text-foreground leading-tight mb-1">{item.title}</div>
                <div className="text-sm text-muted-foreground leading-relaxed">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

