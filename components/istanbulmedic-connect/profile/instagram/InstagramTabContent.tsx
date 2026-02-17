"use client"

import { BarChartCard } from "@/components/ui/bar-chart-card"
import { EmptyState } from "@/components/ui/empty-state"
import { LineChartCard } from "@/components/ui/line-chart-card"
import { ReportSection } from "@/components/ui/report-section"
import type { InstagramIntelligenceVM } from "@/components/istanbulmedic-connect/types"
import {
  formatChartMonth,
  formatChartMonthShort,
  formatDate,
} from "@/lib/utils"
import { Calendar, LineChart as LineChartIcon } from "lucide-react"
import { EngagementSection } from "./EngagementSection"
import { InstagramMetricsRow } from "./InstagramMetricsRow"
import { KeyInsightsRow } from "./KeyInsightsRow"

const DEFAULT_FOLLOWER_HISTORY = [
  { month: "Jul '25", followers: 7800 },
  { month: "Aug '25", followers: 9000 },
  { month: "Sep '25", followers: 9800 },
  { month: "Oct '25", followers: 10600 },
  { month: "Nov '25", followers: 11400 },
  { month: "Dec '25", followers: 12200 },
  { month: "Jan '26", followers: 13200 },
]

const DEFAULT_POST_ACTIVITY = [
  { month: "Jul", posts: 42 },
  { month: "Aug", posts: 47 },
  { month: "Sep", posts: 51 },
  { month: "Oct", posts: 45 },
  { month: "Nov", posts: 55 },
  { month: "Dec", posts: 48 },
  { month: "Jan", posts: 56 },
]

const followerChartConfig = {
  followers: {
    label: "Followers",
    color: "hsl(var(--primary))",
  },
}

const postChartConfig = {
  posts: {
    label: "Posts",
    color: "hsl(263 70% 50%)",
  },
}

export function InstagramTabContent({
  data,
}: {
  data?: InstagramIntelligenceVM | null
}) {
  if (!data?.username && !data?.profileUrl) {
    return (
      <EmptyState
        title="Instagram data is not available yet."
        description="Connect this profile to view insights."
      />
    )
  }

  const followerData =
    (data.followerHistory?.length ?? 0) > 0
      ? (data.followerHistory ?? []).map((d) => ({
          month: formatChartMonth(d.month),
          followers: d.followers,
        }))
      : DEFAULT_FOLLOWER_HISTORY

  const postData =
    (data.postActivityHistory?.length ?? 0) > 0
      ? (data.postActivityHistory ?? []).map((d) => ({
          month: formatChartMonthShort(d.month),
          posts: d.posts,
        }))
      : DEFAULT_POST_ACTIVITY

  return (
    <div className="space-y-8">
      {data.lastSeenAt && (
        <div className="im-text-body-xs im-text-muted">
          Last updated: {formatDate(data.lastSeenAt)}
        </div>
      )}
      <KeyInsightsRow data={data} />
      <ReportSection
        title="Audience"
        description="Who's behind the profile. Follower count and post volume signal reach and activity level."
      >
        <InstagramMetricsRow data={data} />
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <LineChartCard
            title="Follower Growth"
            icon={LineChartIcon}
            data={followerData}
            dataKeyX="month"
            dataKeyY="followers"
            config={followerChartConfig}
          />
          <BarChartCard
            title="Posting Activity"
            icon={Calendar}
            data={postData}
            dataKeyX="month"
            dataKeyY="posts"
            config={postChartConfig}
          />
        </div>
      </ReportSection>
      <EngagementSection data={data} />
    </div>
  )
}
