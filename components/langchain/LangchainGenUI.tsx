"use client";

import { useState } from "react";
import { useCopilotAction } from "@copilotkit/react-core";

// ============================================================================
// Generative UI Components
// ============================================================================

interface ClinicProfileCardProps {
  summary: {
    id?: string;
    display_name: string;
    status?: string;
    description?: string;
    short_description?: string;
    website_url?: string;
    years_in_operation?: number;
    procedures_performed?: number;
    contact?: { phone?: string; email?: string; whatsapp?: string };
    location?: { city: string; country: string; address?: string };
    specialties?: { service_name: string; service_category: string; is_primary: boolean }[];
    pricing?: { service_name: string; price_min?: number; price_max?: number; currency?: string }[];
    packages?: { package_name: string; price_min?: number; price_max?: number; currency?: string; nights_included?: number }[];
    score?: { overall_score: number; band: string };
    languages?: { language: string; support_type: string }[];
    team?: { name?: string; role: string; credentials: string; years_experience?: number }[];
    review_count?: number;
    media?: { url: string; alt_text?: string; caption?: string; is_primary?: boolean }[];
    accreditations?: { credential_name: string }[];
    instagram?: { handle: string | null; follower_count: number | null; verified: boolean | null };
    reddit?: { score: number | null; thread_count: number; sentiment_score: number | null };
    registry_verified?: boolean;
    google?: { rating: number | null; total: number | null };
  };
}

