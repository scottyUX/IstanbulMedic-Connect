// CollapsibleSection.tsx
// Wrapper that adds smooth animated collapse/expand to any section.
// Uses CSS grid-template-rows (0fr ↔ 1fr) for a natural height transition
// instead of the old conditional render approach which was jarring.
// The content stays in the DOM but is visually hidden when collapsed,
// which also means the section nav's scroll-position detection still works.

"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface CollapsibleSectionProps {
  id: string;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function CollapsibleSection({
  id,
  title,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Listen for "expand-section" events from the SectionNav.
  // When a user clicks a nav item, expand this section if it matches.
  useEffect(() => {
    const handleExpand = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.id === id) {
        setIsOpen(true);
      }
    };

    window.addEventListener("expand-section", handleExpand);
    return () => window.removeEventListener("expand-section", handleExpand);
  }, [id]);

  return (
    <div id={id} className="scroll-mt-32">
      {/* Section header -- always visible, acts as toggle */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full bg-white px-6 py-4 flex items-center justify-between group transition-colors ${
          isOpen
            ? "rounded-t-xl border-t border-x border-gray-200"
            : "rounded-xl border border-gray-200 hover:bg-gray-50"
        }`}
      >
        <span className="text-lg font-bold text-brand-text font-heading">
          {title}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-brand-text-light group-hover:text-brand-teal transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Animated content area using grid row trick */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div
            className={`bg-white rounded-b-xl border-b border-x border-gray-200 transition-opacity duration-300 ${
              isOpen ? "opacity-100" : "opacity-0"
            }`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
