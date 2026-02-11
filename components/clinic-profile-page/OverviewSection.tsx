// OverviewSection.tsx
// Overview card -- IstanbulMedic brand. Teal tags, navy headings, Merriweather for h2/h3.

import { Building2, Activity, Sparkles } from "lucide-react";

interface OverviewSectionProps {
  specialties: string[];
  yearsInOperation: number;
  proceduresPerformed: string;
  languages: string[];
  about: string;
}

export function OverviewSection({
  specialties,
  yearsInOperation,
  proceduresPerformed,
  languages,
  about,
}: OverviewSectionProps) {
  return (
    <div className="p-6 font-body">
      {/* Specialties */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-brand-text-light mb-2">Specialties</h3>
        <div className="flex flex-wrap gap-2">
          {specialties.map((specialty) => (
            <span
              key={specialty}
              className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm font-medium border border-teal-200"
            >
              {specialty}
            </span>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6 py-4 border-t border-b border-gray-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-navy-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-brand-navy" />
          </div>
          <div>
            <p className="text-xs text-brand-text-light">Years in Operation</p>
            <p className="text-lg font-bold text-brand-text">{yearsInOperation}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-navy-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Activity className="w-5 h-5 text-brand-navy" />
          </div>
          <div>
            <p className="text-xs text-brand-text-light">Procedures Performed</p>
            <p className="text-lg font-bold text-brand-text">{proceduresPerformed}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-navy-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-brand-navy" />
          </div>
          <div>
            <p className="text-xs text-brand-text-light">Languages Spoken</p>
            <p className="text-sm font-bold text-brand-text">{languages.join(", ")}</p>
          </div>
        </div>
      </div>

      {/* About */}
      <div>
        <h3 className="text-sm font-semibold text-brand-text-secondary mb-2">About This Clinic</h3>
        <p className="text-sm text-brand-text-secondary leading-relaxed">{about}</p>
      </div>
    </div>
  );
}
