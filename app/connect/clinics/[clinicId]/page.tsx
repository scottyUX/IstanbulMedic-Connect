import ClinicProfilePageClient from "./ClinicProfilePageClient"

interface ClinicProfilePageProps {
  params: { clinicId: string }
}

export default function ClinicProfilePage({ params }: ClinicProfilePageProps) {
  const clinicId = Number(params.clinicId)
  return <ClinicProfilePageClient clinicId={Number.isFinite(clinicId) ? clinicId : 0} />
}

