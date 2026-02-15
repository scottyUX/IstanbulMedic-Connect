"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

interface ClinicProfileErrorProps {
  error: Error
  reset: () => void
}

export default function ClinicProfileError({ error, reset }: ClinicProfileErrorProps) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-16 text-center">
      <h1 className="im-heading-2 text-foreground">Unable to load clinic profile</h1>
      <p className="text-base text-muted-foreground">
        {error.message || "Something went wrong while loading this clinic."}
      </p>
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button onClick={reset} size="lg">Try again</Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/clinics">Back to clinics</Link>
        </Button>
      </div>
    </div>
  )
}
