"use client"

import { ClinicProfilePage } from "@/components/istanbulmedic-connect/profile/ClinicProfilePage"
import type { ClinicDetail } from "@/lib/api/clinics"

interface ClinicProfilePageClientProps {
  clinic: ClinicDetail
}

const ClinicProfilePageClient = ({ clinic }: ClinicProfilePageClientProps) => {
  return <ClinicProfilePage clinic={clinic} />
}

export default ClinicProfilePageClient
