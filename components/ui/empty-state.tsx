"use client"

import { cn } from "@/lib/utils"

interface EmptyStateProps {
  title?: string
  description: string
  className?: string
}

export const EmptyState = ({
  title,
  description,
  className,
}: EmptyStateProps) => {
  return (
    <div
      className={cn(
        "flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/5 py-16 text-center",
        className
      )}
    >
      {title && (
        <p className="im-text-body-sm im-text-muted">{title}</p>
      )}
      <p className={cn("im-text-body-xs im-text-muted", title && "mt-1")}>
        {description}
      </p>
    </div>
  )
}
