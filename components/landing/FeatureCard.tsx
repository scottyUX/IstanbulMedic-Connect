"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { FadeInUp } from "@/components/ui/motionPrimitives"

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  className?: string
  delay?: number
}

export const FeatureCard = ({
  icon: Icon,
  title,
  description,
  className,
  delay = 0,
}: FeatureCardProps) => {
  return (
    <FadeInUp
      className={cn(
        "flex flex-col items-center text-center p-6 rounded-2xl bg-muted/50 hover:bg-[var(--im-color-secondary)]/10 transition-colors duration-300",
        className
      )}
      transition={{ delay }}
    >
      <div className="w-16 h-16 rounded-full bg-[#17375B] flex items-center justify-center mb-6 text-white">
        <Icon size={32} />
      </div>
      <h3 className="im-heading-4 text-im-text-primary mb-3">{title}</h3>
      <p className="im-text-body im-text-muted leading-relaxed">{description}</p>
    </FadeInUp>
  )
}
