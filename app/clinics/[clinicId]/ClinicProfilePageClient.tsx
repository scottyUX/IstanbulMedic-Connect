"use client"

import { ClinicProfilePage } from "@/components/istanbulmedic-connect/profile/ClinicProfilePage"
import type { ClinicDetail } from "@/lib/api/clinics"
import type { RegistryRecord, ComplianceEvent } from "@/components/istanbulmedic-connect/profile/RegistrySection"

interface ClinicProfilePageClientProps {
  clinic: ClinicDetail
  registryRecords: RegistryRecord[]
  complianceHistory: ComplianceEvent[]
}

const ClinicProfilePageClient = ({ clinic, registryRecords, complianceHistory }: ClinicProfilePageClientProps) => {
  return (
    <ClinicProfilePage
      clinic={clinic}
      registryRecords={registryRecords}
      complianceHistory={complianceHistory}
    />
  )
}

export default ClinicProfilePageClient
