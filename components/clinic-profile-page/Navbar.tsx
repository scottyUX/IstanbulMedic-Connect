// Navbar.tsx
// Site-wide navigation bar featuring the IstanbulMedic Connect logo.
// Uses the actual brand favicon icon (interlocking diamonds in teal),
// paired with a styled wordmark that mirrors the original IstanbulMedic
// typography: thin "ISTANBUL" + bold "MEDIC", then teal "Connect".
// Dark navy background (#17375B), teal accent (#3EBBB7), Poppins font.

import { MessageCircle } from "lucide-react";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-brand-navy font-body shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo: brand icon + styled wordmark + "Connect" */}
          <div className="flex items-center gap-2.5">
            {/* IstanbulMedic teal favicon icon (interlocking diamonds) */}
            <img
              src="/icon.png"
              alt=""
              className="h-8 w-8"
              aria-hidden="true"
            />

            {/* Wordmark – matches original: thin "ISTANBUL" + bold "MEDIC" */}
            <span className="text-white text-[1.3rem] tracking-[0.06em] uppercase leading-none select-none">
              <span className="font-light">Istanbul</span>
              <span className="font-bold">Medic</span>
            </span>

            {/* "Connect" in teal */}
            <span className="text-brand-teal font-semibold text-lg tracking-wide leading-none select-none">
              Connect
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#"
              className="text-gray-300 hover:text-white text-sm font-medium transition-colors"
            >
              How It Works
            </a>
            <a
              href="#"
              className="text-gray-300 hover:text-white text-sm font-medium transition-colors"
            >
              Treatments
            </a>
            <a
              href="#"
              className="text-gray-300 hover:text-white text-sm font-medium transition-colors"
            >
              Clinics
            </a>
          </div>

          {/* CTA Button */}
          <button className="bg-brand-teal hover:bg-teal-700 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors">
            <MessageCircle className="w-4 h-4" />
            Talk to Leila (AI Assistant)
          </button>
        </div>
      </div>
    </nav>
  );
}
