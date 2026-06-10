"use client"

import { useSearchParams } from "next/navigation"
import { ClinicProfilePage } from "@/components/istanbulmedic-connect/profile/ClinicProfilePage"
import type { ClinicDetail } from "@/lib/api/clinics"
import type { RegistryRecord, ComplianceEvent } from "@/components/istanbulmedic-connect/profile/RegistrySection"

interface ClinicProfilePageClientProps {
  clinic: ClinicDetail
  registryRecords: RegistryRecord[]
  complianceHistory: ComplianceEvent[]
}

const ClinicProfilePageClient = ({ clinic, registryRecords, complianceHistory }: ClinicProfilePageClientProps) => {
  const searchParams = useSearchParams()
  const backParam = searchParams.get('back')
  const backHref = backParam ? `/clinics?${backParam.replace(/\+/g, '%20')}` : '/clinics'

  return (
    <ClinicProfilePage
      clinic={clinic}
      registryRecords={registryRecords}
      complianceHistory={complianceHistory}
      backHref={backHref}
    />
  )
}

export default ClinicProfilePageClient
