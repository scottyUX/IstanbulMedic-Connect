"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

interface ClinicsErrorProps {
  error: Error
  reset: () => void
}

export default function ClinicsError({ error, reset }: ClinicsErrorProps) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-16 text-center">
      <h1 className="im-heading-2 text-foreground">Unable to load clinics</h1>
      <p className="text-base text-muted-foreground">
        {error.message || "Something went wrong while loading clinics."}
      </p>
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button onClick={reset} size="lg">Try again</Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  )
}
