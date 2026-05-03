"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DoctorCard, type Doctor } from "./DoctorCard"

interface DoctorsSectionProps {
  doctors: Doctor[]
}

type SectionState = "verified" | "listed-unverified" | "not-disclosed"

function classify(doctors: Doctor[]): SectionState {
  if (doctors.length === 0) return "not-disclosed"
  const anyVerified = doctors.some(
    (d) => (d.verifiedQualifications?.length ?? 0) > 0,
  )
  return anyVerified ? "verified" : "listed-unverified"
}

export const DoctorsSection = ({ doctors }: DoctorsSectionProps) => {
  const state = classify(doctors)

  return (
    <Card id="doctors" variant="profile" className="scroll-mt-32">
      <CardHeader className="pb-3">
        <h2 className="im-heading-2 text-foreground">Doctors</h2>
        <p className="text-base text-muted-foreground">
          Meet the physicians and specialists you&apos;ll work with.
        </p>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-6">
        {state === "not-disclosed" && (
          <div
            data-testid="doctors-not-disclosed"
            className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-6 text-center"
          >
            <p className="text-base text-muted-foreground">
              This clinic has not publicly disclosed an operating surgeon. We
              recommend asking the clinic directly before booking.
            </p>
          </div>
        )}

        {state === "listed-unverified" && (
          <>
            <div
              data-testid="doctors-listed-unverified"
              className="rounded-xl border border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground"
            >
              This clinic&apos;s team is listed but no external credential
              verification was found in our sources. The platform verifies
              credentials against the{" "}
              <a
                href="https://ishrs.org/find-a-doctor/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                ISHRS
              </a>{" "}
              and{" "}
              <a
                href="https://www.iahrs.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                IAHRS
              </a>{" "}
              public directories.
            </div>
            {doctors.map((doctor, idx) => (
              <DoctorCard key={doctor.name ?? `unnamed-${idx}`} doctor={doctor} />
            ))}
          </>
        )}

        {state === "verified" &&
          doctors.map((doctor, idx) => (
            <DoctorCard key={doctor.name ?? `unnamed-${idx}`} doctor={doctor} />
          ))}
      </CardContent>
    </Card>
  )
}
