"use client"

import { cn } from "@/lib/utils"

interface FilterPillGroupProps {
  items: string[]
  selected: Record<string, boolean>
  onToggle: (item: string) => void
  className?: string
}

const pillBase =
  "px-4 py-2 rounded-full text-sm font-medium border transition-all cursor-pointer"
const pillSelected =
  "bg-[var(--im-color-primary)] text-white border-[var(--im-color-primary)] hover:opacity-90"
const pillUnselected =
  "bg-white text-foreground border-border hover:border-[var(--im-color-primary)] hover:text-[var(--im-color-primary)]"

export const FilterPillGroup = ({
  items,
  selected,
  onToggle,
  className,
}: FilterPillGroupProps) => {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item) => {
        const isSelected = selected[item] ?? false
        return (
          <button
            key={item}
            type="button"
            onClick={() => onToggle(item)}
            className={cn(
              pillBase,
              isSelected ? pillSelected : pillUnselected
            )}
          >
            {item}
          </button>
        )
      })}
    </div>
  )
}
