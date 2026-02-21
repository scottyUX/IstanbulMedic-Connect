"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

export interface BarChartCardProps<T extends Record<string, unknown>> {
  /** Chart title */
  title: string
  /** Icon shown next to title */
  icon?: LucideIcon
  /** Data array, e.g. [{ month: "Jan", posts: 42 }] */
  data: T[]
  /** Key for X axis (e.g. "month") */
  dataKeyX: keyof T
  /** Key for bars (e.g. "posts") */
  dataKeyY: keyof T
  /** Chart config for tooltip/legend */
  config: ChartConfig
  /** Bar fill color */
  barColor?: string
  className?: string
}

export function BarChartCard<T extends Record<string, unknown>>({
  title,
  icon: Icon,
  data,
  dataKeyX,
  dataKeyY,
  config,
  barColor = "hsl(263 70% 50%)",
  className,
}: BarChartCardProps<T>) {
  return (
    <div className={cn("rounded-xl border border-border/60 bg-muted/5 p-4", className)}>
      <div className="mb-4 flex items-center gap-2">
        {Icon && <Icon className="h-5 w-5 shrink-0 text-[#7c3aed]" />}
        <h4 className="text-base font-semibold text-foreground">{title}</h4>
      </div>
      <ChartContainer config={config} className="min-h-[200px] w-full">
        <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey={String(dataKeyX)}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar
            dataKey={String(dataKeyY)}
            fill={barColor}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
