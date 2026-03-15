"use client"

import { useState } from "react"
import {
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  MessageCircle,
  Calendar,
  Info,
  ChevronDown,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatNumber } from "@/lib/utils"

type SignalStatus = "positive" | "concern"
type SignalType = "percentile" | "boolean"

interface Signal {
  id: string
  label: string
  status: SignalStatus
  type: SignalType
  /** For percentile type: 0-100 percentile rank */
  percentile?: number
  /** The actual metric shown: "2.3%", "8/mo", etc. */
  metric?: string
  /** Tooltip explaining what the metric means */
  metricTooltip?: string
  /** Our interpretation: "Above average", "Low", "Enabled", etc. */
  statusText: string
  /** Educational explanation shown on expand */
  explanation: string
}

export interface InstagramSignalsData {
  username: string
  followersCount: number
  lastUpdated: string
  signals: Signal[]
}

// Static explanations for each signal type
const EXPLANATIONS = {
  engagement: {
    positive: "Genuine engagement suggests real patients are following and interacting with the clinic. This is a healthy sign.",
    concern: "Low engagement relative to follower count could indicate purchased followers or an inactive audience. Consider checking the comments yourself.",
  },
  commentsEnabled: {
    positive: "Allowing public comments shows transparency. You can read what others are saying about the clinic.",
    concern: "Disabling comments may indicate the clinic is hiding negative feedback. Consider this a yellow flag.",
  },
  verifiedBusiness: {
    positive: "Business accounts require extra verification steps, adding a layer of legitimacy.",
    concern: "Personal accounts aren't necessarily bad, but business accounts provide more accountability.",
  },
  postingActivity: {
    positive: "Regular posting suggests the clinic is active and engaged with their audience.",
    concern: "Infrequent posting may suggest the clinic is less active on social media. This isn't necessarily a problem, but you may find less content to review.",
  },
}

// Demo data
export const DEMO_INSTAGRAM_SIGNALS: InstagramSignalsData = {
  username: "veraclinic",
  followersCount: 47200,
  lastUpdated: "2026-03-01T00:00:00Z",
  signals: [
    {
      id: "engagement",
      label: "Engagement",
      status: "positive",
      type: "percentile",
      percentile: 72,
      metric: "2.3%",
      metricTooltip: "Avg. likes + comments per post ÷ followers",
      statusText: "Above average",
      explanation: EXPLANATIONS.engagement.positive,
    },
    {
      id: "postingActivity",
      label: "Posting Activity",
      status: "concern",
      type: "percentile",
      percentile: 25,
      metric: "3/mo",
      metricTooltip: "Average posts per month",
      statusText: "Below average",
      explanation: EXPLANATIONS.postingActivity.concern,
    },
    {
      id: "commentsEnabled",
      label: "Comments",
      status: "positive",
      type: "boolean",
      metric: "18/20 posts",
      statusText: "Enabled",
      explanation: EXPLANATIONS.commentsEnabled.positive,
    },
    {
      id: "verifiedBusiness",
      label: "Business Account",
      status: "positive",
      type: "boolean",
      statusText: "Verified",
      explanation: EXPLANATIONS.verifiedBusiness.positive,
    },
  ],
}

// Demo with more concerns
export const DEMO_INSTAGRAM_SIGNALS_CONCERN: InstagramSignalsData = {
  username: "newclinic2024",
  followersCount: 52000,
  lastUpdated: "2026-03-10T00:00:00Z",
  signals: [
    {
      id: "engagement",
      label: "Engagement",
      status: "concern",
      type: "percentile",
      percentile: 12,
      metric: "0.1%",
      metricTooltip: "Avg. likes + comments per post ÷ followers",
      statusText: "Very low",
      explanation: EXPLANATIONS.engagement.concern,
    },
    {
      id: "postingActivity",
      label: "Posting Activity",
      status: "positive",
      type: "percentile",
      percentile: 85,
      metric: "10/mo",
      metricTooltip: "Average posts per month",
      statusText: "Very active",
      explanation: EXPLANATIONS.postingActivity.positive,
    },
    {
      id: "commentsEnabled",
      label: "Comments",
      status: "concern",
      type: "boolean",
      metric: "6/20 posts",
      statusText: "Often disabled",
      explanation: EXPLANATIONS.commentsEnabled.concern,
    },
    {
      id: "verifiedBusiness",
      label: "Business Account",
      status: "positive",
      type: "boolean",
      statusText: "Verified",
      explanation: EXPLANATIONS.verifiedBusiness.positive,
    },
  ],
}

function SignalIcon({ signalId, className }: { signalId: string; className?: string }) {
  const iconClass = cn("h-4 w-4", className)
  switch (signalId) {
    case "engagement":
      return <TrendingUp className={iconClass} />
    case "commentsEnabled":
      return <MessageCircle className={iconClass} />
    case "verifiedBusiness":
      return <ShieldCheck className={iconClass} />
    case "postingActivity":
      return <Calendar className={iconClass} />
    default:
      return <Info className={iconClass} />
  }
}

