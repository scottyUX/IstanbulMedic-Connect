"use client"

import { MessageCircle, Trophy, Users } from "lucide-react"
import { cn, formatNumber } from "@/lib/utils"
import type { InstagramIntelligenceVM } from "@/components/istanbulmedic-connect/types"

export function KeyInsightsRow({ data }: { data: InstagramIntelligenceVM }) {
  const eng = data.engagement
  const benchmark = eng?.benchmark ?? {}

  const engagementPerPost = eng?.engagementTotalPerPost ?? 0.67
  const benchmarkEngagement = benchmark.engagementTotalPerPost ?? 360
  const engagementMultiple =
    engagementPerPost > 0 ? (benchmarkEngagement / engagementPerPost).toFixed(1) : null

  const followers = data.followersCount ?? 0
  const commentsPerPost = eng?.commentsPerPost ?? 0.6
  const benchmarkComments = benchmark.commentsPerPost ?? 12
  const commentsMultiple =
    commentsPerPost > 0 ? (benchmarkComments / commentsPerPost).toFixed(1) : null

  const insights = [
    {
      icon: Trophy,
      text:
        engagementMultiple && parseFloat(engagementMultiple) > 1
          ? `Benchmark averages ${engagementMultiple}x more engagement per post than this profile. Room to grow.`
          : `Strong engagement: this profile averages ${engagementPerPost.toFixed(2)} engagement per post.`,
    },
    {
      icon: Users,
      text: followers > 0
        ? `This profile has ${formatNumber(followers)} followers, building an audience for reach and visibility.`
        : `Audience metrics will appear as data is collected.`,
    },
    {
      icon: MessageCircle,
      text:
        commentsMultiple && parseFloat(commentsMultiple) > 1
          ? `Benchmark receives ${commentsMultiple}x more comments per post. This profile averages ${commentsPerPost.toFixed(2)} comments per post.`
          : `Crushing it! This profile averages ${commentsPerPost.toFixed(2)} comments per post.`,
    },
  ]

  return (
    <section>
      <h3 className="mb-4 text-center text-base font-semibold text-muted-foreground">
        Key Insights
      </h3>
      <div className="grid grid-cols-1 gap-6 border-y border-border/60 py-6 md:grid-cols-3">
        {insights.map((item, i) => {
          const Icon = item.icon
          return (
            <div
              key={i}
              className={cn(
                "flex flex-col gap-3 md:flex-row",
                i > 0 && "md:border-l md:border-border/60 md:pl-6"
              )}
            >
              <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
              <p className="im-text-body-sm leading-relaxed text-foreground">
                {item.text}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
