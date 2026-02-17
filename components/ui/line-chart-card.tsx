"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatNumber } from "@/lib/utils"
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  XAxis,
  YAxis,
} from "recharts"

export interface LineChartCardProps<T extends Record<string, unknown>> {
  /** Chart title */
  title: string
  /** Icon shown next to title */
  icon?: LucideIcon
  /** Data array, e.g. [{ month: "Jan '25", followers: 1000 }] */
  data: T[]
  /** Key for X axis (e.g. "month") */
  dataKeyX: keyof T
  /** Key for Y axis / line (e.g. "followers") */
  dataKeyY: keyof T
  /** Chart config for tooltip/legend */
  config: ChartConfig
  /** Optional Y-axis formatter */
  yAxisFormatter?: (v: number) => string
  /** Color for the line */
  lineColor?: string
  className?: string
}

export function LineChartCard<T extends Record<string, unknown>>({
  title,
  icon: Icon,
  data,
  dataKeyX,
  dataKeyY,
  config,
  yAxisFormatter = (v) => formatNumber(v),
  lineColor = "hsl(var(--primary))",
  className,
}: LineChartCardProps<T>) {
  return (
    <div className={cn("rounded-xl border border-border/60 bg-muted/5 p-4", className)}>
      <div className="mb-4 flex items-center gap-2">
        {Icon && <Icon className="h-5 w-5 shrink-0 text-[#2563eb]" />}
        <h4 className="text-base font-semibold text-foreground">{title}</h4>
      </div>
      <ChartContainer config={config} className="min-h-[200px] w-full">
        <RechartsLineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
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
            tickFormatter={(v) => yAxisFormatter(v)}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            type="monotone"
            dataKey={String(dataKeyY)}
            stroke={lineColor}
            strokeWidth={2}
            dot={{ fill: lineColor, r: 4 }}
          />
        </RechartsLineChart>
      </ChartContainer>
    </div>
  )
}
