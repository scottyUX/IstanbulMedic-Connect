"use client"

import { ArrowLeft, MapPin, MessageSquare, ThumbsDown, ThumbsUp } from "lucide-react"
import { Merriweather } from "next/font/google"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ClinicListItem } from "@/lib/api/clinics"

const merriweather = Merriweather({ subsets: ["latin"], weight: ["700"] })

interface RedditViewProps {
  clinic: ClinicListItem
  onDeselect: () => void
  accentClass: string
}

function SentimentBar({ positive, neutral, negative }: { positive: number; neutral: number; negative: number }) {
  const total = positive + neutral + negative
  if (total === 0) return <p className="text-xs text-muted-foreground">No data yet</p>
  return (
    <div className="space-y-1.5">
      <SentimentRow color="bg-emerald-500" label="Positive" count={positive} total={total} />
      <SentimentRow color="bg-muted-foreground/30" label="Neutral" count={neutral} total={total} />
      <SentimentRow color="bg-rose-400" label="Negative" count={negative} total={total} />
    </div>
  )
}

function SentimentRow({ color, label, count, total }: { color: string; label: string; count: number; total: number }) {
  const pct = Math.round((count / total) * 100)
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-14 shrink-0 text-muted-foreground">{label}</span>
      <div className="flex-1 rounded-full bg-muted/30 overflow-hidden h-2">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right font-medium text-foreground">{pct}%</span>
    </div>
  )
}

export function RedditView({ clinic, onDeselect, accentClass }: RedditViewProps) {
  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FF4500] text-white">
          <MessageSquare className="h-6 w-6" />
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

      {/* Mention count */}
      <div className="grid grid-cols-3 gap-2">
        <StatBox label="Mentions" value="—" />
        <StatBox label="Subreddits" value="—" />
        <StatBox label="Avg. Score" value="—" />
      </div>

      {/* Sentiment */}
      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Sentiment Breakdown
        </p>
        <SentimentBar positive={0} neutral={0} negative={0} />
      </div>

      {/* Topics */}
      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Common Topics
        </p>
        <div className="flex flex-wrap gap-2">
          {["Pricing", "Results", "Staff", "Logistics"].map(topic => (
            <span key={topic} className="rounded-full border border-border/60 bg-white px-2.5 py-0.5 text-xs text-muted-foreground">
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Trust score */}
      {clinic.trustScore > 0 && (
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Trust Score
          </p>
          <div className="flex items-baseline gap-2">
            <span className={cn("text-3xl font-bold tabular-nums", accentClass)}>
              {clinic.trustScore}
            </span>
            <span className="text-sm text-muted-foreground">/ 100</span>
            {clinic.trustBand && (
              <span className="ml-auto rounded-full bg-[var(--im-color-primary)]/10 px-3 py-0.5 text-xs font-bold text-[var(--im-color-primary)]">
                Band {clinic.trustBand}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-dashed border-border bg-muted/10 p-5 text-center text-sm text-muted-foreground flex-1">
        Full Reddit intelligence coming soon
      </div>

      <Button variant="outline" size="sm" onClick={onDeselect} className="w-full shrink-0">
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Change clinic
      </Button>
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
