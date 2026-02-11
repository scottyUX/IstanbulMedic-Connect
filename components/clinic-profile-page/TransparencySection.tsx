// TransparencySection.tsx
// Transparency grid -- IstanbulMedic brand. Teal checkmarks, navy headings.

import { CheckCircle2 } from "lucide-react";
import { TransparencyItem } from "./types";

interface TransparencySectionProps {
  score: number;
  items: TransparencyItem[];
  explanation: string;
}

export function TransparencySection({ score, items, explanation }: TransparencySectionProps) {
  return (
    <div className="p-6 font-body">
      <p className="text-sm text-brand-text-light mb-6">
        How we calculated the {score}/100 Transparency Score
      </p>

      {/* Verification Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {items.map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-3 bg-navy-50 rounded-lg p-4"
          >
            <CheckCircle2 className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-brand-text text-sm">{item.title}</h3>
              <p className="text-sm text-brand-text-light mt-0.5">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Explanation Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">{explanation}</p>
      </div>
    </div>
  );
}
