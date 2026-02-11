// LocationSection.tsx
// Location & Practical Info -- IstanbulMedic brand. Teal language tags, navy text.

import {
  MapPin,
  Clock,
  Globe,
  CreditCard,
  Home,
  Plane,
} from "lucide-react";
import { OpeningHours, AdditionalService } from "./types";

interface LocationSectionProps {
  address: string;
  openingHours: OpeningHours[];
  languages: string[];
  paymentMethods: string[];
  additionalServices: AdditionalService[];
}

export function LocationSection({
  address,
  openingHours,
  languages,
  paymentMethods,
  additionalServices,
}: LocationSectionProps) {
  const serviceIcons: Record<string, React.ReactNode> = {
    "Accommodation Support": <Home className="w-5 h-5 text-brand-teal" />,
    "Airport Transfer": <Plane className="w-5 h-5 text-brand-teal" />,
  };

  return (
    <div className="p-6 font-body">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column */}
        <div>
          <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-100 mb-4">
            <img
              src="https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&h=300&fit=crop"
              alt="Istanbul location"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Address */}
          <div className="flex items-start gap-2 mb-4">
            <MapPin className="w-4 h-4 text-brand-text-light mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-brand-text-secondary">Address</p>
              <p className="text-sm text-brand-text-light">{address}</p>
            </div>
          </div>

          {/* Opening Hours */}
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-brand-text-light mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-brand-text-secondary mb-1">Opening Hours</p>
              <div className="space-y-1">
                {openingHours.map((schedule) => (
                  <div key={schedule.days} className="flex justify-between text-sm gap-8">
                    <span className="text-brand-text-light">{schedule.days}</span>
                    <span className={`font-medium ${schedule.hours === "Closed" ? "text-brand-text-light" : "text-brand-text"}`}>
                      {schedule.hours}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Languages Spoken */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-brand-text-light" />
              <p className="text-sm font-semibold text-brand-text-secondary">Languages Spoken</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {languages.map((language) => (
                <span
                  key={language}
                  className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm border border-teal-200"
                >
                  {language}
                </span>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-brand-text-light" />
              <p className="text-sm font-semibold text-brand-text-secondary">Payment Methods</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((method) => (
                <span
                  key={method}
                  className="px-3 py-1 bg-navy-50 text-brand-navy rounded-full text-sm border border-navy-100"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>

          {/* Additional Services */}
          <div>
            <p className="text-sm font-semibold text-brand-text-secondary mb-3">Additional Services</p>
            <div className="space-y-3">
              {additionalServices.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center gap-3 bg-teal-50 rounded-lg p-3 border border-teal-200"
                >
                  {serviceIcons[service.name] || <Home className="w-5 h-5 text-brand-teal" />}
                  <div>
                    <p className="text-sm font-medium text-brand-text">{service.name}</p>
                    <p className="text-xs text-teal-700">
                      {service.available ? "Available" : "Not available"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
