"use client"

import Image from "next/image"
import { GraduationCap } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface Doctor {
  name: string
  specialty: string
  photo: string
  credentials: string[]
  yearsOfExperience: number
  education: string
}

interface DoctorsSectionProps {
  doctors: Doctor[]
}

export const DoctorsSection = ({ doctors }: DoctorsSectionProps) => {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <h2 className="text-lg font-semibold text-foreground">Doctors</h2>
        <p className="text-sm text-muted-foreground">
          Meet the physicians and specialists you&apos;ll work with.
        </p>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {doctors.map((doctor) => (
          <div key={doctor.name} className="rounded-xl border border-border/60 bg-card p-4">
            <div className="flex items-start gap-3">
              <div className="relative h-14 w-14 overflow-hidden rounded-full border border-border/60">
                <Image src={doctor.photo} alt={doctor.name} fill className="object-cover" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-base font-semibold text-foreground">
                  {doctor.name}
                </div>
                <div className="text-sm text-muted-foreground">{doctor.specialty}</div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {doctor.credentials.map((c) => (
                <Badge key={c} variant="secondary">
                  {c}
                </Badge>
              ))}
              <Badge variant="secondary">{doctor.yearsOfExperience}+ yrs</Badge>
            </div>

            <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
              <GraduationCap className="mt-0.5 h-4 w-4" />
              <span className="leading-relaxed">{doctor.education}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

