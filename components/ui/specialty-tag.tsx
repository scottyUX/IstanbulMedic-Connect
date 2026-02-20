"use client"

import { cn } from "@/lib/utils"

export const TAG_VARIANT_STYLES = {
  teal: "bg-[#FFF9E5] text-[#857500]",
  blue: "bg-[#E8EBEF] text-[#102741]",
  green: "bg-[#FFF9E5] text-[#857500]",
  peach: "bg-[#F6EEF1] text-[#723B54]",
  purple: "bg-[#F6EEF1] text-[#723B54]",
  orange: "bg-[#F8F1EB] text-[#835224]",
} as const

export type TagVariant = keyof typeof TAG_VARIANT_STYLES

export const TAG_VARIANT_SEQUENCE: TagVariant[] = [
  "teal",
  "blue",
  "purple",
  "orange",
  "green",
  "peach",
]

export const formatTagLabel = (label: string): string => {
  const trimmed = label.trim()
  if (!trimmed) return ""
  const lower = trimmed.toLocaleLowerCase()
  return lower.charAt(0).toLocaleUpperCase() + lower.slice(1)
}

interface SpecialtyTagProps {
  label: string
  variant?: TagVariant
  className?: string
}

export const SpecialtyTag = ({
  label,
  variant = "teal",
  className,
}: SpecialtyTagProps) => {
  const formattedLabel = formatTagLabel(label)
  if (!formattedLabel) return null

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors duration-150",
        TAG_VARIANT_STYLES[variant],
        className
      )}
    >
      {formattedLabel}
    </span>
  )
}
