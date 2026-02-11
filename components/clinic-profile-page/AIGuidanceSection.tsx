// AIGuidanceSection.tsx
// AI Guidance from Leila -- IstanbulMedic brand.
// Uses teal-tinted background instead of blue, navy text.

import { MessageCircle } from "lucide-react";

interface AIGuidanceSectionProps {
  insights: string[];
}

export function AIGuidanceSection({ insights }: AIGuidanceSectionProps) {
  return (
    <div className="bg-teal-50 p-6 font-body">
      <p className="text-sm text-brand-text-secondary mb-2">
        Evidence-based insights to support your decision-making
      </p>

      {/* Insights List */}
      <ul className="space-y-3 my-5">
        {insights.map((insight, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="w-2 h-2 bg-brand-teal rounded-full mt-2 flex-shrink-0" />
            <p className="text-sm text-brand-text-secondary">{insight}</p>
          </li>
        ))}
      </ul>

      {/* Ask Leila Button */}
      <button className="bg-white hover:bg-gray-50 text-brand-text-secondary px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium flex items-center gap-2 transition-colors mb-4">
        <MessageCircle className="w-4 h-4" />
        Ask Leila about this clinic
      </button>

      {/* Disclaimer */}
      <p className="text-xs text-brand-text-light italic">
        Note: AI insights are generated from publicly available data and should be
        considered alongside professional medical consultation.
      </p>
    </div>
  );
}
