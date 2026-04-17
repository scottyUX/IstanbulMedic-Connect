"use client"

import { ShieldCheck, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface RegistryRecord {
  id: string
  source: string
  license_number: string
  license_status: "active" | "expired" | "suspended" | "revoked" | "pending"
  licensed_since: string | null
  expires_at: string | null
  authorized_specialties: string[] | null
  registered_legal_name: string | null
  registered_address: string | null
  registry_url: string | null
  last_verified_at: string
}

export interface ComplianceEvent {
  id: string
  source: string
  event_type: string
  event_date: string
  description: string | null
  resolved_at: string | null
  severity: "low" | "medium" | "high" | "critical"
}

interface RegistrySectionProps {
  registryRecords: RegistryRecord[]
  complianceHistory: ComplianceEvent[]
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active:    { label: "Active",    className: "bg-green-100 text-green-800 border-green-200" },
  expired:   { label: "Expired",   className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  suspended: { label: "Suspended", className: "bg-orange-100 text-orange-800 border-orange-200" },
  revoked:   { label: "Revoked",   className: "bg-red-100 text-red-800 border-red-200" },
  pending:   { label: "Pending",   className: "bg-gray-100 text-gray-700 border-gray-200" },
}

const SEVERITY_CONFIG: Record<string, { label: string; className: string }> = {
  low:      { label: "Low",      className: "bg-blue-100 text-blue-800 border-blue-200" },
  medium:   { label: "Medium",   className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  high:     { label: "High",     className: "bg-orange-100 text-orange-800 border-orange-200" },
  critical: { label: "Critical", className: "bg-red-100 text-red-800 border-red-200" },
}

const SOURCE_LABELS: Record<string, string> = {
  turkish_ministry_of_health: "Turkish Ministry of Health",
}

function formatEventType(raw: string) {
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function RegistrySection({ registryRecords, complianceHistory }: RegistrySectionProps) {
  return (
    <Card id="registry" variant="profile" className="scroll-mt-32">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-6 w-6 text-[#17375B] mt-0.5 shrink-0" />
          <div>
            <h2 className="im-heading-2 text-foreground">Official Registry</h2>
            <p className="text-base text-muted-foreground">
              Verified data from official government health registries.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Registry Records */}
        {registryRecords.length === 0 ? (
          <p className="text-base text-muted-foreground italic">
            No registry records on file yet.
          </p>
        ) : (
          <div className="space-y-4">
            {registryRecords.map((record) => {
              const status = STATUS_CONFIG[record.license_status] ?? STATUS_CONFIG.pending
              return (
                <div
                  key={record.id}
                  className="rounded-xl border border-border bg-muted/5 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-muted-foreground">
                        {SOURCE_LABELS[record.source] ?? record.source}
                      </p>
                      <p className="text-base font-semibold text-foreground">
                        {record.registered_legal_name ?? "—"}
                      </p>
                    </div>
                    <Badge className={`shrink-0 border text-xs font-medium ${status.className}`}>
                      {status.label}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">License No: </span>
                      <span className="font-medium text-foreground">{record.license_number}</span>
                    </div>
                    {record.licensed_since && (
                      <div>
                        <span className="text-muted-foreground">Licensed since: </span>
                        <span className="font-medium text-foreground">{formatDate(record.licensed_since)}</span>
                      </div>
                    )}
                    {record.expires_at && (
                      <div>
                        <span className="text-muted-foreground">Expires: </span>
                        <span className="font-medium text-foreground">{formatDate(record.expires_at)}</span>
                      </div>
                    )}
                    {record.registered_address && (
                      <div className="sm:col-span-2">
                        <span className="text-muted-foreground">Address: </span>
                        <span className="font-medium text-foreground">{record.registered_address}</span>
                      </div>
                    )}
                  </div>

                  {record.authorized_specialties && record.authorized_specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {record.authorized_specialties.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center rounded-full bg-[#17375B]/8 px-2.5 py-0.5 text-xs font-medium text-[#17375B]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                    <span>Last verified: {formatDate(record.last_verified_at)}</span>
                    {record.registry_url && (
                      <a
                        href={record.registry_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#3EBBB7] hover:underline"
                      >
                        View source <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Compliance History */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Compliance History</h3>
          {complianceHistory.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>No compliance issues on record.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {complianceHistory.map((event) => {
                const sev = SEVERITY_CONFIG[event.severity] ?? SEVERITY_CONFIG.low
                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 rounded-lg border border-border p-3"
                  >
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">
                          {formatEventType(event.event_type)}
                        </span>
                        <Badge className={`border text-xs font-medium ${sev.className}`}>
                          {sev.label}
                        </Badge>
                        {event.resolved_at && (
                          <Badge className="border text-xs font-medium bg-green-100 text-green-800 border-green-200">
                            Resolved
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(event.event_date)}</p>
                      {event.description && (
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
