"use client"

import { useEffect, useState, useCallback } from "react"
import { cn } from "@/lib/utils"

interface Section {
  id: string
  label: string
}

const SECTIONS: Section[] = [
  { id: "overview", label: "Overview" },
  { id: "doctors", label: "Doctors" },
  { id: "community", label: "Community" },
  { id: "transparency", label: "Safety" },
  { id: "ai-insights", label: "AI Insights" },
  { id: "reviews", label: "Reviews" },
  { id: "instagram-intel", label: "Social" },
  { id: "location", label: "Location" },
]

export function SectionNav() {
  const [activeSection, setActiveSection] = useState<string>("overview")

  // Determine which section is active based on scroll position.
  // We find the last section whose top edge has scrolled past the
  // sticky header area (navbar 80px + section nav ~48px + 16px buffer = ~140px offset).
  const updateActiveSection = useCallback(() => {
    const scrollY = window.scrollY
    const offset = 140

    let current = SECTIONS[0].id

    for (const section of SECTIONS) {
      const element = document.getElementById(section.id)
      if (element) {
        const top = element.getBoundingClientRect().top + scrollY - offset
        if (scrollY >= top) {
          current = section.id
        }
      }
    }

    setActiveSection(current)
  }, [])

  useEffect(() => {
    // Run once on mount
    updateActiveSection()

    // Throttled scroll listener
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateActiveSection()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [updateActiveSection])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 120 // Account for sticky navbar (80px) + section nav (~40px)
      const elementPosition = element.getBoundingClientRect().top + window.scrollY
      window.scrollTo({
        top: elementPosition - offset,
        behavior: "smooth",
      })
    }
  }

  return (
    <div className="sticky top-[80px] z-40 bg-background border-b border-border/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex gap-1 overflow-x-auto no-scrollbar">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={cn(
                "px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                activeSection === section.id
                  ? "border-[#3EBBB7] text-[#3EBBB7]"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
