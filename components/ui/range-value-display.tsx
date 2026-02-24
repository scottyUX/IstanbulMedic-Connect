"use client"

import { cn } from "@/lib/utils"

interface RangeValueDisplayProps {
  label: string
  value: string | number
  format?: (val: string | number) => string
  className?: string
}

const defaultFormat = (val: string | number) =>
  typeof val === "number" ? val.toLocaleString() : String(val)

export const RangeValueDisplay = ({
  label,
  value,
  format = defaultFormat,
  className,
}: RangeValueDisplayProps) => {
  return (
    <div
      className={cn(
        "border rounded-xl px-4 py-2 w-full",
        className
      )}
    >
      <span className="im-text-body-xs im-text-muted block mb-0.5">{label}</span>
      <span className="im-text-body-sm im-text-label">{format(value)}</span>
    </div>
  )
}
