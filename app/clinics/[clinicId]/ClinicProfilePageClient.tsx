"use client"

import { useRouter } from "next/navigation"

import { ClinicProfilePage } from "@/components/istanbulmedic-connect/profile/ClinicProfilePage"

interface ClinicProfilePageClientProps {
  clinicId: number
}

const ClinicProfilePageClient = ({ clinicId }: ClinicProfilePageClientProps) => {
  const router = useRouter()

  const handleBack = () => {
    router.push("/connect")
  }

  return <ClinicProfilePage clinicId={clinicId} onBack={handleBack} />
}

export default ClinicProfilePageClient

