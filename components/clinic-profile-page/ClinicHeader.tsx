// ClinicHeader.tsx
// Clinic name, location, rating, and specialty tags -- IstanbulMedic brand.
// Headings use Merriweather (font-heading), body uses Poppins (font-body).
// Tags use teal (#3EBBB7) instead of blue.

import { ArrowLeft, MapPin, Star } from "lucide-react";

interface ClinicHeaderProps {
  name: string;
  location: string;
  rating: number;
  reviewCount: number;
  specialties: string[];
}

export function ClinicHeader({ name, location, rating, reviewCount, specialties }: ClinicHeaderProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 font-body">
      {/* Back Link */}
      <a
        href="#"
        className="inline-flex items-center gap-1 text-sm text-brand-text-secondary hover:text-brand-text mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Explore Clinics
      </a>

      {/* Clinic Name -- Merriweather serif for headings */}
      <h1 className="text-3xl font-bold text-brand-text font-heading mb-2">{name}</h1>

      {/* Location + Rating Row */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1 text-brand-text-secondary">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{location}</span>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= Math.round(rating)
                  ? "fill-brand-copper text-brand-copper"
                  : "fill-gray-200 text-gray-200"
              }`}
            />
          ))}
          <span className="text-sm font-semibold text-brand-text ml-1">{rating}</span>
        </div>
        <span className="text-sm text-brand-text-light">({reviewCount} reviews)</span>
      </div>

      {/* Specialty Tags -- teal */}
      <div className="flex flex-wrap gap-2">
        {specialties.map((specialty) => (
          <span
            key={specialty}
            className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm font-medium border border-teal-200"
          >
            {specialty}
          </span>
        ))}
      </div>
    </div>
  );
}
