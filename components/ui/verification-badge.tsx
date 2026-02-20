"use client"

import type { ReactNode } from "react"
import { ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface VerificationBadgeProps {
  label: string
  icon?: ReactNode
  className?: string
}

export const VerificationBadge = ({
  label,
  icon,
  className,
}: VerificationBadgeProps) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 text-base text-muted-foreground",
        className
      )}
    >
      {icon ?? <ShieldCheck className="h-4 w-4" aria-hidden />}
      <span>{label}</span>
    </div>
  )
}
