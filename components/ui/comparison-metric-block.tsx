"use client"

import { type LucideIcon, Info, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ComparisonMetricBlockProps {
  /** Metric title */
  title: string
  /** Explanation shown below the title */
  description: string
  /** Primary value (e.g. "this profile") */
  primaryValue: number
  /** Comparison value (e.g. benchmark) */
  benchmarkValue: number
  /** Format numeric value for display */
  formatValue: (v: number) => string
  /** Label for primary row */
  primaryLabel?: string
  /** Label for benchmark row */
  benchmarkLabel?: string
  /** Icon for primary row */
  primaryIcon?: LucideIcon
  className?: string
}

export const ComparisonMetricBlock = ({
  title,
  description,
  primaryValue,
  benchmarkValue,
  formatValue,
  primaryLabel = "This profile",
  benchmarkLabel = "Benchmark Average",
  primaryIcon: PrimaryIcon = Shield,
  className,
}: ComparisonMetricBlockProps) => {
  const maxVal = Math.max(primaryValue, benchmarkValue, 1)
  const maxBarPx = 80
  const primaryBarPx = maxVal > 0 ? Math.max((primaryValue / maxVal) * maxBarPx, 4) : 4
  const benchmarkBarPx = maxVal > 0 ? Math.max((benchmarkValue / maxVal) * maxBarPx, 8) : 8

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <span className="text-base font-semibold text-foreground">{title}</span>
        <Info className="h-4 w-4 shrink-0 text-muted-foreground" aria-label="More info" />
      </div>
      <p className="im-text-body-sm im-text-muted">{description}</p>
      <div className="space-y-3 rounded-xl border border-border/60 bg-muted/5 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {PrimaryIcon && <PrimaryIcon className="h-4 w-4 shrink-0 text-foreground" />}
            <span className="truncate im-text-body-sm im-text-muted">{primaryLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="h-4 rounded bg-primary min-w-1"
              style={{ width: `${primaryBarPx}px` }}
            />
            <span className="min-w-[4rem] text-right font-mono text-sm font-medium tabular-nums text-foreground">
              {formatValue(primaryValue)}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="h-4 w-4 shrink-0 rounded bg-muted-foreground/30" />
            <span className="truncate im-text-body-sm im-text-muted">{benchmarkLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="h-4 rounded bg-muted-foreground/40"
              style={{ width: `${benchmarkBarPx}px` }}
            />
            <span className="min-w-[4rem] text-right font-mono text-sm font-medium tabular-nums text-foreground">
              {formatValue(benchmarkValue)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
