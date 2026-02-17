"use client"

import { ComparisonMetricBlock } from "@/components/ui/comparison-metric-block"
import { ReportSection } from "@/components/ui/report-section"
import type { InstagramIntelligenceVM } from "@/components/istanbulmedic-connect/types"

const ENGAGEMENT_METRICS = [
  {
    key: "engagementTotalPerPost" as const,
    title: "Engagement Total per Post",
    description:
      "Higher engagement totals help more people see your content. When it comes to likes and comments, more is always better.",
    formatValue: (v: number) => v.toFixed(2),
    getClinicValue: (eng: InstagramIntelligenceVM["engagement"]) =>
      eng?.engagementTotalPerPost ?? 0.67,
    getBenchmarkValue: (b: NonNullable<InstagramIntelligenceVM["engagement"]>["benchmark"]) =>
      b?.engagementTotalPerPost ?? 360,
  },
  {
    key: "engagementRate" as const,
    title: "Engagement Rate",
    description:
      "Engagement rate shows what percentage of your followers interact with your posts. Higher rates indicate stronger audience connection.",
    formatValue: (v: number) => {
      const pct = v * 100
      return pct < 0.01 ? `<${pct.toFixed(3)}%` : `${pct.toFixed(2)}%`
    },
    getClinicValue: (eng: InstagramIntelligenceVM["engagement"]) =>
      eng?.engagementRate ?? 0.00004,
    getBenchmarkValue: (b: NonNullable<InstagramIntelligenceVM["engagement"]>["benchmark"]) =>
      (b?.engagementRate ?? 0.47) / 100,
  },
  {
    key: "commentsPerPost" as const,
    title: "Comments per Post",
    description:
      "Comments indicate deeper engagement than likes. More comments often mean your content sparks conversation.",
    formatValue: (v: number) => v.toFixed(2),
    getClinicValue: (eng: InstagramIntelligenceVM["engagement"]) =>
      eng?.commentsPerPost ?? 0.6,
    getBenchmarkValue: (b: NonNullable<InstagramIntelligenceVM["engagement"]>["benchmark"]) =>
      b?.commentsPerPost ?? 12,
  },
] as const

export function EngagementSection({ data }: { data: InstagramIntelligenceVM }) {
  const eng = data.engagement
  const benchmark = eng?.benchmark ?? {}

  return (
    <ReportSection
      title="Engagement"
      description="Engagement measures how much your followers interact with your content. You can have all the followers in the world, but if they don't engage with your content, your social media efforts won't pay off."
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {ENGAGEMENT_METRICS.map((m) => (
          <ComparisonMetricBlock
            key={m.key}
            title={m.title}
            description={m.description}
            primaryValue={m.getClinicValue(eng)}
            benchmarkValue={m.getBenchmarkValue(benchmark)}
            formatValue={m.formatValue}
          />
        ))}
      </div>
    </ReportSection>
  )
}
