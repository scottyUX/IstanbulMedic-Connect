"use client";

import { useCopilotAction, useFrontendTool } from "@copilotkit/react-core";

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

// ============================================================================
// LangchainGenUI — registers CopilotKit tools backed by LangChain database tools
// ============================================================================

const LangchainGenUI = () => {
  // ---- clinic_summary: frontend tool with generative UI ----
  useFrontendTool({
    name: "clinic_summary",
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
    handler: async ({ clinic_id, clinic_name }: { clinic_id?: string; clinic_name?: string }) => {
      const response = await fetch("/api/langchain-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "clinic_summary", args: { clinic_id, clinic_name } }),
      });
      if (!response.ok) {
        return JSON.stringify({ error: "Failed to fetch clinic summary" });
      }
      return JSON.stringify(await response.json());
    },
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

  // ---- database_lookup: backend action with optional generative UI ----
  useCopilotAction({
    name: "database_lookup",
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
    handler: async ({
      table,
      query,
      filters,
      select,
      limit,
    }: {
      table: string;
      query?: string;
      filters?: Record<string, string>;
      select?: string;
      limit?: number;
    }) => {
      const response = await fetch("/api/langchain-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "database_lookup",
          args: { table, query, filters, select, limit },
        }),
      });
      if (!response.ok) {
        return JSON.stringify({ error: "Failed to query database" });
      }
      const data = await response.json();
      return JSON.stringify(data);
    },
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

  return null;
};

export default LangchainGenUI;
