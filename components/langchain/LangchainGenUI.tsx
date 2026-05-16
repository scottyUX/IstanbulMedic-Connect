"use client";

import { useCopilotAction } from "@copilotkit/react-core";

// ============================================================================
// Generative UI Components
// ============================================================================

interface ClinicProfileCardProps {
  summary: {
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
  };
}

const ClinicProfileCard = ({ summary }: ClinicProfileCardProps) => {
  const s = summary;
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg max-w-lg">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{s.display_name}</h3>
          {s.location && (
            <p className="text-sm text-gray-500">{s.location.city}, {s.location.country}</p>
          )}
        </div>
        {s.score && (
          <div className="flex flex-col items-center bg-blue-50 rounded-lg px-3 py-1">
            <span className="text-lg font-bold text-blue-700">{s.score.overall_score}</span>
            <span className="text-xs text-blue-600">Band {s.score.band}</span>
          </div>
        )}
      </div>

      {s.short_description && (
        <p className="text-sm text-gray-600 mb-4">{s.short_description}</p>
      )}

      {s.specialties && s.specialties.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Specialties</p>
          <div className="flex flex-wrap gap-1">
            {s.specialties.slice(0, 5).map((sp) => (
              <span key={sp.service_name} className="text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">
                {sp.service_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {s.pricing && s.pricing.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Pricing</p>
          <div className="space-y-1">
            {s.pricing.slice(0, 3).map((p) => (
              <div key={p.service_name} className="flex justify-between text-sm">
                <span className="text-gray-700">{p.service_name}</span>
                <span className="font-medium text-gray-900">
                  {p.price_min != null && p.price_max != null
                    ? `${p.currency ?? "€"}${p.price_min.toLocaleString()} – ${p.price_max.toLocaleString()}`
                    : p.price_min != null
                      ? `from ${p.currency ?? "€"}${p.price_min.toLocaleString()}`
                      : "Contact for pricing"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {s.team && s.team.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Team</p>
          <div className="space-y-1">
            {s.team.slice(0, 3).map((t, i) => (
              <p key={i} className="text-sm text-gray-700">
                <span className="font-medium">{t.name ?? t.role}</span>
                {t.credentials && <span className="text-gray-500"> — {t.credentials}</span>}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
        {s.review_count != null && <span>{s.review_count} reviews</span>}
        {s.years_in_operation != null && <span>{s.years_in_operation} years</span>}
        {s.languages && s.languages.length > 0 && (
          <span>{s.languages.map((l) => l.language).join(", ")}</span>
        )}
      </div>
    </div>
  );
};

interface DatabaseResultsCardProps {
  table: string;
  count: number;
  results: Record<string, unknown>[];
}

const DatabaseResultsCard = ({ table, count, results }: DatabaseResultsCardProps) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg max-w-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 capitalize">
          {table.replace(/_/g, " ")}
        </h3>
        <span className="text-xs bg-blue-50 text-blue-700 rounded-full px-2 py-0.5">
          {count} result{count !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {results.slice(0, 5).map((row, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm">
            {Object.entries(row)
              .filter(([k]) => !["id", "clinic_id", "created_at", "updated_at", "source_id"].includes(k))
              .slice(0, 4)
              .map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <span className="text-gray-500 capitalize whitespace-nowrap">
                    {key.replace(/_/g, " ")}:
                  </span>
                  <span className="text-gray-900 truncate">
                    {typeof value === "object" ? JSON.stringify(value) : String(value ?? "—")}
                  </span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
};

interface ErrorCardProps {
  message: string;
}

const ErrorCard = ({ message }: ErrorCardProps) => (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800 max-w-lg">
    {message}
  </div>
);

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
    <div className="flex flex-col gap-3 max-w-lg">
      {doctors.map((d) => (
        <div
          key={d.id}
          className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-start gap-4">
            {d.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={d.photo_url}
                alt={d.name ?? d.role}
                className="w-14 h-14 rounded-full object-cover bg-gray-100"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {d.name ?? d.role}
              </h3>
              <p className="text-xs text-gray-500 capitalize">
                {d.role.replace(/_/g, " ")}
              </p>
              <p className="text-sm text-gray-700 mt-1">{d.credentials}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {d.years_experience != null && (
                  <span className="text-xs bg-blue-50 text-blue-700 rounded-full px-2 py-0.5">
                    {d.years_experience} yr experience
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  at {d.clinic.display_name}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
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
}

const ReviewsCard = ({ clinic, aggregate, reviews }: ReviewsCardProps) => {
  const maxBucket = Math.max(...Object.values(aggregate.distribution), 1);
  const stars = aggregate.average_rating ?? 0;
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg max-w-lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {clinic.display_name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-2xl font-bold text-gray-900">
            {aggregate.average_rating != null ? aggregate.average_rating.toFixed(1) : "—"}
          </span>
          <span aria-hidden className="text-yellow-500">
            {"★".repeat(Math.round(stars))}
            <span className="text-gray-300">
              {"★".repeat(5 - Math.round(stars))}
            </span>
          </span>
          <span className="text-sm text-gray-500">
            ({aggregate.total_count} review{aggregate.total_count === 1 ? "" : "s"})
          </span>
        </div>
      </div>

      <div className="space-y-1 mb-4">
        {[5, 4, 3, 2, 1].map((bucket) => {
          const count = aggregate.distribution[bucket] ?? 0;
          const pct = (count / maxBucket) * 100;
          return (
            <div key={bucket} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-gray-500">{bucket}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded overflow-hidden">
                <div
                  className="h-full bg-yellow-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-6 text-right text-gray-500">{count}</span>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-yellow-500 text-sm">
                {"★".repeat(Math.round(parseFloat(r.rating) || 0))}
              </span>
              {r.review_date && (
                <span className="text-xs text-gray-400">{r.review_date}</span>
              )}
            </div>
            <p className="text-sm text-gray-700 line-clamp-3">{r.review_text}</p>
          </div>
        ))}
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
  clinics: { id: string; display_name: string }[];
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
      const first = value[0] as {
        service_name?: string;
        price_min?: number;
        price_max?: number;
        currency?: string;
      };
      const cur = first.currency ?? "€";
      if (first.price_min != null && first.price_max != null) {
        return `${first.service_name}: ${cur}${first.price_min}–${first.price_max} (${value.length} items)`;
      }
      return `${value.length} services`;
    }
    if (dim === "team") {
      return `${value.length} member${value.length === 1 ? "" : "s"}`;
    }
    if (dim === "services") {
      const primary = (value as { service_name: string; is_primary: boolean }[])
        .filter((s) => s.is_primary)
        .map((s) => s.service_name);
      return primary.length > 0
        ? primary.join(", ")
        : `${value.length} service${value.length === 1 ? "" : "s"}`;
    }
    if (dim === "languages") {
      return (value as { language: string }[]).map((l) => l.language).join(", ");
    }
    if (dim === "accreditations") {
      return `${value.length} credential${value.length === 1 ? "" : "s"}`;
    }
    return `${value.length}`;
  }
  return String(value);
};

const ClinicComparisonTable = ({
  clinics,
  comparison,
  unresolved,
}: ClinicComparisonTableProps) => {
  const dimensions = Object.keys(comparison);
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-lg max-w-3xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left text-xs font-medium text-gray-500 uppercase pb-2">
              Dimension
            </th>
            {clinics.map((c) => (
              <th
                key={c.id}
                className="text-left text-xs font-semibold text-gray-900 pb-2 px-2"
              >
                {c.display_name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dimensions.map((dim) => {
            const row = comparison[dim];
            return (
              <tr key={dim} className="border-t border-gray-100">
                <td className="py-2 text-xs font-medium text-gray-500 uppercase">
                  {dim}
                </td>
                {clinics.map((c) => {
                  const entry = row.find((r) => r.clinic_id === c.id);
                  return (
                    <td
                      key={c.id}
                      className="py-2 px-2 text-gray-800 align-top max-w-xs"
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
        <p className="text-xs text-yellow-700 mt-3">
          Could not find: {unresolved.map((u) => u.value).join(", ")}
        </p>
      )}
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
    render: (props: { status: string; result?: string }) => {
      const { status, result } = props;
      if (status === "complete" && result) {
        try {
          const data = typeof result === "string" ? JSON.parse(result) : result;
          if (data.results && data.metadata) {
            return (
              <DatabaseResultsCard
                table={data.metadata.table}
                count={data.metadata.count}
                results={data.results}
              />
            );
          }
        } catch {
          return null;
        }
      }
      if (status === "inProgress" || status === "executing") {
        return (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm max-w-lg">
            <div className="flex items-center gap-3 text-gray-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Searching database...</span>
            </div>
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
