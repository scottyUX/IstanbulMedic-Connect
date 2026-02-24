import { notFound } from "next/navigation"
import { getClinicById } from "@/lib/api/clinics"
import ClinicProfilePageClient from "./ClinicProfilePageClient"

interface ClinicProfilePageProps {
  params: Promise<{ clinicId: string }>
}

export default async function ClinicProfilePage({ params }: ClinicProfilePageProps) {
  const { clinicId } = await params

  if (process.env.NODE_ENV === "development") {
    if (process.env.NEXT_PUBLIC_IM_FORCE_ERROR === "1") {
      throw new Error("Forced clinic profile error for preview")
    }
  }

  const clinic = await getClinicById(clinicId)

  if (!clinic) {
    notFound()
  }

  return <ClinicProfilePageClient clinic={clinic} />
}
