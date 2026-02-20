"use client"

import type { ReactNode } from "react"

/**
 * HomeTemplate
 * Structure: Hero → How It Works → Safe Affordable
 */
interface HomeTemplateProps {
  hero: ReactNode
  safeAffordable?: ReactNode
  howItWorks: ReactNode
  className?: string
}

export const HomeTemplate = ({
  hero,
  safeAffordable,
  howItWorks,
  className,
}: HomeTemplateProps) => {
  return (
    <main className={className}>
      {hero}
      {howItWorks}
      {safeAffordable}
    </main>
  )
}
