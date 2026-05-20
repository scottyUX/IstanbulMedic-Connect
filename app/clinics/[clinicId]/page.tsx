import { notFound } from "next/navigation"
import { getClinicById } from "@/lib/api/clinics"
import { getClinicRegistryData } from "@/lib/api/registry"
import ClinicProfilePageClient from "./ClinicProfilePageClient"

interface ClinicProfilePageProps {
  params: Promise<{ clinicId: string }>
}

async function fetchRegistrySafe(clinicId: string) {
  try {
    return await getClinicRegistryData(clinicId)
  } catch (err) {
    console.error("[clinic-profile] failed to load registry data:", err)
    return { registryRecords: [], complianceHistory: [] }
  }
}

export default async function ClinicProfilePage({ params }: ClinicProfilePageProps) {
  const { clinicId } = await params

  if (process.env.NODE_ENV === "development") {
    if (process.env.NEXT_PUBLIC_IM_FORCE_ERROR === "1") {
      throw new Error("Forced clinic profile error for preview")
    }
  }

  const [clinic, registryData] = await Promise.all([
    getClinicById(clinicId),
    fetchRegistrySafe(clinicId),
  ])

  if (!clinic) {
    notFound()
  }

  return (
    <ClinicProfilePageClient
      clinic={clinic}
      registryRecords={registryData.registryRecords}
      complianceHistory={registryData.complianceHistory}
    />
  )
}
