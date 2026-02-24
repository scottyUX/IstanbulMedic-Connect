"use client"

import type { ReactNode } from "react"
import Container from "@/components/ui/container"
import PageSubtitle from "@/components/ui/PageSubtitle"
import PageTitle from "@/components/ui/PageTitle"
import Section from "@/components/ui/section"
import { cn } from "@/lib/utils"

interface LandingSectionProps {
  title: string
  subtitle?: ReactNode
  children: ReactNode
  className?: string
  id?: string
  bgClassName?: string
  contentClassName?: string
  titleClassName?: string
  subtitleClassName?: string
}

export const LandingSection = ({
  title,
  subtitle,
  children,
  className,
  id,
  bgClassName,
  contentClassName,
  titleClassName,
  subtitleClassName,
}: LandingSectionProps) => {
  return (
    <Section id={id} className={cn(bgClassName, className)}>
      <Container>
        <div
          className={cn(
            "text-center max-w-3xl mx-auto mb-12",
            contentClassName
          )}
        >
          <PageTitle className={titleClassName}>{title}</PageTitle>
          {subtitle && (
            <PageSubtitle className={cn("mt-4", subtitleClassName)}>
              {subtitle}
            </PageSubtitle>
          )}
        </div>
        {children}
      </Container>
    </Section>
  )
}
