// SectionNav.tsx
// Sticky section navigation that appears below the main navbar.
// Uses scroll position to determine which section is active -- more reliable
// than IntersectionObserver when sections can be collapsed (very short height).
// Teal accent for active section, smooth scroll to anchors.

"use client";

import { useEffect, useState, useCallback } from "react";

interface Section {
  id: string;
  label: string;
}

const SECTIONS: Section[] = [
  { id: "overview", label: "Overview" },
  { id: "doctors", label: "Doctors" },
  { id: "community", label: "Community" },
  { id: "transparency", label: "Safety" },
  { id: "ai-guidance", label: "AI Insights" },
  { id: "reviews", label: "Reviews" },
  { id: "location", label: "Location" },
];

export function SectionNav() {
  const [activeSection, setActiveSection] = useState<string>("overview");

  // Determine which section is active based on scroll position.
  // We find the last section whose top edge has scrolled past the
  // sticky header area (navbar 64px + section nav ~48px + 16px buffer = 128px).
  const updateActiveSection = useCallback(() => {
    const scrollY = window.scrollY;
    const offset = 140;

    let current = SECTIONS[0].id;

    for (const section of SECTIONS) {
      const element = document.getElementById(section.id);
      if (element) {
        const top = element.getBoundingClientRect().top + scrollY - offset;
        if (scrollY >= top) {
          current = section.id;
        }
      }
    }

    setActiveSection(current);
  }, []);

  useEffect(() => {
    // Run once on mount
    updateActiveSection();

    // Throttled scroll listener
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateActiveSection();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [updateActiveSection]);

  const scrollToSection = (id: string) => {
    // Dispatch a custom event to auto-expand the section if it's collapsed
    window.dispatchEvent(new CustomEvent("expand-section", { detail: { id } }));

    // Small delay to let the section expand before scrolling to it
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        const offset = 120; // Account for sticky navbar + section nav
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: elementPosition - offset,
          behavior: "smooth",
        });
      }
    }, 50);
  };

  return (
    <div className="sticky top-16 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex gap-1 overflow-x-auto no-scrollbar">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeSection === section.id
                  ? "border-brand-teal text-brand-teal"
                  : "border-transparent text-brand-text-secondary hover:text-brand-text"
              }`}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
