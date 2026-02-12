"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface StatBlockProps {
  label: string
  value: ReactNode
  className?: string
  labelClassName?: string
  valueClassName?: string
  icon?: ReactNode
  variant?: "default" | "centered"
}

export const StatBlock = ({
  label,
  value,
  className,
  labelClassName,
  valueClassName,
  icon,
  variant = "default",
}: StatBlockProps) => {
  return (
    <div
      className={cn(
        "rounded-lg bg-muted/10 p-3",
        variant === "centered" && "text-center",
        className
      )}
    >
      {icon && <div className="mb-2">{icon}</div>}
      <div className={cn("text-sm text-muted-foreground", labelClassName)}>{label}</div>
      <div className={cn("mt-1 text-lg font-semibold", valueClassName)}>{value}</div>
    </div>
  )
}
