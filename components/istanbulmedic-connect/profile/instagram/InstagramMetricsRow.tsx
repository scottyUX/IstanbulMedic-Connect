"use client"

import { ExternalLink, Image, Tag, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatNumber, truncate } from "@/lib/utils"
import type { InstagramIntelligenceVM } from "@/components/istanbulmedic-connect/types"

export function InstagramMetricsRow({ data }: { data: InstagramIntelligenceVM }) {
  const metrics = [
    {
      label: "Followers",
      value: formatNumber(data.followersCount),
      icon: Users,
    },
    {
      label: "Posts",
      value: formatNumber(data.postsCount),
      icon: Image,
    },
    {
      label: "Category",
      value: truncate(data.businessCategoryName, 14),
      icon: Tag,
    },
    ...(data.externalUrls?.length
      ? [
          {
            label: "Links",
            value: String(data.externalUrls.length),
            icon: ExternalLink,
          },
        ]
      : []),
  ]

  if (metrics.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {metrics.map((m, i) => {
        const Icon = m.icon
        return (
          <div
            key={m.label}
            className={cn(
              "flex flex-col items-center px-4 py-3",
              i > 0 && "border-l border-border/60"
            )}
          >
            <div className="text-center text-xs font-medium text-muted-foreground">
              {m.label}
            </div>
            <div className="mt-1 text-center text-2xl font-bold text-foreground">
              {m.value ?? "—"}
            </div>
            <Icon className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
        )
      })}
    </div>
  )
}
