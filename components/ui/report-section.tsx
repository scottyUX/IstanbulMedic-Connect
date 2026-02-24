"use client"

import { cn } from "@/lib/utils"

interface ReportSectionProps {
  title: string
  description: string
  children: React.ReactNode
  className?: string
}

export const ReportSection = ({
  title,
  description,
  children,
  className,
}: ReportSectionProps) => {
  return (
    <section className={cn(className)}>
      <h3 className="im-heading-4 text-foreground">{title}</h3>
      <p className="mt-1 mb-4 im-text-body-sm im-text-muted">{description}</p>
      {children}
    </section>
  )
}
