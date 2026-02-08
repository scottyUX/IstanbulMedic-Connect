"use client"

import { ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface SummarySidebarProps {
  transparencyScore: number
  topSpecialties: string[]
}

export const SummarySidebar = ({ transparencyScore, topSpecialties }: SummarySidebarProps) => {
  return (
    <div className="lg:sticky lg:top-6">
      <Card className="border-border/60 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-foreground">Summary</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Quick trust + fit snapshot
            </div>
          </div>
          <Badge className="bg-background text-foreground">
            <ShieldCheck className="mr-1 h-4 w-4" />
            {transparencyScore}
          </Badge>
        </div>

        <div className="mt-4 space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Top specialties</div>
          <div className="flex flex-wrap gap-2">
            {topSpecialties.map((s) => (
              <Badge key={s} variant="secondary">
                {s}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          <Button type="button" aria-label="Book consultation from sidebar">
            Book Consultation
          </Button>
          <Button
            type="button"
            variant="outline"
            aria-label="Ask Leila for help choosing a clinic"
          >
            Need help choosing? Ask Leila
          </Button>
        </div>
      </Card>
    </div>
  )
}

