"use client"

import Image from "next/image"
import { GraduationCap } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface Doctor {
  name: string | null
  specialty: string
  photo: string | null
  credentials: string[]
  yearsOfExperience: number | null
  education: string | null
}

interface DoctorCardProps {
  doctor: Doctor
  className?: string
}

export const DoctorCard = ({ doctor, className }: DoctorCardProps) => {
  const initials =
    doctor.name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "DR"

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-muted/5",
        className
      )}
    >
      <div className="shrink-0 relative w-full md:w-48 aspect-square overflow-hidden rounded-2xl bg-neutral-100 shadow-sm">
        {doctor.photo ? (
          <Image
            src={doctor.photo}
            alt={doctor.name ?? "Doctor"}
            fill
            className="object-cover object-top grayscale hover:grayscale-0 transition-all duration-500"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted/40 text-center">
            <div>
              <div className="text-3xl font-semibold text-foreground/80">{initials}</div>
              <div className="mt-1 text-xs text-muted-foreground">No photo uploaded</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col justify-center min-w-0 flex-1 gap-4">
        <div>
          <h3 className="im-heading-3 text-foreground mb-1">{doctor.name ?? "Doctor"}</h3>
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
