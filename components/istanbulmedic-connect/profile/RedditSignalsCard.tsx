"use client"

import { useState } from "react"
import {
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  Clock,
  Users,
  Wrench,
  Info,
  ChevronDown,
  Sparkles,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { ClinicForumProfile } from "@/lib/api/forumSignals"

// ── Reddit SVG icon ────────────────────────────────────────────────────────────

function RedditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
    </svg>
  )
}

// ── Types ──────────────────────────────────────────────────────────────────────

type SignalStatus = "positive" | "concern"

interface Signal {
  id: string
  label: string
  icon: React.ReactNode
  status: SignalStatus
  metric: string
  statusText: string
  explanation: string
}

// ── Build signals from profile data ───────────────────────────────────────────

function buildSignals(data: ClinicForumProfile): Signal[] {
  return [
    {
      id: "volume",
      label: "Discussion Volume",
      icon: <MessageSquare className="h-4 w-4" />,
      status: data.threadCount >= 3 ? "positive" : "concern",
      metric: `${data.threadCount} thread${data.threadCount !== 1 ? "s" : ""}`,
      statusText: data.threadCount >= 3 ? "Enough to assess" : "Limited data",
      explanation: data.threadCount >= 3
        ? "We found enough threads to form a reasonable picture of patient experiences."
        : "Fewer than 3 threads found. Signals may not be representative. Check back as more data is collected.",
    },
    {
      id: "longterm",
      label: "Long-term Evidence",
      icon: <Clock className="h-4 w-4" />,
      status: data.longtermThreadCount > 0 ? "positive" : "concern",
      metric: `${data.longtermThreadCount} thread${data.longtermThreadCount !== 1 ? "s" : ""}`,
      statusText: data.longtermThreadCount > 0 ? "Has 6m+ updates" : "No long-term updates",
      explanation: data.longtermThreadCount > 0
        ? "At least one thread includes a follow-up at 6 months or more. Long-term outcomes are a key quality signal."
        : "No threads with 6-month or longer follow-ups found. Long-term outcomes are the best indicator of result quality.",
    },
    {
      id: "repair",
      label: "Repair Mentions",
      icon: <Wrench className="h-4 w-4" />,
      status: data.repairMentionCount === 0 ? "positive" : "concern",
      metric: data.repairMentionCount === 0 ? "None found" : `${data.repairMentionCount} mention${data.repairMentionCount !== 1 ? "s" : ""}`,
      statusText: data.repairMentionCount === 0 ? "None found" : "Mentioned",
      explanation: data.repairMentionCount === 0
        ? "No threads mention repair or revision procedures following treatment at this clinic."
        : `${data.repairMentionCount} thread${data.repairMentionCount !== 1 ? "s" : ""} mention repair or revision work. This could indicate complications — read the threads carefully.`,
    },
    ...(data.uniqueAuthorsCount != null ? [{
      id: "unique_authors",
      label: "Unique Voices",
      icon: <Users className="h-4 w-4" />,
      status: (data.uniqueAuthorsCount >= 3 ? "positive" : "concern") as SignalStatus,
      metric: `${data.uniqueAuthorsCount} author${data.uniqueAuthorsCount !== 1 ? "s" : ""}`,
      statusText: data.uniqueAuthorsCount >= 3 ? "Multiple patients" : "Few authors",
      explanation: data.uniqueAuthorsCount >= 3
        ? "Multiple different patients have shared experiences, reducing the risk of biased or single-source data."
        : "Only a few unique authors found. More independent accounts would give a clearer picture.",
    }] : []),
  ]
}

// ── Sentiment bar ─────────────────────────────────────────────────────────────

function SentimentBar({ score }: { score: number }) {
  // score: -1 (negative) to +1 (positive) → map to 0–100%
  const position = Math.round(((score + 1) / 2) * 100)
  const status: SignalStatus = score >= 0 ? "positive" : "concern"

  return (
    <div className="relative w-full h-2">
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-300 via-gray-200 to-emerald-300" />
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all"
        style={{ left: `${position}%` }}
      >
        <div
          className={cn(
            "w-3 h-3 rounded-full border-2 border-white shadow-md",
            status === "positive" ? "bg-emerald-500" : "bg-amber-500"
          )}
        />
      </div>
    </div>
  )
}

// ── Signal row ────────────────────────────────────────────────────────────────

