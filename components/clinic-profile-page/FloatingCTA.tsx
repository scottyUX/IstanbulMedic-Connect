// FloatingCTA.tsx
// Fixed bottom-right circular CTA -- IstanbulMedic brand teal.
// Compact icon button with tooltip on hover (Intercom-style).

import { MessageCircle } from "lucide-react";

export function FloatingCTA() {
  return (
    <div className="fixed bottom-6 right-6 z-50 group">
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-brand-navy text-white text-sm font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-md">
        Ask Leila for guidance
      </div>
      {/* Button */}
      <button className="w-14 h-14 bg-brand-teal hover:bg-teal-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors">
        <MessageCircle className="w-6 h-6" />
      </button>
    </div>
  );
}
