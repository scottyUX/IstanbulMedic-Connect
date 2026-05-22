"use client"

import { useMemo } from "react"
import { ArrowLeft, Info, MapPin, Users2 } from "lucide-react"
import { Merriweather } from "next/font/google"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { ClinicListItem } from "@/lib/api/clinics"
import { getMockHRNSignals } from "@/lib/api/hrn.mock"
import type { HRNSignalsData } from "@/components/istanbulmedic-connect/profile/HRNSignalsCard"

const merriweather = Merriweather({ subsets: ["latin"], weight: ["700"] })

const TOPIC_LABELS: Record<string, string> = {
  density: "Density", hairline: "Hairline", donor_area: "Donor area",
  healing: "Healing", communication: "Communication", value: "Value",
  doctor_involvement: "Doctor involvement", technician_quality: "Technician quality",
  aftercare: "Aftercare", natural_results: "Natural results",
}

function SentimentRow({ color, label, count, total }: { color: string; label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 shrink-0 text-muted-foreground">{label}</span>
      <div className="flex-1 rounded-full bg-muted/30 overflow-hidden h-2">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right font-medium text-foreground">{pct}%</span>
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-border/60 bg-white p-3 text-center">
      <span className="text-xl font-bold text-foreground tabular-nums">{value}</span>
      <span className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  )
}

interface HRNViewProps {
  clinic: ClinicListItem
  onDeselect: () => void
  accentClass: string
}

export function HRNView({ clinic, onDeselect, accentClass }: HRNViewProps) {
  const hrn = useMemo<HRNSignalsData | null>(
    () => process.env.NEXT_PUBLIC_USE_MOCK_HRN === "true"
      ? getMockHRNSignals(clinic.id, clinic.name)
      : null,
    [clinic.id, clinic.name]
  )

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 text-white">
          <Users2 className="h-4 w-4" />
          <span className="text-[9px] font-bold tracking-wide leading-none">HRN</span>
        </div>
        <div className="min-w-0">
          <h3 className={cn(merriweather.className, "truncate text-base font-bold leading-snug text-foreground")}>
            {clinic.name}
          </h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {clinic.location}
          </p>
        </div>
      </div>

      {/* HRN Score — from clinic_source_scores.summary_score */}
      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          HRN Score
        </p>
        <div className="flex items-baseline gap-2">
          <span className={cn("text-3xl font-bold tabular-nums", clinic.hrnScore != null ? accentClass : "text-muted-foreground/40")}>
            {clinic.hrnScore != null ? clinic.hrnScore.toFixed(1) : "—"}
          </span>
          <span className="text-sm text-muted-foreground">/ 10</span>
          <Popover>
            <PopoverTrigger asChild>
              <button className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors" aria-label="How is this score calculated?">
                <Info className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 text-sm" align="end">
              <p className="font-medium mb-2">HRN Score is based on:</p>
              <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                <li>Patient sentiment (recency-weighted)</li>
                <li>Long-term follow-up rate (6-month+ updates)</li>
                <li>Repair and revision case rate</li>
                <li>Severity of reported issues</li>
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                Clinics with fewer than 5 threads show no score. Scores reflect self-reported experiences on HairRestorationNetwork.com, not clinical outcomes.
              </p>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatBox label="Threads"     value={hrn?.totalThreads      ?? "—"} />
        <StatBox label="With Photos" value={hrn?.photoThreads      ?? "—"} />
        <StatBox label="Long-term"   value={hrn?.longTermFollowups ?? "—"} />
      </div>

      {/* Sentiment */}
      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Sentiment Breakdown
        </p>
        {hrn ? (
          <div className="space-y-1.5">
            <SentimentRow color="bg-emerald-500"      label="Positive" count={hrn.sentiment.positive} total={hrn.totalThreads} />
            <SentimentRow color="bg-amber-400"        label="Mixed"    count={hrn.sentiment.mixed}    total={hrn.totalThreads} />
            <SentimentRow color="bg-rose-400"         label="Negative" count={hrn.sentiment.negative} total={hrn.totalThreads} />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No data yet</p>
        )}
      </div>

      {/* Topics */}
      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Common Topics
        </p>
        {hrn && hrn.topTopics.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {hrn.topTopics.map(t => (
              <span key={t} className="rounded-full border border-border/60 bg-white px-2.5 py-0.5 text-xs text-muted-foreground">
                {TOPIC_LABELS[t] ?? t.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs italic text-muted-foreground/60">No data yet</p>
        )}
      </div>

      <Button variant="outline" size="sm" onClick={onDeselect} className="w-full shrink-0 mt-auto">
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Change clinic
      </Button>
    </div>
  )
}