function PercentileSpectrum({ percentile, status }: { percentile: number; status: SignalStatus }) {
  const position = Math.min(100, Math.max(0, percentile))

  return (
    <div className="relative w-20 sm:w-24 h-2">
      {/* Gradient track: amber (low) -> gray (mid) -> green (high) */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-300 via-gray-200 to-emerald-300" />

      {/* Position marker */}
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


function BooleanIndicator({ status }: { status: SignalStatus }) {
  if (status === "positive") {
    return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
  }
  return <AlertTriangle className="h-5 w-5 text-amber-500" />
}

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
      {/* Clickable row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3 px-1 hover:bg-muted/50 transition-colors rounded-md"
      >
        <div className="flex items-center gap-3">
          <SignalIcon
            signalId={signal.id}
            className={isPositive ? "text-emerald-600" : "text-amber-600"}
          />
          <span className="text-sm font-medium text-foreground">{signal.label}</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Percentile spectrum or boolean indicator */}
          {signal.type === "percentile" ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <PercentileSpectrum percentile={signal.percentile ?? 50} status={signal.status} />
              <span className="text-xs font-medium text-muted-foreground">
                {signal.metric}
              </span>
              <span
                className={cn(
                  "text-xs font-medium min-w-[70px] text-right hidden sm:inline",
                  isPositive ? "text-emerald-600" : "text-amber-600"
                )}
              >
                {signal.statusText}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <BooleanIndicator status={signal.status} />
              {signal.metric && (
                <span className="text-xs font-medium text-muted-foreground">
                  {signal.metric}
                </span>
              )}
              <span
                className={cn(
                  "text-xs font-medium hidden sm:inline",
                  isPositive ? "text-emerald-600" : "text-amber-600"
                )}
              >
                {signal.statusText}
              </span>
            </div>
          )}

          {/* Expand indicator */}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform flex-shrink-0",
              isExpanded && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Expandable explanation */}
      {isExpanded && (
        <div
          className={cn(
            "mx-1 mb-3 p-3 rounded-lg text-sm",
            isPositive ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"
          )}
        >
          <div className="flex gap-2">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p>{signal.explanation}</p>
              {signal.type === "percentile" && (
                <div className="text-xs opacity-75 space-y-1">
                  {signal.metricTooltip && (
                    <p>
                      <span className="font-medium">{signal.metric}</span> = {signal.metricTooltip}
                    </p>
                  )}
                  {signal.percentile !== undefined && (
                    <p>
                      This clinic ranks in the {signal.percentile}th percentile compared to others we track.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function InstagramSignalsCard({
  data = DEMO_INSTAGRAM_SIGNALS,
}: {
  data?: InstagramSignalsData
}) {
  const [expandedSignals, setExpandedSignals] = useState<Set<string>>(new Set())

  const profileUrl = `https://instagram.com/${data.username}`
  const positiveCount = data.signals.filter((s) => s.status === "positive").length
  const concernCount = data.signals.filter((s) => s.status === "concern").length

  const handleToggle = (signalId: string) => {
    setExpandedSignals((prev) => {
      const next = new Set(prev)
      if (next.has(signalId)) {
        next.delete(signalId)
      } else {
        next.add(signalId)
      }
      return next
    })
  }

  return (
    <Card variant="profile" className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Instagram gradient icon */}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </div>
            <div>
              <h3 className="im-heading-4 text-foreground">Social Media Presence</h3>
              <p className="text-xs text-muted-foreground">
                Compared to other clinics we track
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-2 text-xs">
            {positiveCount > 0 && (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {positiveCount}
              </span>
            )}
            {concernCount > 0 && (
              <span className="flex items-center gap-1 text-amber-600">
                <AlertTriangle className="h-3.5 w-3.5" />
                {concernCount}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {/* Signal rows */}
        <div className="space-y-0">
          {data.signals.map((signal) => (
            <SignalRow
              key={signal.id}
              signal={signal}
              isExpanded={expandedSignals.has(signal.id)}
              onToggle={() => handleToggle(signal.id)}
            />
          ))}
        </div>

        {/* Instagram profile link */}
        <div className="pt-3 border-t border-border/60">
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
                <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground group-hover:underline">
                    @{data.username}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    · {formatNumber(data.followersCount)} followers
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  See their posts and comments yourself
                </p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </a>
        </div>

        {/* Last updated */}
        <p className="text-xs text-muted-foreground text-center pt-1">
          Data last updated: {formatDate(data.lastUpdated)}
        </p>
      </CardContent>
    </Card>
  )
}
