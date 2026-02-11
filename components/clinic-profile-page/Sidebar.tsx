// Sidebar.tsx
// Sticky sidebar -- IstanbulMedic brand.
// Teal primary CTA, navy text, copper accent on score.

import { FileText, Calendar, Plus, Bookmark, Share2 } from "lucide-react";

interface SidebarProps {
  transparencyScore: number;
  specialties: string[];
}

export function Sidebar({ transparencyScore, specialties }: SidebarProps) {
  return (
    <div className="sticky top-24 space-y-4 font-body">
      {/* Transparency Score Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-brand-teal" />
          <h3 className="font-semibold text-brand-text font-heading">Transparency Score</h3>
        </div>

        <div className="mb-2">
          <span className="text-4xl font-bold text-brand-navy">{transparencyScore}</span>
          <span className="text-lg text-brand-text-light"> / 100</span>
        </div>
        <p className="text-sm text-brand-text-light mb-3">
          Based on verified credentials, documentation, and patient-reported data.
        </p>
        <a href="#transparency" className="text-sm text-brand-teal hover:text-teal-700 font-medium transition-colors">
          How this score is calculated &rarr;
        </a>
      </div>

      {/* Top Specialties */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-brand-text font-heading mb-3">Top Specialties</h3>
        <ul className="space-y-2">
          {specialties.slice(0, 4).map((specialty) => (
            <li key={specialty} className="flex items-center gap-2 text-sm text-brand-text-secondary">
              <span className="w-2 h-2 bg-brand-teal rounded-full" />
              {specialty}
            </li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button className="w-full bg-brand-teal hover:bg-teal-700 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
          <Calendar className="w-4 h-4" />
          Request Consultation
        </button>
        <button className="w-full bg-white hover:bg-gray-50 text-brand-text-secondary py-3 px-4 rounded-xl font-medium border border-gray-200 flex items-center justify-center gap-2 transition-colors">
          <Plus className="w-4 h-4" />
          Add to Compare
        </button>
        <button className="w-full bg-white hover:bg-gray-50 text-brand-text-secondary py-3 px-4 rounded-xl font-medium border border-gray-200 flex items-center justify-center gap-2 transition-colors">
          <Bookmark className="w-4 h-4" />
          Save Clinic
        </button>
        <button className="w-full bg-white hover:bg-gray-50 text-brand-text-secondary py-3 px-4 rounded-xl font-medium border border-gray-200 flex items-center justify-center gap-2 transition-colors">
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>
    </div>
  );
}
