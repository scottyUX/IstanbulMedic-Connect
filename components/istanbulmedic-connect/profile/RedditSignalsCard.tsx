"use client"

import { useState, useEffect } from "react"
import {
  ExternalLink,
  Camera,
  CalendarCheck,
  Wrench,
  Info,
  Sparkles,
  X,
  CheckCircle2,
  FileText,
  MessageSquare,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { RedditSignalsData, RedditThread } from "@/lib/api/reddit"

// ── Reddit SVG icon ────────────────────────────────────────────────────────────

function RedditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
    </svg>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  })
}

function scoreConfidenceTier(threadCount: number): "high" | "moderate" | "low" {
  if (threadCount >= 15) return "high"
  if (threadCount >= 6)  return "moderate"
  return "low"
}

function buildSentimentSummary(dist: { positive: number; mixed: number; negative: number }): string {
  const total = dist.positive + dist.mixed + dist.negative
  if (total === 0) return "No sentiment data"
  const posPct = Math.round((dist.positive / total) * 100)
  const negPct = Math.round((dist.negative / total) * 100)
  if (posPct >= 70) return "Mostly positive"
  if (posPct >= 50) return "Generally positive · Some mixed experiences"
  if (negPct >= 40) return "Largely negative · Significant concerns reported"
  return "Mixed experiences across posts and comments"
}

// ── Score info popover ────────────────────────────────────────────────────────

function ScoreInfoPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors" aria-label="How is this score calculated?">
          <Info className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-sm" align="end">
        <p className="font-medium mb-2">Reddit Score is based on:</p>
        <ul className="space-y-1 text-muted-foreground list-disc list-inside">
          <li>Patient sentiment across attributed posts (recent posts weighted more heavily)</li>
          <li>Long-term follow-up rate (posts with 6-month+ updates)</li>
          <li>Repair and revision case rate</li>
          <li>Severity of reported issues (e.g. overharvesting, infection)</li>
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          Clinics with fewer than 3 posts show no score. Scores reflect self-reported
          experiences on Reddit, not clinical outcomes.
        </p>
      </PopoverContent>
    </Popover>
  )
}

// ── Sentiment badge ───────────────────────────────────────────────────────────

function SentimentBadge({ label }: { label: "positive" | "mixed" | "negative" }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
      label === "positive" && "bg-emerald-100 text-emerald-700",
      label === "mixed"    && "bg-yellow-100 text-yellow-700",
      label === "negative" && "bg-red-100 text-red-700",
    )}>
      {{ positive: "Positive", mixed: "Mixed", negative: "Negative" }[label]}
    </span>
  )
}

// ── Thread item ───────────────────────────────────────────────────────────────