const ClinicProfileCard = ({ summary }: ClinicProfileCardProps) => {
  const s = summary;
  const [expanded, setExpanded] = useState(false);

  const primaryImage = s.media?.find((m) => m.is_primary) ?? s.media?.[0];
  const hasImages = !!primaryImage;
  const profileUrl = s.id ? `/clinics/${s.id}` : null;

  const formatPrice = (p: { price_min?: number; price_max?: number; currency?: string }) => {
    const cur = p.currency ?? "€";
    if (p.price_min != null && p.price_max != null)
      return `${cur}${p.price_min.toLocaleString()} – ${p.price_max.toLocaleString()}`;
    if (p.price_min != null) return `from ${cur}${p.price_min.toLocaleString()}`;
    return "Contact for pricing";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden w-[380px]">

      {/* Hero image */}
      {hasImages && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={primaryImage!.url}
          alt={primaryImage!.alt_text ?? s.display_name}
          className="block w-full h-44 object-cover flex-shrink-0"
        />
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 leading-tight">{s.display_name}</h3>
            {s.location && (
              <p className="text-sm text-gray-500 mt-0.5">
                📍 {s.location.city}, {s.location.country}
              </p>
            )}
          </div>
          {s.score && (
            <div className="flex flex-col items-center bg-[#17375B] rounded-xl px-3 py-1.5 ml-3 flex-shrink-0">
              <span className="text-base font-bold text-white leading-none">{s.score.overall_score}</span>
              <span className="text-[10px] text-blue-200 mt-0.5">Band {s.score.band}</span>
            </div>
          )}
        </div>

        {/* Trust badges */}
        {(s.registry_verified || (s.accreditations && s.accreditations.length > 0)) && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {s.registry_verified && (
              <span className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-0.5 font-medium">
                ✓ Licensed
              </span>
            )}
            {s.accreditations?.slice(0, 3).map((a) => (
              <span key={a.credential_name} className="text-xs bg-[#17375B]/10 text-[#17375B] rounded-full px-2.5 py-0.5 font-medium">
                {a.credential_name}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {(s.short_description || s.description) && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              {expanded && s.description ? s.description : s.short_description}
            </p>
            {s.description && s.description !== s.short_description && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-xs text-[#3EBBB7] font-medium mt-1 hover:underline"
              >
                {expanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        )}

        {/* Specialties */}
        {s.specialties && s.specialties.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Specialties</p>
            <div className="flex flex-wrap gap-1.5">
              {s.specialties.slice(0, 6).map((sp) => (
                <span
                  key={sp.service_name}
                  className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${
                    sp.is_primary
                      ? "bg-[#17375B]/10 text-[#17375B]"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {sp.service_name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Pricing */}
        {s.pricing && s.pricing.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Pricing</p>
            <div className="space-y-1.5">
              {s.pricing.slice(0, 3).map((p) => (
                <div key={p.service_name} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">{p.service_name}</span>
                  <span className="font-bold text-[#17375B] text-sm">{formatPrice(p)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team */}
        {s.team && s.team.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Team</p>
            <div className="space-y-1">
              {s.team.slice(0, 3).map((t, i) => (
                <p key={i} className="text-sm text-gray-700">
                  <span className="font-medium text-gray-900">{t.name ?? t.role}</span>
                  {t.credentials && <span className="text-gray-500"> · {t.credentials}</span>}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Community signals */}
        {(s.reddit || s.instagram) && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Community</p>
            <div className="space-y-2">
              {s.reddit && (
                <div className="flex items-center gap-2 text-sm">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[#FF4500] shrink-0">
                    <path d="M10 0C4.478 0 0 4.478 0 10s4.478 10 10 10 10-4.478 10-10S15.522 0 10 0zm5.878 11.443a1.24 1.24 0 01-1.24 1.24 1.22 1.22 0 01-.834-.327 6.127 6.127 0 01-3.101.818l.525-2.467 1.71.358a.881.881 0 101.71-.042.88.88 0 00-.88.88l-1.91-.4-.588 2.763c-1.195-.028-2.27-.37-3.103-.818a1.237 1.237 0 11-1.595-1.885 2.41 2.41 0 01-.03-.379c0-1.936 2.254-3.508 5.034-3.508 2.78 0 5.034 1.572 5.034 3.508 0 .133-.01.265-.03.395.24.204.392.511.392.852l-.094.011zm-7.658-.51a.88.88 0 101.76 0 .88.88 0 00-1.76 0zm4.947.88a.88.88 0 100-1.761.88.88 0 000 1.76z"/>
                  </svg>
                  {s.reddit.score != null ? (
                    <span className="font-medium text-gray-900">{s.reddit.score.toFixed(1)}/10</span>
                  ) : (
                    <span className="text-gray-400 text-xs italic">Insufficient data</span>
                  )}
                  {s.reddit.thread_count > 0 && (
                    <span className="text-gray-500">· {s.reddit.thread_count} threads</span>
                  )}
                  {s.reddit.sentiment_score != null && (
                    <span className={`text-xs font-medium ml-auto ${
                      s.reddit.sentiment_score >= 0.65 ? "text-emerald-600" :
                      s.reddit.sentiment_score >= 0.45 ? "text-amber-600" : "text-rose-500"
                    }`}>
                      {s.reddit.sentiment_score >= 0.65 ? "Positive" : s.reddit.sentiment_score >= 0.45 ? "Mixed" : "Negative"}
                    </span>
                  )}
                </div>
              )}
              {s.instagram && (s.instagram.follower_count != null || s.instagram.handle) && (
                <div className="flex items-center gap-2 text-sm">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#E1306C] shrink-0">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  {s.instagram.follower_count != null && (
                    <span className="font-medium text-gray-900">
                      {s.instagram.follower_count >= 1_000_000
                        ? `${(s.instagram.follower_count / 1_000_000).toFixed(1)}M`
                        : s.instagram.follower_count >= 1_000
                        ? `${(s.instagram.follower_count / 1_000).toFixed(1)}K`
                        : s.instagram.follower_count.toLocaleString()} followers
                    </span>
                  )}
                  {s.instagram.handle && (
                    <span className="text-gray-500">
                      @{s.instagram.handle}{s.instagram.verified ? " ✓" : ""}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats row */}
        {(s.google != null || s.years_in_operation != null || s.procedures_performed != null || (s.languages && s.languages.length > 0)) && (
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100 mb-4 flex-wrap">
            {s.google?.rating != null && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" aria-hidden>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="font-medium">{s.google.rating.toFixed(1)}</span>
                <span className="text-yellow-500">★</span>
                {s.google.total != null && <span className="text-gray-400">({s.google.total.toLocaleString()})</span>}
              </div>
            )}
            {s.years_in_operation != null && (
              <div className="text-xs text-gray-600">
                <span className="font-medium">{s.years_in_operation}</span>
                <span className="text-gray-400"> yrs</span>
              </div>
            )}
            {s.procedures_performed != null && (
              <div className="text-xs text-gray-600">
                <span className="font-medium">{s.procedures_performed.toLocaleString()}</span>
                <span className="text-gray-400"> procedures</span>
              </div>
            )}
            {s.languages && s.languages.length > 0 && (
              <div className="text-xs text-gray-500 truncate">
                🗣 {s.languages.map((l) => l.language).join(", ")}
              </div>
            )}
          </div>
        )}

        {/* CTA bar */}
        {(s.contact?.whatsapp || s.website_url || profileUrl) && (
          <div className="flex gap-2">
            {profileUrl && (
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#17375B] text-white text-sm font-medium rounded-xl py-2.5 hover:bg-[#102741] transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
                View profile
              </a>
            )}
            {s.contact?.whatsapp && (
              <a
                href={`https://wa.me/${s.contact.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#25D366] text-white text-sm font-medium rounded-xl py-2.5 hover:bg-[#1ebe5a] transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </a>
            )}
            {s.website_url && (
              <a
                href={s.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 border border-[#3EBBB7] text-[#3EBBB7] text-sm font-medium rounded-xl py-2.5 hover:bg-[#3EBBB7]/5 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
                </svg>
                Website
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


interface LoadingCardProps {
  message: string;
}

const LoadingCard = ({ message }: LoadingCardProps) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg max-w-lg">
    <div className="flex items-center gap-3 text-gray-600">
      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <span>{message}</span>
    </div>
  </div>
);

interface ErrorCardProps {
  message: string;
}

const ErrorCard = ({ message }: ErrorCardProps) => (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800 max-w-lg">
    {message}
  </div>
);


interface DoctorProfileCardProps {
  doctors: {
    id: string;
    name?: string;
    role: string;
    credentials: string;
    years_experience?: number;
    photo_url?: string;
    clinic: { id: string; display_name: string };
  }[];
}

const DoctorProfileCard = ({ doctors }: DoctorProfileCardProps) => {
  if (doctors.length === 0) {
    return <ErrorCard message="No doctors found for that query." />;
  }
  return (
    <div className="flex flex-col gap-3 w-[380px]">
      {doctors.map((d) => {
        const displayName = d.name ?? d.role.replace(/_/g, " ");
        const initials =
          d.name
            ?.split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase() ?? "")
            .join("") || "DR";
        const showRole = d.name != null;

        return (
          <div key={d.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-md">
            <div className="flex items-start gap-4">
              {d.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={d.photo_url}
                  alt={displayName}
                  className="w-14 h-14 rounded-full object-cover flex-shrink-0 bg-gray-100"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#17375B] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-base font-semibold leading-none">{initials}</span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-[#17375B] leading-tight">
                  {displayName}
                </h3>
                {showRole && (
                  <p className="text-xs text-gray-500 capitalize mt-0.5">
                    {d.role.replace(/_/g, " ")}
                  </p>
                )}
                {d.credentials && (
                  <p className="text-sm text-gray-600 mt-1 leading-snug">{d.credentials}</p>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {d.years_experience != null && (
                    <span className="text-xs bg-[#17375B]/10 text-[#17375B] rounded-full px-2.5 py-0.5 font-medium">
                      {d.years_experience} yrs experience
                    </span>
                  )}
                  <span className="text-xs text-gray-400">at {d.clinic.display_name}</span>
                </div>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
};

interface ReviewsCardProps {
  clinic: { id: string; display_name: string };
  aggregate: {
    average_rating: number | null;
    total_count: number;
    distribution: Record<string, number>;
  };
  reviews: {
    id: string;
    rating: string;
    review_text: string;
    review_date?: string;
    language?: string;
  }[];
  google?: { rating: number | null; total: number | null } | null;
}

const REVIEW_TRUNCATE = 220;

const ReviewItem = ({ r }: { r: ReviewsCardProps["reviews"][number] }) => {
  const [expanded, setExpanded] = useState(false);
  const rating = Math.round(parseFloat(r.rating) || 0);
  const long = r.review_text.length > REVIEW_TRUNCATE;
  const displayText = long && !expanded ? r.review_text.slice(0, REVIEW_TRUNCATE) + "…" : r.review_text;

  return (
    <div className="border-t border-gray-100 pt-3">
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        <span aria-hidden className="text-sm leading-none">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} style={{ color: i < rating ? "#FFD700" : "#D1D5DB" }}>★</span>
          ))}
        </span>
        {r.language && !r.language.toLowerCase().startsWith("en") && (
          <span className="text-xs bg-[#17375B]/8 text-[#17375B] rounded-full px-2 py-0.5 font-medium">
            {r.language}
          </span>
        )}
        {r.review_date && (
          <span className="text-xs text-gray-400 ml-auto">{r.review_date}</span>
        )}
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{displayText}</p>
      {long && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-[#3EBBB7] font-medium mt-1 hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
};

const ReviewsCard = ({ clinic, aggregate, reviews, google }: ReviewsCardProps) => {
  const maxBucket = Math.max(...Object.values(aggregate.distribution), 1);
  const stars = aggregate.average_rating ?? 0;
  const profileUrl = `/clinics/${clinic.id}#reviews`;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden w-[380px]">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold text-[#17375B] leading-tight">{clinic.display_name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-gray-900 leading-none">
                {aggregate.average_rating != null ? aggregate.average_rating.toFixed(1) : "—"}
              </span>
              <span aria-hidden className="text-base leading-none">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} style={{ color: i < Math.round(stars) ? "#FFD700" : "#D1D5DB" }}>★</span>
                ))}
              </span>
              <span className="text-xs text-gray-500">
                {aggregate.total_count} review{aggregate.total_count === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>

        {/* Google Places rating */}
        {google?.rating != null && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-gray-50 rounded-xl">
            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm font-semibold text-gray-900">{google.rating.toFixed(1)}</span>
            <span className="text-sm text-yellow-500">{"★".repeat(Math.round(google.rating))}<span className="text-gray-300">{"★".repeat(5 - Math.round(google.rating))}</span></span>
            {google.total != null && (
              <span className="text-xs text-gray-500 ml-auto">{google.total.toLocaleString()} Google reviews</span>
            )}
          </div>
        )}

        {/* Distribution bars */}
        <div className="space-y-1 mb-1">
          {[5, 4, 3, 2, 1].map((bucket) => {
            const count = aggregate.distribution[bucket] ?? 0;
            const pct = (count / maxBucket) * 100;
            return (
              <div key={bucket} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-gray-500 text-right">{bucket}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "#FFD700" }} />
                </div>
                <span className="w-5 text-right text-gray-400">{count}</span>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-gray-400 mb-4">
          Distribution based on {aggregate.total_count} review{aggregate.total_count === 1 ? "" : "s"} in our database
        </p>

        {/* Reviews */}
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Most recent</p>
        <div className="space-y-0">
          {reviews.map((r) => (
            <ReviewItem key={r.id} r={r} />
          ))}
        </div>
      </div>

      {/* Footer link */}
      <div className="px-5 pb-4">
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full border border-[#17375B] text-[#17375B] text-sm font-medium rounded-xl py-2.5 hover:bg-[#17375B]/5 transition-colors mt-2"
        >
          View all reviews
        </a>
      </div>
    </div>
  );
};

interface PackagesCardProps {
  clinic: { id: string; display_name: string };
  packages: {
    id: string;
    package_name: string;
    includes?: unknown;
    excludes?: unknown;
    nights_included?: number;
    transport_included?: boolean;
    aftercare_duration_days?: number;
    price_min?: number;
    price_max?: number;
    currency?: string;
  }[];
}

const PackagesCard = ({ clinic, packages }: PackagesCardProps) => {
  if (packages.length === 0) {
    return <ErrorCard message={`No packages found for ${clinic.display_name}.`} />;
  }
  const formatPrice = (
    p: PackagesCardProps["packages"][number],
  ): string => {
    const cur = p.currency ?? "€";
    if (p.price_min != null && p.price_max != null) {
      return `${cur}${p.price_min.toLocaleString()} – ${cur}${p.price_max.toLocaleString()}`;
    }
    if (p.price_min != null) return `from ${cur}${p.price_min.toLocaleString()}`;
    return "Contact for pricing";
  };
  return (
    <div className="flex flex-col gap-3 max-w-lg">
      <div className="text-sm font-medium text-gray-700">
        Packages at {clinic.display_name}
      </div>
      {packages.map((p) => (
        <div
          key={p.id}
          className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900">{p.package_name}</h3>
            <span className="text-sm font-medium text-blue-700">
              {formatPrice(p)}
            </span>
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {p.nights_included != null && (
              <span className="text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">
                {p.nights_included} {p.nights_included === 1 ? "night" : "nights"}
              </span>
            )}
            {p.transport_included && (
              <span className="text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">
                transport
              </span>
            )}
            {p.aftercare_duration_days != null && (
              <span className="text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">
                {p.aftercare_duration_days}d aftercare
              </span>
            )}
          </div>
          {Array.isArray(p.includes) && p.includes.length > 0 && (
            <p className="text-xs text-gray-500">
              <span className="font-medium">Includes:</span>{" "}
              {(p.includes as string[]).join(", ")}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

interface ClinicComparisonTableProps {
  clinics: { id: string; display_name: string; image_url?: string }[];
  comparison: Record<string, { clinic_id: string; value: unknown }[]>;
  unresolved?: { type: string; value: string }[];
}

const formatDimensionValue = (dim: string, value: unknown): string => {
  if (value == null) return "—";
  if (dim === "score" && typeof value === "object") {
    const s = value as { overall_score?: number; band?: string };
    return s.overall_score != null
      ? `${s.overall_score}${s.band ? ` (${s.band})` : ""}`
      : "—";
  }
  if (dim === "location" && typeof value === "object") {
    const l = value as { city?: string; country?: string };
    return [l.city, l.country].filter(Boolean).join(", ") || "—";
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    if (dim === "pricing") {
      const rows = value as { service_name?: string; price_min?: number; price_max?: number; currency?: string }[];
      return rows.slice(0, 3).map((p) => {
        const cur = p.currency ?? "€";
        const range =
          p.price_min != null && p.price_max != null
            ? `${cur}${p.price_min.toLocaleString()}–${p.price_max.toLocaleString()}`
            : p.price_min != null
            ? `from ${cur}${p.price_min.toLocaleString()}`
            : null;
        return range ? `${p.service_name}: ${range}` : p.service_name ?? "—";
      }).join("\n") || "—";
    }
    if (dim === "team") {
      return (value as { name?: string | null; role: string; credentials?: string }[])
        .slice(0, 3)
        .map((m) => {
          const label = m.name ?? m.role.replace(/_/g, " ");
          return m.credentials ? `${label} · ${m.credentials}` : label;
        })
        .join("\n") || "—";
    }
    if (dim === "services") {
      const items = value as { service_name: string; is_primary_service?: boolean }[];
      const primary = items.filter((s) => s.is_primary_service).map((s) => s.service_name);
      const shown = primary.length > 0 ? primary : items.map((s) => s.service_name);
      return shown.slice(0, 5).join(", ") || "—";
    }
    if (dim === "languages") {
      return (value as { language: string }[]).map((l) => l.language).join(", ");
    }
    if (dim === "accreditations") {
      return (value as { credential_name: string }[]).slice(0, 3).map((c) => c.credential_name).join(", ") || "—";
    }
    if (dim === "registry") {
      const records = value as { license_status: string }[];
      const verified = records.some((r) => r.license_status === "active");
      return verified ? "Verified" : "Not verified";
    }
    return `${value.length}`;
  }
  if (dim === "google" && value !== null && typeof value === "object") {
    const g = value as { average_rating: number; review_count: number };
    return `${g.average_rating.toFixed(1)} ★  ·  ${g.review_count} reviews`;
  }
  if (dim === "reddit" && value !== null && typeof value === "object") {
    const r = value as { score: number | null; thread_count: number; sentiment_score: number | null };
    const parts: string[] = [];
    if (r.score != null) parts.push(`${r.score.toFixed(1)}/10`);
    if (r.thread_count > 0) parts.push(`${r.thread_count} threads`);
    if (r.sentiment_score != null) {
      const label = r.sentiment_score >= 0.65 ? "Mostly positive" : r.sentiment_score >= 0.45 ? "Mixed" : "Mostly negative";
      parts.push(label);
    }
    return parts.join(" · ") || "—";
  }
  if (dim === "instagram" && value !== null && typeof value === "object") {
    const ig = value as { follower_count: number | null; account_handle: string | null; verified: boolean | null; source_score: number | null };
    const parts: string[] = [];
    if (ig.follower_count != null) {
      const n = ig.follower_count;
      const formatted = n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : n.toLocaleString();
      parts.push(`${formatted} followers`);
    }
    if (ig.account_handle) parts.push(`@${ig.account_handle}${ig.verified ? " ✓" : ""}`);
    if (ig.source_score != null) parts.push(`Score: ${ig.source_score}/100`);
    return parts.join("\n") || "—";
  }
  if (dim === "hrn" && value !== null && typeof value === "object") {
    const h = value as { score: number | null; thread_count: number; sentiment_score: number | null };
    const parts: string[] = [];
    if (h.score != null) parts.push(`${h.score.toFixed(1)}/10`);
    if (h.thread_count > 0) parts.push(`${h.thread_count} threads`);
    if (h.sentiment_score != null) {
      const label = h.sentiment_score >= 0.65 ? "Mostly positive" : h.sentiment_score >= 0.45 ? "Mixed" : "Mostly negative";
      parts.push(label);
    }
    return parts.join(" · ") || "—";
  }
  return String(value);
};

function getBestClinicId(
  dim: string,
  row: { clinic_id: string; value: unknown }[],
): string | null {
  if (dim === "score") {
    let best: { id: string; score: number } | null = null;
    for (const entry of row) {
      const v = entry.value as { overall_score?: number } | null;
      if (v?.overall_score != null && (!best || v.overall_score > best.score))
        best = { id: entry.clinic_id, score: v.overall_score };
    }
    return best?.id ?? null;
  }
  if (dim === "pricing") {
    let best: { id: string; price: number } | null = null;
    for (const entry of row) {
      if (!Array.isArray(entry.value)) continue;
      const mins = (entry.value as { price_min?: number }[])
        .map((p) => p.price_min)
        .filter((p): p is number => p != null);
      if (!mins.length) continue;
      const min = Math.min(...mins);
      if (!best || min < best.price) best = { id: entry.clinic_id, price: min };
    }
    return best?.id ?? null;
  }
  if (dim === "google") {
    let best: { id: string; rating: number } | null = null;
    for (const entry of row) {
      const v = entry.value as { average_rating?: number } | null;
      if (v?.average_rating != null && (!best || v.average_rating > best.rating))
        best = { id: entry.clinic_id, rating: v.average_rating };
    }
    return best?.id ?? null;
  }
  if (dim === "reddit") {
    let best: { id: string; score: number } | null = null;
    for (const entry of row) {
      const v = entry.value as { score?: number | null } | null;
      if (v?.score != null && (!best || v.score > best.score))
        best = { id: entry.clinic_id, score: v.score };
    }
    return best?.id ?? null;
  }
  if (dim === "instagram") {
    let best: { id: string; score: number } | null = null;
    for (const entry of row) {
      const v = entry.value as { source_score?: number | null } | null;
      if (v?.source_score != null && (!best || v.source_score > best.score))
        best = { id: entry.clinic_id, score: v.source_score };
    }
    return best?.id ?? null;
  }
  if (dim === "hrn") {
    let best: { id: string; score: number } | null = null;
    for (const entry of row) {
      const v = entry.value as { score?: number | null } | null;
      if (v?.score != null && (!best || v.score > best.score))
        best = { id: entry.clinic_id, score: v.score };
    }
    return best?.id ?? null;
  }
  return null;
}

const ClinicComparisonTable = ({
  clinics,
  comparison,
  unresolved,
}: ClinicComparisonTableProps) => {
  const dimensions = Object.keys(comparison);
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-md w-[380px] overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="pb-2 pr-2" />
            {clinics.map((c) => {
              const initials = c.display_name
                .split(" ").filter(Boolean).slice(0, 2)
                .map((w) => w[0]?.toUpperCase() ?? "").join("");
              return (
                <th key={c.id} className="text-left pb-2 px-2 min-w-[110px]">
                  {c.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.image_url}
                      alt={c.display_name}
                      className="w-full h-14 object-cover rounded-lg mb-1.5"
                    />
                  ) : (
                    <div className="w-full h-14 rounded-lg bg-[#17375B]/10 flex items-center justify-center mb-1.5">
                      <span className="text-[#17375B] text-sm font-semibold">{initials}</span>
                    </div>
                  )}
                  <a
                    href={`/clinics/${c.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#17375B] hover:underline leading-tight block"
                  >
                    {c.display_name}
                  </a>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {dimensions.map((dim) => {
            const row = comparison[dim];
            if (row.every((entry) => entry.value == null)) return null;
            const bestId = getBestClinicId(dim, row);
            return (
              <tr key={dim} className="border-t border-gray-100">
                <td className="py-2 pr-2 text-xs font-medium text-gray-400 uppercase tracking-wide align-top whitespace-nowrap">
                  {dim}
                </td>
                {clinics.map((c) => {
                  const entry = row.find((r) => r.clinic_id === c.id);
                  return (
                    <td
                      key={c.id}
                      className={`py-2 px-2 align-top max-w-[140px] whitespace-pre-line ${
                        bestId === c.id
                          ? "text-[#3EBBB7] font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      {formatDimensionValue(dim, entry?.value)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {unresolved && unresolved.length > 0 && (
        <p className="text-xs text-gray-400 italic mt-3">
          Could not find: {unresolved.map((u) => u.value).join(", ")}
        </p>
      )}

      <div className="mt-4 pt-3 border-t border-gray-100">
        <a
          href={
            clinics.length === 2
              ? `/clinics/compare?left=${clinics[0].id}&right=${clinics[1].id}`
              : `/clinics/compare`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full border border-[#3EBBB7] text-[#3EBBB7] text-sm font-medium rounded-xl py-2.5 hover:bg-[#3EBBB7]/5 transition-colors"
        >
          See full comparison
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
          </svg>
        </a>
      </div>
    </div>
  );
};

// ============================================================================
// LangchainGenUI — registers CopilotKit tools backed by LangChain database tools
// ============================================================================

const LangchainGenUI = () => {
  // ---- clinic_summary: render-only; tool runs server-side via LangchainAgentAdapter ----
  useCopilotAction({
    name: "clinic_summary",
    available: "remote",
    description:
      "Get a comprehensive structured summary of a clinic including location, specialties, pricing, packages, trust score, team, and reviews. Provide either a clinic_id (UUID) or clinic_name. Use this when a patient asks for a clinic overview, profile, or comparison.",
    parameters: [
      {
        name: "clinic_id",
        type: "string" as const,
        description: "Exact clinic UUID for direct lookup",
        required: false,
      },
      {
        name: "clinic_name",
        type: "string" as const,
        description: "Clinic name or partial name to search for (e.g. 'Vera Clinic')",
        required: false,
      },
    ],
    // @ts-expect-error - CopilotKit accepts null returns in render functions
    render: ({ status, result }) => {
      if (status === "complete" && result) {
        try {
          const data = typeof result === "string" ? JSON.parse(result) : result;
          if (data.summary) {
            return <ClinicProfileCard summary={data.summary} />;
          }
          if (data.error) {
            return (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                {data.error}
              </div>
            );
          }
        } catch {
          return null;
        }
      }
      if (status === "inProgress" || status === "executing") {
        return (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg max-w-lg">
            <div className="flex items-center gap-3 text-gray-600">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Loading clinic profile...</span>
            </div>
          </div>
        );
      }
      return null;
    },
  });

  // ---- database_lookup: render-only; tool runs server-side via LangchainAgentAdapter ----
  useCopilotAction({
    name: "database_lookup",
    available: "remote",
    description:
      "Look up information from the database. Available tables: clinics, clinic_locations, clinic_pricing, clinic_packages, clinic_reviews, clinic_services, clinic_team, clinic_scores, clinic_credentials, clinic_languages, clinic_mentions, clinic_facts, clinic_media, sources. Most tables have a clinic_id column for filtering.",
    parameters: [
      {
        name: "table",
        type: "string" as const,
        description: "The database table to query",
        required: true,
      },
      {
        name: "query",
        type: "string" as const,
        description: "Optional text to search for across relevant columns",
        required: false,
      },
      {
        name: "filters",
        type: "object" as const,
        description: "Optional exact-match filters as key-value pairs",
        required: false,
      },
      {
        name: "select",
        type: "string" as const,
        description: "Columns to select, defaults to all columns (*)",
        required: false,
      },
      {
        name: "limit",
        type: "number" as const,
        description: "Maximum number of results to return, defaults to 10",
        required: false,
      },
    ],
    // @ts-expect-error - CopilotKit accepts null returns in render functions
    render: (props: { status: string; result?: string; args?: { table?: string } }) => {
      const { status, result, args } = props;
      if (status === "complete" && result) {
        try {
          const data = typeof result === "string" ? JSON.parse(result) : result;
          if (data.metadata) {
            const label = data.metadata.table.replace(/_/g, " ");
            const count: number = data.metadata.count ?? 0;
            return (
              <div className="inline-flex items-center gap-1.5 text-xs text-gray-400 py-0.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 flex-shrink-0">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <span>{label}</span>
                <span>·</span>
                <span>{count} {count === 1 ? "result" : "results"}</span>
              </div>
            );
          }
        } catch {
          return null;
        }
      }
      if (status === "inProgress" || status === "executing") {
        const table = args?.table?.replace(/_/g, " ") ?? "database";
        return (
          <div className="inline-flex items-center gap-1.5 text-xs text-gray-400 py-0.5">
            <div className="w-3 h-3 border border-gray-300 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <span>Searching {table}…</span>
          </div>
        );
      }
      return null;
    },
  });

  // ---- doctor_profile: render-only; tool runs server-side via LangchainAgentAdapter ----
  useCopilotAction({
    name: "doctor_profile",
    available: "remote",
    description:
      "Look up doctors and surgeons by doctor_id, doctor_name (partial match), or clinic_id (returns all doctors at the clinic).",
    parameters: [
      {
        name: "doctor_id",
        type: "string" as const,
        description: "Exact doctor UUID for direct lookup",
        required: false,
      },
      {
        name: "doctor_name",
        type: "string" as const,
        description: "Doctor name or partial name to search for",
        required: false,
      },
      {
        name: "clinic_id",
        type: "string" as const,
        description: "Clinic UUID to list all doctors at that clinic",
        required: false,
      },
    ],
    // @ts-expect-error - CopilotKit accepts null returns in render functions
    render: ({ status, result }) => {
      if (status === "complete" && result) {
        try {
          const data = typeof result === "string" ? JSON.parse(result) : result;
          if (data.error) {
            return <ErrorCard message={data.error} />;
          }
          if (data.doctors) {
            return <DoctorProfileCard doctors={data.doctors} />;
          }
        } catch {
          return null;
        }
      }
      if (status === "inProgress" || status === "executing") {
        return <LoadingCard message="Looking up doctors..." />;
      }
      return null;
    },
  });

  // ---- clinic_reviews: render-only; tool runs server-side via LangchainAgentAdapter ----
  useCopilotAction({
    name: "clinic_reviews",
    available: "remote",
    description:
      "Fetch patient reviews for a clinic plus an aggregate (average, count, distribution).",
    parameters: [
      {
        name: "clinic_id",
        type: "string" as const,
        description: "Clinic UUID for direct lookup",
        required: false,
      },
      {
        name: "clinic_name",
        type: "string" as const,
        description: "Clinic name (partial match)",
        required: false,
      },
      {
        name: "limit",
        type: "number" as const,
        description: "How many reviews to show (1-10, default 5)",
        required: false,
      },
      {
        name: "min_rating",
        type: "number" as const,
        description: "Minimum rating (1-5) to include",
        required: false,
      },
    ],
    // @ts-expect-error - CopilotKit accepts null returns in render functions
    render: ({ status, result }) => {
      if (status === "complete" && result) {
        try {
          const data = typeof result === "string" ? JSON.parse(result) : result;
          if (data.error) return <ErrorCard message={data.error} />;
          if (data.aggregate && data.reviews) {
            return (
              <ReviewsCard
                clinic={data.clinic}
                aggregate={data.aggregate}
                reviews={data.reviews}
              />
            );
          }
        } catch {
          return null;
        }
      }
      if (status === "inProgress" || status === "executing") {
        return <LoadingCard message="Fetching reviews..." />;
      }
      return null;
    },
  });

  // ---- clinic_packages: render-only; tool runs server-side via LangchainAgentAdapter ----
  useCopilotAction({
    name: "clinic_packages",
    available: "remote",
    description:
      "Look up treatment packages for a clinic with inclusions, nights, transport, aftercare, and price ranges.",
    parameters: [
      {
        name: "clinic_id",
        type: "string" as const,
        description: "Clinic UUID for direct lookup",
        required: false,
      },
      {
        name: "clinic_name",
        type: "string" as const,
        description: "Clinic name (partial match)",
        required: false,
      },
      {
        name: "max_price",
        type: "number" as const,
        description: "Maximum price ceiling to filter packages",
        required: false,
      },
      {
        name: "currency",
        type: "string" as const,
        description: "Currency code (default EUR)",
        required: false,
      },
    ],
    // @ts-expect-error - CopilotKit accepts null returns in render functions
    render: ({ status, result }) => {
      if (status === "complete" && result) {
        try {
          const data = typeof result === "string" ? JSON.parse(result) : result;
          if (data.error) return <ErrorCard message={data.error} />;
          if (data.packages && data.clinic) {
            return <PackagesCard clinic={data.clinic} packages={data.packages} />;
          }
        } catch {
          return null;
        }
      }
      if (status === "inProgress" || status === "executing") {
        return <LoadingCard message="Looking up packages..." />;
      }
      return null;
    },
  });

  // ---- clinic_comparison: render-only; tool runs server-side via LangchainAgentAdapter ----
  useCopilotAction({
    name: "clinic_comparison",
    available: "remote",
    description:
      "Compare 2-4 clinics side by side across dimensions (pricing, score, team, services, languages, location, accreditations).",
    parameters: [
      {
        name: "clinic_ids",
        type: "string[]" as const,
        description: "UUIDs of clinics to compare",
        required: false,
      },
      {
        name: "clinic_names",
        type: "string[]" as const,
        description: "Names of clinics to compare (partial match)",
        required: false,
      },
      {
        name: "dimensions",
        type: "string[]" as const,
        description:
          "Which dimensions to compare (defaults to pricing, score, team, services)",
        required: false,
      },
    ],
    // @ts-expect-error - CopilotKit accepts null returns in render functions
    render: ({ status, result }) => {
      if (status === "complete" && result) {
        try {
          const data = typeof result === "string" ? JSON.parse(result) : result;
          if (data.error) return <ErrorCard message={data.error} />;
          if (data.clinics && data.comparison) {
            return (
              <ClinicComparisonTable
                clinics={data.clinics}
                comparison={data.comparison}
                unresolved={data.unresolved}
              />
            );
          }
        } catch {
          return null;
        }
      }
      if (status === "inProgress" || status === "executing") {
        return <LoadingCard message="Comparing clinics..." />;
      }
      return null;
    },
  });

  return null;
};

export default LangchainGenUI;
