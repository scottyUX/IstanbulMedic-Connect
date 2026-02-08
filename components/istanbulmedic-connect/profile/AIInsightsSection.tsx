"use client"

import { Sparkles } from "lucide-react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface AIInsightsSectionProps {
  insights: string[]
}

export const AIInsightsSection = ({ insights }: AIInsightsSectionProps) => {
  return (
    <Card className="border-border/60 shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold text-foreground">AI Insights</h2>
        </div>
        <p className="text-base text-muted-foreground">
          Signals detected from public information and verified documentation.
        </p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {insights.map((insight) => (
            <li key={insight} className="rounded-xl bg-muted/5 p-4 text-base text-muted-foreground">
              {insight}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

