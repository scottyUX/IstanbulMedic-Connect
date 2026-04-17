import { notFound } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { getClinicById } from "@/lib/api/clinics"
import ClinicProfilePageClient from "./ClinicProfilePageClient"
import type { RegistryRecord, ComplianceEvent } from "@/components/istanbulmedic-connect/profile/RegistrySection"

interface ClinicProfilePageProps {
  params: Promise<{ clinicId: string }>
}

async function getRegistryData(clinicId: string): Promise<{
  registryRecords: RegistryRecord[]
  complianceHistory: ComplianceEvent[]
}> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return { registryRecords: [], complianceHistory: [] }

  const supabase = createClient(url, key)

  const [registryResult, complianceResult] = await Promise.all([
    supabase
      .from("clinic_registry_records")
      .select("id, source, license_number, license_status, licensed_since, expires_at, authorized_specialties, registered_legal_name, registered_address, registry_url, last_verified_at")
      .eq("clinic_id", clinicId)
      .order("last_verified_at", { ascending: false }),
    supabase
      .from("clinic_compliance_history")
      .select("id, source, event_type, event_date, description, resolved_at, severity")
      .eq("clinic_id", clinicId)
      .order("event_date", { ascending: false }),
  ])

  return {
    registryRecords: (registryResult.data ?? []) as RegistryRecord[],
    complianceHistory: (complianceResult.data ?? []) as ComplianceEvent[],
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
    getRegistryData(clinicId),
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
