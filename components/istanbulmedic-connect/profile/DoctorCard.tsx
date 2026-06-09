"use client"

import { ExternalLink, GraduationCap, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface DoctorQualification {
  qualification: string
  source: "ishrs" | "iahrs" | "tprecd" | string
  sourceUrl: string | null
  verifiedAt: string | null
}

export interface Doctor {
  name: string | null
  specialty: string
  photo: string | null
  credentials: string[]
  yearsOfExperience: number | null
  education: string | null
  /** Externally-verified registry memberships scraped from public directories.
   * Each entry corresponds to one registry the doctor is listed in. */
  verifiedQualifications?: DoctorQualification[]
  /** Most-recent verification timestamp across all sources. */
  lastVerifiedAt?: string | null
}

interface DoctorCardProps {
  doctor: Doctor
  className?: string
}

function formatVerifiedDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" })
}

export const DoctorCard = ({ doctor, className }: DoctorCardProps) => {
  const verified = doctor.verifiedQualifications ?? []
  const lastVerifiedLabel = formatVerifiedDate(doctor.lastVerifiedAt)

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-muted/5",
        className
      )}
    >
<div className="flex flex-col justify-center min-w-0 flex-1 gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h3 className="im-heading-3 text-foreground">{doctor.name ?? "Doctor"}</h3>
            {verified.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {verified.map((q) => {
                  const key = `${q.source}-${q.qualification}`
                  const className =
                    "inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2 py-0.5 text-xs font-medium text-foreground hover:bg-muted/40 transition-colors"
                  return (
                    <li key={key}>
                      {q.sourceUrl ? (
                        <a
                          href={q.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={className}
                          title={q.qualification}
                        >
                          <ShieldCheck className="h-3 w-3 stroke-[2]" />
                          <span>{q.qualification}</span>
                          <ExternalLink className="h-3 w-3 opacity-60" />
                        </a>
                      ) : (
                        <span className={className} title={q.qualification}>
                          <ShieldCheck className="h-3 w-3 stroke-[2]" />
                          <span>{q.qualification}</span>
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
          <p className="text-lg text-muted-foreground font-medium">
            {doctor.specialty}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {doctor.credentials.map((c) => (
            <Badge key={c} variant="credential">
              {c}
            </Badge>
          ))}
          {doctor.yearsOfExperience !== null && (
            <Badge variant="credential">{doctor.yearsOfExperience}+ yrs</Badge>
          )}
        </div>

        {verified.length > 0 && lastVerifiedLabel && (
          <p className="text-xs text-muted-foreground">
            Registry membership last verified {lastVerifiedLabel}
          </p>
        )}

        {doctor.education && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <GraduationCap className="h-5 w-5 shrink-0 stroke-[1.5]" />
            <span className="text-base leading-snug">{doctor.education}</span>
          </div>
        )}
      </div>
    </div>
  )
}
