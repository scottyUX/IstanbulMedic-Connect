"use client"

import { useState, useEffect } from "react"
import {
  ExternalLink,
  Camera,
  CalendarCheck,
  Wrench,
  FileText,
  Info,
  Sparkles,
  X,
  CheckCircle2,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HRNThread {
  threadUrl: string
  title: string
  summaryShort: string
  sentimentLabel: "positive" | "mixed" | "negative"
  isRepairCase: boolean
  hasPhotos: boolean
  photoCount: number
  hasLongTermFollowup: boolean
  postDate: string
}

export interface HRNSignalsData {
  clinicName: string
  totalThreads: number
  lastUpdated: string

  // Stats
  photoThreads: number
  longTermFollowups: number
  repairCases: number

  // Sentiment counts (component computes percentages)
  sentiment: {
    positive: number
    mixed: number
    negative: number
  }

  // Top aggregated main_topics across threads (raw, prettified in component)
  topTopics: string[]

  // Thread lists
  photoThreadsList: HRNThread[]
  allThreads: HRNThread[]

  // Optional pre-computed score (0–10). Absent = "Coming soon"
  hrnScore?: number
}

// ── Demo data ─────────────────────────────────────────────────────────────────

export const DEMO_HRN_SIGNALS: HRNSignalsData = {
  clinicName: "Vera Clinic",
  hrnScore: 7.8,
  totalThreads: 23,
  lastUpdated: "2026-04-01T00:00:00Z",
  photoThreads: 14,
  longTermFollowups: 8,
  repairCases: 1,
  sentiment: { positive: 15, mixed: 6, negative: 2 },
  topTopics: ["healing", "density", "hairline", "donor_area", "communication"],
  photoThreadsList: [
    {
      threadUrl: "https://www.hairrestorationnetwork.com/topic/57598-9-months-results-dr-taleb-barghouthi/",
      title: "9 months results — Dr. Taleb Barghouthi",
      summaryShort: "Patient reports strong density at 9 months with no complications. Clear improvement visible in photos.",
      sentimentLabel: "positive",
      isRepairCase: false,
      hasPhotos: true,
      photoCount: 23,
      hasLongTermFollowup: false,
      postDate: "2024-08-31T00:00:00Z",
    },
    {
      threadUrl: "https://www.hairrestorationnetwork.com/topic/61571-my-story-2580-fue-may-10-2021/",
      title: "My story: 2580 FUE — 12 month diary",
      summaryShort: "Detailed diary from day 1 through 12 months. Final density exceeded expectations according to patient.",
      sentimentLabel: "positive",
      isRepairCase: false,
      hasPhotos: true,
      photoCount: 41,
      hasLongTermFollowup: true,
      postDate: "2024-05-10T00:00:00Z",
    },
    {
      threadUrl: "https://www.hairrestorationnetwork.com/topic/62345-1-year-fue-update-istanbul/",
      title: "1 year FUE update — Istanbul clinic",
      summaryShort: "Mixed results at 1 year. Density in crown area improved but hairline slightly uneven.",
      sentimentLabel: "mixed",
      isRepairCase: false,
      hasPhotos: true,
      photoCount: 9,
      hasLongTermFollowup: true,
      postDate: "2024-03-15T00:00:00Z",
    },
    {
      threadUrl: "https://www.hairrestorationnetwork.com/topic/63010-6-month-results-fue-2800-grafts/",
      title: "6 month results — 2800 grafts FUE",
      summaryShort: "Early 6 month update showing promising growth. Patient plans a 12 month follow-up post.",
      sentimentLabel: "positive",
      isRepairCase: false,
      hasPhotos: true,
      photoCount: 14,
      hasLongTermFollowup: false,
      postDate: "2024-01-20T00:00:00Z",
    },
  ],
  allThreads: [
    {
      threadUrl: "https://www.hairrestorationnetwork.com/topic/57598-9-months-results-dr-taleb-barghouthi/",
      title: "9 months results — Dr. Taleb Barghouthi",
      summaryShort: "Patient reports strong density at 9 months with no complications. Clear improvement visible in photos.",
      sentimentLabel: "positive",
      isRepairCase: false,
      hasPhotos: true,
      photoCount: 23,
      hasLongTermFollowup: false,
      postDate: "2026-03-10T00:00:00Z",
    },
    {
      threadUrl: "https://www.hairrestorationnetwork.com/topic/61571-my-story-2580-fue-may-10-2021/",
      title: "My story: 2580 FUE — 12 month diary",
      summaryShort: "Detailed diary from day 1 through 12 months. Final density exceeded expectations according to patient.",
      sentimentLabel: "positive",
      isRepairCase: false,
      hasPhotos: true,
      photoCount: 41,
      hasLongTermFollowup: true,
      postDate: "2026-02-14T00:00:00Z",
    },
    {
      threadUrl: "https://www.hairrestorationnetwork.com/topic/63489-repair-after-previous-clinic/",
      title: "Repair procedure — previous clinic botch",
      summaryShort: "Patient sought repair after a poor result elsewhere. Documents the correction procedure and early recovery.",
      sentimentLabel: "mixed",
      isRepairCase: true,
      hasPhotos: true,
      photoCount: 6,
      hasLongTermFollowup: false,
      postDate: "2026-01-28T00:00:00Z",
    },
    {
      threadUrl: "https://www.hairrestorationnetwork.com/topic/62345-1-year-fue-update-istanbul/",
      title: "1 year FUE update — Istanbul clinic",
      summaryShort: "Mixed results at 1 year. Density in crown area improved but hairline slightly uneven.",
      sentimentLabel: "mixed",
      isRepairCase: false,
      hasPhotos: true,
      photoCount: 9,
      hasLongTermFollowup: true,
      postDate: "2025-11-03T00:00:00Z",
    },
    {
      threadUrl: "https://www.hairrestorationnetwork.com/topic/63010-6-month-results-fue-2800-grafts/",
      title: "6 month results — 2800 grafts FUE",
      summaryShort: "Early 6 month update showing promising growth. Patient plans a 12 month follow-up post.",
      sentimentLabel: "positive",
      isRepairCase: false,
      hasPhotos: true,
      photoCount: 14,
      hasLongTermFollowup: false,
      postDate: "2025-09-17T00:00:00Z",
    },
  ],
}

export const DEMO_HRN_SIGNALS_CONCERN: HRNSignalsData = {
  clinicName: "Selda Center",
  totalThreads: 11,
  lastUpdated: "2026-04-01T00:00:00Z",
  photoThreads: 4,
  longTermFollowups: 2,
  repairCases: 4,
  sentiment: { positive: 4, mixed: 4, negative: 3 },
  topTopics: ["healing", "density", "communication"],
  photoThreadsList: [
    {
      threadUrl: "https://www.hairrestorationnetwork.com/topic/60073-1-year-post-op-selda-center/",
      title: "1 year post-op — Selda Center",
      summaryShort: "Patient disappointed with density at 1 year. Significant shock loss in recipient area.",
      sentimentLabel: "negative",
      isRepairCase: false,
      hasPhotos: true,
      photoCount: 7,
      hasLongTermFollowup: true,
      postDate: "2025-08-12T00:00:00Z",
    },
  ],
  allThreads: [
    {
      threadUrl: "https://www.hairrestorationnetwork.com/topic/60073-1-year-post-op-selda-center/",
      title: "1 year post-op — Selda Center",
      summaryShort: "Patient disappointed with density at 1 year. Significant shock loss in recipient area.",
      sentimentLabel: "negative",
      isRepairCase: false,
      hasPhotos: true,
      photoCount: 7,
      hasLongTermFollowup: true,
      postDate: "2026-03-02T00:00:00Z",
    },
    {
      threadUrl: "https://www.hairrestorationnetwork.com/topic/62011-repair-case-maitland-clinic/",
      title: "Repair case — Maitland Clinic",
      summaryShort: "Patient documents a repair procedure after unsatisfactory original transplant. Describes post-op complications.",
      sentimentLabel: "negative",
      isRepairCase: true,
      hasPhotos: false,
      photoCount: 0,
      hasLongTermFollowup: false,
      postDate: "2026-01-15T00:00:00Z",
    },
    {
      threadUrl: "https://www.hairrestorationnetwork.com/topic/61900-8-month-update-mixed-results/",
      title: "8 month update — mixed results",
      summaryShort: "Some growth visible at 8 months but patient expected more density by this stage.",
      sentimentLabel: "mixed",
      isRepairCase: false,
      hasPhotos: true,
      photoCount: 4,
      hasLongTermFollowup: false,
      postDate: "2025-11-20T00:00:00Z",
    },
  ],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TOPIC_LABELS: Record<string, string> = {
  healing: "Healing",
  density: "Density",
  hairline: "Hairline",
  donor_area: "Donor Area",
  donor: "Donor Area",
  communication: "Communication",
  value: "Value for Money",
  other: "Other",
}

function prettifyTopic(topic: string): string {
  return TOPIC_LABELS[topic.toLowerCase()] ?? topic.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function getSentimentLabel(label: "positive" | "mixed" | "negative"): string {
  return { positive: "Positive", mixed: "Mixed", negative: "Negative" }[label]
}

function buildSentimentSummary(sentiment: HRNSignalsData["sentiment"]): string {
  const total = sentiment.positive + sentiment.mixed + sentiment.negative
  if (total === 0) return "No sentiment data"
  const posPct = Math.round((sentiment.positive / total) * 100)
  const negPct = Math.round((sentiment.negative / total) * 100)

  if (posPct >= 70) return "Mostly positive"
  if (posPct >= 50) return "Generally positive · Some mixed experiences"
  if (negPct >= 40) return "Largely negative · Significant concerns reported"
  return "Mixed experiences across threads"
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SentimentBadge({ label }: { label: "positive" | "mixed" | "negative" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        label === "positive" && "bg-emerald-100 text-emerald-700",
        label === "mixed" && "bg-yellow-100 text-yellow-700",
        label === "negative" && "bg-red-100 text-red-700",
      )}
    >
      {getSentimentLabel(label)}
    </span>
  )
}

function ThreadItem({ thread }: { thread: HRNThread }) {
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
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {thread.summaryShort}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <SentimentBadge label={thread.sentimentLabel} />
            {thread.hasPhotos && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                <Camera className="h-3 w-3" />
                {thread.photoCount > 0 ? `${thread.photoCount} photos` : "Photos"}
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
        <span className="flex-shrink-0 text-xs text-muted-foreground pt-0.5">
          {formatDate(thread.postDate)}
        </span>
      </div>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

type ModalVariant = "photos" | "repair" | "all"

interface ThreadModalProps {
  variant: ModalVariant
  threads: HRNThread[]
  totalThreads?: number
  clinicName?: string
  onClose: () => void
}

function ThreadModal({ variant, threads, totalThreads, clinicName = "", onClose }: ThreadModalProps) {
  const config = {
    photos: {
      title: `${threads.length} Threads with Photo Evidence`,
      subtitle: "Click any thread to view photos on Hair Restoration Network",
      icon: <Camera className="h-5 w-5 text-blue-600" />,
      notice: null,
    },
    repair: {
      title: `${threads.length} Repair Case Thread${threads.length === 1 ? "" : "s"}`,
      subtitle: null,
      icon: <Wrench className="h-5 w-5 text-amber-600" />,
      notice: "These threads involve hair transplant repair procedures. Some were repairs performed at this clinic; others were repairs needed after treatment elsewhere. Read each thread directly for full context.",
    },
    all: {
      title: `All ${totalThreads} Threads — ${clinicName}`,
      subtitle: "Source: Hair Restoration Network",
      icon: <FileText className="h-5 w-5 text-muted-foreground" />,
      notice: null,
    },
  }[variant]

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-lg rounded-xl bg-background shadow-xl flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
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

        {/* Neutral notice for repair modal */}
        {config.notice && (
          <div className="mx-5 mt-4 flex gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>{config.notice}</p>
          </div>
        )}

        {/* Thread list */}
        <div className="overflow-y-auto flex-1 px-5">
          {threads.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No threads to show.</p>
          ) : (
            threads.map(thread => (
              <ThreadItem key={thread.threadUrl} thread={thread} />
            ))
          )}
        </div>

        {/* Modal footer */}
        <div className="px-5 py-3 border-t border-border/60">
          <p className="text-xs text-muted-foreground text-center">
            Source: HairRestorationNetwork.com
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function HRNSignalsCard({ data = DEMO_HRN_SIGNALS }: { data?: HRNSignalsData }) {
  const [openModal, setOpenModal] = useState<ModalVariant | null>(null)

  const { sentiment, totalThreads, photoThreads, longTermFollowups, repairCases } = data

  const photoPct = totalThreads > 0 ? Math.round((photoThreads / totalThreads) * 100) : 0
  const followupPct = totalThreads > 0 ? Math.round((longTermFollowups / totalThreads) * 100) : 0
  const repairPct = totalThreads > 0 ? Math.round((repairCases / totalThreads) * 100) : 0

  const sentimentTotal = sentiment.positive + sentiment.mixed + sentiment.negative
  const posPct = sentimentTotal > 0 ? Math.round((sentiment.positive / sentimentTotal) * 100) : 0
  const mixPct = sentimentTotal > 0 ? Math.round((sentiment.mixed / sentimentTotal) * 100) : 0
  const negPct = sentimentTotal > 0 ? 100 - posPct - mixPct : 0

  const previewThreads = data.allThreads.slice(0, 3)
  const repairThreads = data.allThreads.filter(t => t.isRepairCase)

  return (
    <>
      <Card variant="profile" className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* HRN icon badge */}
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex-shrink-0">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="im-heading-4 text-foreground">Forum Evidence</h3>
                <div className="flex items-center gap-1">
                  <p className="text-xs text-muted-foreground">Hair Restoration Network</p>
                  <span className="group relative">
                    <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" />
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-52 rounded-md bg-foreground px-2.5 py-1.5 text-[11px] text-background opacity-0 group-hover:opacity-100 transition-opacity z-10 leading-snug">
                      The largest independent patient forum for hair transplant research. Posts are from real patients, not the clinic.
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Thread count badge */}
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {totalThreads} threads
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">

          {/* HRN Score */}
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-border/60 bg-muted/30 px-4 py-3">
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground">HRN Score</p>
              {data.hrnScore !== undefined
                ? <p className="text-2xl font-bold text-foreground tracking-tight">{data.hrnScore} <span className="text-sm font-normal text-muted-foreground">/ 10</span></p>
                : <p className="text-2xl font-bold text-muted-foreground/40 tracking-tight">— / 10</p>
              }
            </div>
            {data.hrnScore === undefined && (
              <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                Coming soon
              </span>
            )}
          </div>

          {/* Sentiment bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-foreground">Community Sentiment</span>
                <span className="group relative inline-flex items-center gap-1 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 cursor-help">
                  <Sparkles className="h-2.5 w-2.5" />
                  AI-assisted
                  <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-56 rounded-md bg-foreground px-2.5 py-1.5 text-[11px] text-background opacity-0 group-hover:opacity-100 transition-opacity z-10 leading-snug">
                    Sentiment is determined by AI analysis of each thread's text. It reflects the overall tone of patient posts, not a manual review.
                  </span>
                </span>
              </div>
              <span className="text-xs font-semibold text-emerald-600">{posPct}% positive</span>
            </div>

            {/* Segmented bar */}
            <div className="flex h-2 w-full overflow-hidden rounded-full">
              {posPct > 0 && (
                <div className="bg-emerald-400" style={{ width: `${posPct}%` }} />
              )}
              {mixPct > 0 && (
                <div className="bg-yellow-300" style={{ width: `${mixPct}%` }} />
              )}
              {negPct > 0 && (
                <div className="bg-red-400" style={{ width: `${negPct}%` }} />
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                Positive {sentiment.positive}
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-yellow-300" />
                Mixed {sentiment.mixed}
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
                Negative {sentiment.negative}
              </span>
            </div>

            <p className="text-xs text-muted-foreground italic">
              {buildSentimentSummary(sentiment)}
            </p>
          </div>

          {/* Stats list */}
          <div className="space-y-0 rounded-lg border border-border/40 overflow-hidden">
            {/* Total threads */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-background">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-foreground flex-1">
                <span className="font-medium">{totalThreads}</span> threads found
              </span>
            </div>

            {/* Photo threads */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/20 border-t border-border/40">
              <Camera className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <span className="text-sm text-foreground flex-1">
                <span className="font-medium">{photoPct}%</span> of threads include photos
                <span className="text-muted-foreground"> ({photoThreads}/{totalThreads})</span>
              </span>
              {data.photoThreadsList.length > 0 && (
                <button
                  onClick={() => setOpenModal("photos")}
                  className="text-xs font-medium text-primary hover:underline flex-shrink-0"
                >
                  View threads →
                </button>
              )}
            </div>

            {/* Long-term follow-ups */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-background border-t border-border/40">
              <CalendarCheck className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <span className="text-sm text-foreground flex-1">
                <span className="font-medium">{followupPct}%</span> have 12+ month follow-ups
                <span className="text-muted-foreground"> ({longTermFollowups}/{totalThreads})</span>
              </span>
            </div>

            {/* Repair cases */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/20 border-t border-border/40">
              {repairCases === 0
                ? <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                : <Wrench className="h-4 w-4 text-amber-500 flex-shrink-0" />
              }
              <span className="text-sm text-foreground flex-1">
                {repairCases === 0
                  ? <span className="text-emerald-700 font-medium">No repair case threads</span>
                  : <><span className="font-medium">{repairCases}</span> repair case thread{repairCases === 1 ? "" : "s"}
                    <span className="text-muted-foreground"> ({repairPct}% of total)</span></>
                }
              </span>
              {repairCases > 0 && (
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
          {data.topTopics.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Most discussed topics</p>
              <div className="flex flex-wrap gap-1.5">
                {data.topTopics.map(topic => (
                  <span
                    key={topic}
                    className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {prettifyTopic(topic)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent threads preview */}
          <div className="space-y-0">
            <p className="text-xs font-medium text-muted-foreground mb-1">Recent Threads</p>
            {previewThreads.map(thread => (
              <ThreadItem key={thread.threadUrl} thread={thread} />
            ))}

            {/* View all threads button */}
            {data.allThreads.length > 3 && (
              <button
                onClick={() => setOpenModal("all")}
                className="mt-3 w-full rounded-lg border border-border/60 bg-muted/30 py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                View all {totalThreads} threads →
              </button>
            )}
          </div>

          {/* Footer */}
          <p className="text-xs text-muted-foreground text-center pt-1">
            Data last updated: {formatDate(data.lastUpdated)} · Source: HairRestorationNetwork.com
          </p>
        </CardContent>
      </Card>

      {/* Modals */}
      {openModal === "photos" && (
        <ThreadModal
          variant="photos"
          threads={data.photoThreadsList}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === "repair" && (
        <ThreadModal
          variant="repair"
          threads={repairThreads}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === "all" && (
        <ThreadModal
          variant="all"
          threads={data.allThreads}
          totalThreads={totalThreads}
          clinicName={data.clinicName}
          onClose={() => setOpenModal(null)}
        />
      )}
    </>
  )
}
