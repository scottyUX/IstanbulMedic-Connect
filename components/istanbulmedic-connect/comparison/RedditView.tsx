"use client"

import { ArrowLeft, MapPin } from "lucide-react"
import { Merriweather } from "next/font/google"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ClinicListItem } from "@/lib/api/clinics"
import { useClinicCompareSignals } from "./useClinicCompareSignals"

const merriweather = Merriweather({ subsets: ["latin"], weight: ["700"] })

interface RedditViewProps {
  clinic: ClinicListItem
  onDeselect: () => void
  accentClass: string
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

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-border/60 bg-white p-3 text-center">
      <span className="text-xl font-bold text-foreground tabular-nums">{value}</span>
      <span className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  )
}

export function RedditView({ clinic, onDeselect }: RedditViewProps) {
  const { data: signals, loading } = useClinicCompareSignals(clinic.id, clinic.name)
  const reddit = signals?.reddit ?? null

  const dist = reddit?.sentimentDistribution ?? {}
  const distTotal = (Object.values(dist) as number[]).reduce((s, n) => s + n, 0)
  const sentimentScore = reddit?.sentimentScore ?? null
  const sentimentTotal = distTotal > 0 ? distTotal : sentimentScore != null ? 100 : 0
  const pos = distTotal > 0 ? (dist.positive ?? 0) : Math.round((sentimentScore ?? 0) * 100)
  const neu = distTotal > 0 ? (dist.neutral  ?? 0) : 0
  const neg = distTotal > 0 ? (dist.negative ?? 0) : Math.round((1 - (sentimentScore ?? 0)) * 100)

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white border border-border/40 shadow-sm">
          <svg className="h-9 w-9" viewBox="0 0 24 24" fill="#FF4500">
            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
          </svg>
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

      {/* AI Summary — only shown when available */}
      {!loading && reddit?.aiSummary && (
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            AI Summary
          </p>
          <p className="text-sm text-foreground leading-relaxed">{reddit.aiSummary}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatBox label="Threads"         value={loading ? "—" : reddit?.threadCount         ?? "—"} />
        <StatBox label="Long-term"       value={loading ? "—" : reddit?.longtermThreadCount ?? "—"} />
        <StatBox label="Repair mentions" value={loading ? "—" : reddit?.repairMentionCount  ?? "—"} />
      </div>

      {/* Sentiment */}
      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Sentiment Breakdown
        </p>
        {loading ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : sentimentTotal > 0 ? (
          <div className="space-y-1.5">
            <SentimentRow color="bg-emerald-500"      label="Positive" count={pos} total={sentimentTotal} />
            <SentimentRow color="bg-muted-foreground/30" label="Neutral"  count={neu} total={sentimentTotal} />
            <SentimentRow color="bg-rose-400"         label="Negative" count={neg} total={sentimentTotal} />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No data yet</p>
        )}
      </div>

      {/* Common Topics */}
      {(loading || (reddit?.commonConcerns ?? []).length > 0) && (
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Common Topics
          </p>
          {loading ? (
            <span className="text-xs text-muted-foreground">—</span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(reddit?.commonConcerns ?? []).map(topic => (
                <span key={topic} className="rounded-full border border-border/60 bg-white px-2.5 py-0.5 text-xs text-muted-foreground capitalize">
                  {topic.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <Button variant="outline" size="sm" onClick={onDeselect} className="w-full shrink-0 mt-auto">
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Change clinic
      </Button>
    </div>
  )
}
