import { Star } from "lucide-react"

interface StarBarProps {
  stars: number
  count: number
  total: number
}

export function StarBar({ stars, count, total }: StarBarProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="flex w-14 shrink-0 items-center justify-end gap-0.5 text-muted-foreground">
        {stars} <Star className="h-2.5 w-2.5 fill-[#FFD700] text-[#FFD700]" />
      </span>
      <div className="flex-1 rounded-full bg-muted/30 overflow-hidden h-2">
        <div className="h-full rounded-full bg-[#FFD700]" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right font-medium text-foreground">{pct}%</span>
    </div>
  )
}
