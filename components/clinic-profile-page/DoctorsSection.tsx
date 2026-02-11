// DoctorsSection.tsx
// Doctor cards -- IstanbulMedic brand. Teal accents, navy text, Merriweather headings.

import { GraduationCap, Award } from "lucide-react";
import { Doctor } from "./types";

interface DoctorsSectionProps {
  doctors: Doctor[];
}

function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center text-center">
      {/* Circular Photo */}
      <div className="w-24 h-24 rounded-full overflow-hidden mb-4 bg-gray-100 ring-2 ring-teal-100">
        <img
          src={doctor.photo}
          alt={doctor.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Name & Specialty */}
      <h3 className="font-semibold text-brand-text font-heading">{doctor.name}</h3>
      <p className="text-sm text-brand-teal mb-4">{doctor.specialty}</p>

      {/* Credentials */}
      <div className="w-full text-left mb-3">
        <div className="flex items-center gap-1.5 text-xs text-brand-text-light mb-1">
          <Award className="w-3.5 h-3.5" />
          <span>Credentials</span>
        </div>
        {doctor.credentials.map((credential) => (
          <p key={credential} className="text-sm text-brand-text-secondary ml-5">
            {credential}
          </p>
        ))}
      </div>

      {/* Education */}
      <div className="w-full text-left mb-4">
        <div className="flex items-center gap-1.5 text-xs text-brand-text-light mb-1">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Education</span>
        </div>
        <p className="text-sm text-brand-text-secondary ml-5">{doctor.education}</p>
      </div>

      {/* Experience Badge */}
      <div className="bg-teal-50 text-teal-700 px-4 py-2 rounded-full text-sm font-medium border border-teal-200">
        Experience
        <br />
        <span className="font-bold">{doctor.experience} Years</span>
      </div>
    </div>
  );
}

export function DoctorsSection({ doctors }: DoctorsSectionProps) {
  return (
    <div className="p-6 font-body">
      {doctors.length === 0 ? (
        <p className="text-brand-text-light text-center py-8">No doctors listed yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.name} doctor={doctor} />
          ))}
        </div>
      )}
    </div>
  );
}
