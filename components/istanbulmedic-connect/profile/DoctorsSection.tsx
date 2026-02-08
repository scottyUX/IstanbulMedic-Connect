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
    <Card className="border-border/60 shadow-none">
      <CardHeader className="pb-3">
        <h2 className="text-2xl font-semibold text-foreground">Doctors</h2>
        <p className="text-base text-muted-foreground">
          Meet the physicians and specialists you&apos;ll work with.
        </p>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-6">
        {doctors.map((doctor) => (
          <div key={doctor.name} className="flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-muted/5">
            {/* Left Col: Large Square Image */}
            <div className="shrink-0 relative w-full md:w-48 aspect-square overflow-hidden rounded-2xl bg-neutral-100 shadow-sm">
              <Image
                src={doctor.photo}
                alt={doctor.name}
                fill
                className="object-cover object-top grayscale hover:grayscale-0 transition-all duration-500"
              />
            </div>

            {/* Right Col: Info */}
            <div className="flex flex-col justify-center min-w-0 flex-1 gap-4">
              <div>
                <h3 className="text-2xl font-bold text-foreground leading-tight mb-1">
                  {doctor.name}
                </h3>
                <p className="text-lg text-muted-foreground font-medium">
                  {doctor.specialty}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {doctor.credentials.map((c) => (
                  <Badge key={c} variant="secondary" className="px-3 py-1.5 text-sm font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200">
                    {c}
                  </Badge>
                ))}
                <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200">
                  {doctor.yearsOfExperience}+ yrs
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <GraduationCap className="h-5 w-5 shrink-0 stroke-[1.5]" />
                <span className="text-base leading-snug">{doctor.education}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