function SignalRow({
  signal,
  isExpanded,
  onToggle,
}: {
  signal: Signal
  isExpanded: boolean
  onToggle: () => void
}) {
  const isPositive = signal.status === "positive"

  return (
    <div className="border-b border-border/40 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3 px-1 hover:bg-muted/50 transition-colors rounded-md"
      >
        <div className="flex items-center gap-3 min-w-[140px]">
          <span className={cn("h-4 w-4", isPositive ? "text-emerald-600" : "text-amber-600")}>
            {signal.icon}
          </span>
          <span className="text-sm font-medium text-foreground">{signal.label}</span>
        </div>

        <div className="flex items-center gap-3">
          {isPositive
            ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            : <AlertTriangle className="h-5 w-5 text-amber-500" />
          }
          <span className="text-xs font-medium text-muted-foreground w-[90px] text-left">
            {signal.metric}
          </span>
          <span className={cn(
            "text-xs font-medium hidden sm:inline w-[100px] text-right",
            isPositive ? "text-emerald-600" : "text-amber-600"
          )}>
            {signal.statusText}
          </span>
          <ChevronDown className={cn(
            "h-4 w-4 text-muted-foreground transition-transform flex-shrink-0",
            isExpanded && "rotate-180"
          )} />
        </div>
      </button>

      {isExpanded && (
        <div className={cn(
          "mx-1 mb-3 p-3 rounded-lg text-sm",
          isPositive ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"
        )}>
          <div className="flex gap-2">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>{signal.explanation}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  })
}

function sentimentLabel(score: number): string {
  if (score >= 0.4) return "Mostly positive"
  if (score >= 0.1) return "Generally positive"
  if (score >= -0.1) return "Mixed"
  if (score >= -0.4) return "Generally negative"
  return "Mostly negative"
}

function scoreConfidenceTier(threadCount: number): string {
  if (threadCount >= 15) return "High confidence"
  if (threadCount >= 6)  return "Moderate"
  return "Low confidence"
}

const SCORE_TOOLTIP = [
  "Reddit Score is based on:",
  "• Patient sentiment across attributed posts (recent posts weighted more heavily)",
  "• Long-term follow-up rate (posts with 6-month+ updates)",
  "• Repair and revision case rate",
  "• Severity of reported issues (e.g. overharvesting, infection)",
  "",
  "Clinics with fewer than 3 posts show no score. Scores reflect self-reported",
  "experiences on Reddit, not clinical outcomes. Highly satisfied and dissatisfied",
  "patients are both more likely to post.",
].join("\n")

// ── Main component ────────────────────────────────────────────────────────────

export function RedditSignalsCard({ data }: { data: ClinicForumProfile }) {
  const [expandedSignals, setExpandedSignals] = useState<Set<string>>(new Set())
  const [showAllMentions, setShowAllMentions] = useState(false)

  const signals = buildSignals(data)

  const handleToggle = (id: string) => {
    setExpandedSignals(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const visibleMentions = showAllMentions
    ? data.notableThreads
    : data.notableThreads.slice(0, 3)

  return (
    <Card variant="profile" className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF4500]">
              <RedditIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="im-heading-4 text-foreground">Community Discussion</h3>
              <p className="text-xs text-muted-foreground">
                {data.threadCount} thread{data.threadCount !== 1 ? "s" : ""} across Reddit
                {data.uniqueAuthorsCount != null && ` · ${data.uniqueAuthorsCount} authors`}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-0.5">
            {data.score != null ? (
              <>
                <div className="flex items-center gap-1">
                  <span className={cn(
                    "text-2xl font-bold tabular-nums leading-none",
                    data.score >= 7.5 ? "text-emerald-600"
                      : data.score >= 5.0 ? "text-amber-600"
                      : "text-red-600"
                  )}>
                    {data.score.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground leading-none">/&nbsp;10</span>
                  <button title={SCORE_TOOLTIP} className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors">
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">{scoreConfidenceTier(data.threadCount)}</p>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">Insufficient data</span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Signal rows */}
        <div>
          {signals.map(signal => (
            <SignalRow
              key={signal.id}
              signal={signal}
              isExpanded={expandedSignals.has(signal.id)}
              onToggle={() => handleToggle(signal.id)}
            />
          ))}
        </div>

        {/* AI-assisted section */}
        {(data.sentimentScore != null || data.commonConcerns.length > 0 || data.summary) && (
          <div className="pt-1 border-t border-border/60 space-y-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                AI-assisted interpretation
              </span>
            </div>

            {/* Summary */}
            {data.summary && (
              <p className="text-sm text-muted-foreground leading-relaxed">{data.summary}</p>
            )}

            {/* Sentiment bar */}
            {data.sentimentScore != null && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Community sentiment</span>
                  <span className={cn(
                    "font-medium",
                    data.sentimentScore >= 0 ? "text-emerald-600" : "text-amber-600"
                  )}>
                    {sentimentLabel(data.sentimentScore)}
                  </span>
                </div>
                <SentimentBar score={data.sentimentScore} />
              </div>
            )}

            {/* Pros */}
            {data.pros.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Frequently praised:</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.pros.map(pro => (
                    <span
                      key={pro}
                      className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
                    >
                      {pro.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Common concerns */}
            {data.commonConcerns.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Recurring concerns:</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.commonConcerns.map(concern => (
                    <span
                      key={concern}
                      className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200"
                    >
                      {concern.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notable threads */}
        {data.notableThreads.length > 0 && (
          <div className="pt-1 border-t border-border/60 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Notable threads</p>
            <div className="space-y-2">
              {visibleMentions.map((thread, i) => (
                <a
                  key={i}
                  href={thread.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-muted/40 hover:bg-muted transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground line-clamp-1 group-hover:underline">
                      {thread.title}
                    </p>
                    {thread.summary && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {thread.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {thread.sentiment && (
                        <span className={cn(
                          "text-xs",
                          thread.sentiment === "positive" ? "text-emerald-600"
                            : thread.sentiment === "negative" ? "text-amber-600"
                              : "text-muted-foreground"
                        )}>
                          {thread.sentiment}
                        </span>
                      )}
                      {thread.has_photos && (
                        <span className="text-xs text-muted-foreground">📷 photos</span>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                </a>
              ))}
            </div>
            {data.notableThreads.length > 3 && (
              <button
                onClick={() => setShowAllMentions(v => !v)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showAllMentions ? "Show fewer" : `Show all ${data.notableThreads.length} threads`}
              </button>
            )}
          </div>
        )}

        {/* Last updated */}
        <p className="text-xs text-muted-foreground text-center pt-1">
          Data last updated: {formatDate(data.updatedAt)}
        </p>
      </CardContent>
    </Card>
  )
}