function ThreadItem({ thread }: { thread: RedditThread }) {
  return (
    <div className="py-3 border-b border-border/40 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <a
            href={thread.threadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            <span className="line-clamp-2 group-hover:underline">{thread.title}</span>
            <ExternalLink className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
          </a>
          {thread.summaryShort && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{thread.summaryShort}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <SentimentBadge label={thread.sentimentLabel} />
            {thread.hasPhotos && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                <Camera className="h-3 w-3" />
                Photos
              </span>
            )}
            {thread.hasLongTermFollowup && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                <CalendarCheck className="h-3 w-3" />
                12+ months
              </span>
            )}
            {thread.isRepairCase && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                <Wrench className="h-3 w-3" />
                Repair case
              </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 text-right pt-0.5 space-y-0.5">
          {thread.subreddit && (
            <p className="text-xs text-muted-foreground">r/{thread.subreddit}</p>
          )}
          <p className="text-xs text-muted-foreground">{formatDate(thread.postDate)}</p>
        </div>
      </div>
    </div>
  )
}

// ── Thread modal ──────────────────────────────────────────────────────────────

type ModalVariant = "all" | "repair" | "longterm"

interface ThreadModalProps {
  variant: ModalVariant
  threads: RedditThread[]
  clinicName?: string
  onClose: () => void
}

function ThreadModal({ variant, threads, clinicName = "", onClose }: ThreadModalProps) {
  const config = {
    all: {
      title: `All ${threads.length} threads — ${clinicName}`,
      subtitle: null,
      icon: <FileText className="h-5 w-5 text-muted-foreground" />,
      notice: null,
    },
    repair: {
      title: `${threads.length} Repair Case Thread${threads.length === 1 ? "" : "s"}`,
      subtitle: null,
      icon: <Wrench className="h-5 w-5 text-amber-600" />,
      notice: "These threads involve hair transplant repair procedures. Some were repairs performed at this clinic; others were repairs needed after treatment elsewhere. Read each thread directly for full context.",
    },
    longterm: {
      title: `${threads.length} Thread${threads.length === 1 ? "" : "s"} with 6+ Month Follow-ups`,
      subtitle: null,
      icon: <CalendarCheck className="h-5 w-5 text-emerald-600" />,
      notice: null,
    },
  }[variant]

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative z-10 w-full max-w-lg rounded-xl bg-background shadow-xl flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            {config.icon}
            <div>
              <h3 className="text-sm font-semibold text-foreground">{config.title}</h3>
              {config.subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">{config.subtitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {config.notice && (
          <div className="mx-5 mt-4 flex gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>{config.notice}</p>
          </div>
        )}

        <div className="overflow-y-auto flex-1 px-5">
          {threads.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No threads to show.</p>
          ) : (
            threads.map(thread => (
              <ThreadItem key={thread.threadId} thread={thread} />
            ))
          )}
        </div>

        <div className="px-5 py-3 border-t border-border/60">
          <p className="text-xs text-muted-foreground text-center">Source: Reddit</p>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function RedditSignalsCard({ data }: { data: RedditSignalsData }) {
  const [openModal, setOpenModal] = useState<ModalVariant | null>(null)

  const { combinedSentimentDistribution: dist, qualifiedCommentCount } = data

  const sentTotal = dist.positive + dist.mixed + dist.negative
  const posPct = sentTotal > 0 ? Math.round((dist.positive / sentTotal) * 100) : 0
  const mixPct = sentTotal > 0 ? Math.round((dist.mixed / sentTotal) * 100) : 0
  const negPct = sentTotal > 0 ? 100 - posPct - mixPct : 0

  const threadCount = data.threadCount
  const longtermThreads = data.allThreads.filter(t => t.hasLongTermFollowup)
  const longtermCount = longtermThreads.length
  const repairCount = data.repairThreads.length

  const followupPct = threadCount > 0 ? Math.round((longtermCount / threadCount) * 100) : 0
  const repairPct   = threadCount > 0 ? Math.round((repairCount / threadCount) * 100) : 0

  const previewThreads = data.allThreads.slice(0, 3)
  const tier = data.score != null ? scoreConfidenceTier(threadCount) : null

  return (
    <>
      <Card variant="profile">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF4500] flex-shrink-0">
                <RedditIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="im-heading-4 text-foreground">Community Discussion</h3>
                <p className="text-xs text-muted-foreground">Reddit</p>
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
                    <ScoreInfoPopover />
                  </div>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    tier === "high"     && "bg-emerald-50 text-emerald-700",
                    tier === "moderate" && "bg-amber-50 text-amber-700",
                    tier === "low"      && "bg-red-50 text-red-700",
                  )}>
                    {tier === "high"     && "Score confidence: High"}
                    {tier === "moderate" && "Score confidence: Moderate"}
                    {tier === "low"      && "Score confidence: Low"}
                  </span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">Insufficient data</span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">

          {/* Sentiment bar */}
          {sentTotal > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-foreground">Community Sentiment</span>
                  <span className="group relative inline-flex items-center gap-1 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 cursor-help">
                    <Sparkles className="h-2.5 w-2.5" />
                    AI-assisted
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-56 rounded-md bg-foreground px-2.5 py-1.5 text-[11px] text-background opacity-0 group-hover:opacity-100 transition-opacity z-10 leading-snug">
                      Sentiment is determined by AI analysis of each post and qualifying comment. It reflects the overall tone, not a manual review.
                    </span>
                  </span>
                </div>
                <span className="text-xs font-semibold text-emerald-600">{posPct}% positive</span>
              </div>

              <div className="flex h-2 w-full overflow-hidden rounded-full">
                {posPct > 0 && <div className="bg-emerald-400" style={{ width: `${posPct}%` }} />}
                {mixPct > 0 && <div className="bg-yellow-300" style={{ width: `${mixPct}%` }} />}
                {negPct > 0 && <div className="bg-red-400" style={{ width: `${negPct}%` }} />}
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                  Positive {dist.positive}
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-yellow-300" />
                  Mixed {dist.mixed}
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
                  Negative {dist.negative}
                </span>
              </div>

              <p className="text-xs text-muted-foreground italic">
                {buildSentimentSummary(dist)}
              </p>
            </div>
          )}

          {/* Stats list */}
          <div className="space-y-0 rounded-lg border border-border/40 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-2.5 bg-background">
              <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-foreground">
                  <span className="font-medium">{threadCount}</span> posts found
                </span>
                {qualifiedCommentCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {qualifiedCommentCount} comment{qualifiedCommentCount !== 1 ? "s" : ""} analyzed
                    <span className="text-muted-foreground/60"> · comments from posts with less than 5 upvotes excluded</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2.5 bg-background border-t border-border/40">
              <CalendarCheck className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <span className="text-sm text-foreground flex-1">
                <span className="font-medium">{followupPct}%</span> have 6+ month follow-ups
                <span className="text-muted-foreground"> ({longtermCount}/{threadCount})</span>
              </span>
              {longtermCount > 0 && (
                <button
                  onClick={() => setOpenModal("longterm")}
                  className="text-xs font-medium text-primary hover:underline flex-shrink-0"
                >
                  See context →
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/20 border-t border-border/40">
              {repairCount === 0
                ? <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                : <Wrench className="h-4 w-4 text-amber-500 flex-shrink-0" />
              }
              <span className="text-sm text-foreground flex-1">
                {repairCount === 0
                  ? <span className="text-emerald-700 font-medium">No repair case threads</span>
                  : <>
                      <span className="font-medium">{repairCount}</span> repair case thread{repairCount === 1 ? "" : "s"}
                      <span className="text-muted-foreground"> ({repairPct}% of total)</span>
                    </>
                }
              </span>
              {repairCount > 0 && (
                <button
                  onClick={() => setOpenModal("repair")}
                  className="text-xs font-medium text-primary hover:underline flex-shrink-0"
                >
                  See context →
                </button>
              )}
            </div>
          </div>

          {/* Topic tags */}
          {(data.pros.length > 0 || data.commonConcerns.length > 0) && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Discussed topics</p>
              <div className="flex flex-wrap gap-1.5">
                {data.pros.map(topic => (
                  <span key={topic} className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs text-emerald-700">
                    {topic.replace(/_/g, " ")}
                  </span>
                ))}
                {data.commonConcerns.map(topic => (
                  <span key={topic} className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs text-amber-700">
                    {topic.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent threads preview */}
          {previewThreads.length > 0 && (
            <div className="space-y-0">
              <p className="text-xs font-medium text-muted-foreground mb-1">Recent Threads</p>
              {previewThreads.map(thread => (
                <ThreadItem key={thread.threadId} thread={thread} />
              ))}

              {data.allThreads.length > 3 && (
                <button
                  onClick={() => setOpenModal("all")}
                  className="mt-3 w-full rounded-lg border border-border/60 bg-muted/30 py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  View all {threadCount} threads →
                </button>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center pt-1">
            Data last updated: {formatDate(data.updatedAt)} · Source: Reddit
          </p>
        </CardContent>
      </Card>

      {openModal === "longterm" && (
        <ThreadModal
          variant="longterm"
          threads={longtermThreads}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === "repair" && (
        <ThreadModal
          variant="repair"
          threads={data.repairThreads}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === "all" && (
        <ThreadModal
          variant="all"
          threads={data.allThreads}
          clinicName={data.clinicName}
          onClose={() => setOpenModal(null)}
        />
      )}
    </>
  )
}
