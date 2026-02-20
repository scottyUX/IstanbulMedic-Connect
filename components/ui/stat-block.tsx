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
  iconPosition?: "top" | "bottom"
  variant?: "default" | "centered"
}

export const StatBlock = ({
  label,
  value,
  className,
  labelClassName,
  valueClassName,
  icon,
  iconPosition = "top",
  variant = "default",
}: StatBlockProps) => {
  return (
    <div
      className={cn(
        "rounded-lg bg-muted/10 p-3 flex flex-col",
        variant === "centered" && "text-center items-center",
        className
      )}
    >
      {icon && iconPosition === "top" && <div className="mb-2">{icon}</div>}
      <div className={cn("text-sm text-muted-foreground", labelClassName)}>
        {label}
      </div>
      <div className={cn("mt-1 text-lg font-semibold", valueClassName)}>
        {value}
      </div>
      {icon && iconPosition === "bottom" && (
        <div className="mt-2 text-muted-foreground">{icon}</div>
      )}
    </div>
  )
}
