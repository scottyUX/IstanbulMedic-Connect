"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DoctorCard, type Doctor } from "./DoctorCard"

interface DoctorsSectionProps {
  doctors: Doctor[]
}

export const DoctorsSection = ({ doctors }: DoctorsSectionProps) => {
  return (
    <Card id="doctors" variant="profile" className="scroll-mt-32">
      <CardHeader className="pb-3">
        <h2 className="im-heading-2 text-foreground">Doctors</h2>
        <p className="text-base text-muted-foreground">
          Meet the physicians and specialists you&apos;ll work with.
        </p>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-6">
        {doctors.map((doctor) => (
          <DoctorCard key={doctor.name} doctor={doctor} />
        ))}
      </CardContent>
    </Card>
  )
}
