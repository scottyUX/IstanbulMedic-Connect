import ClinicProfilePageClient from "./ClinicProfilePageClient"

interface ClinicProfilePageProps {
  params: Promise<{ clinicId: string }>
}

export default async function ClinicProfilePage({ params }: ClinicProfilePageProps) {
  const { clinicId: clinicIdParam } = await params
  const clinicId = Number(clinicIdParam)
  return <ClinicProfilePageClient clinicId={Number.isFinite(clinicId) ? clinicId : 0} />
}

