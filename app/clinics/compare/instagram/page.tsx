import { Suspense } from "react"
import { getClinics, getClinicSourceScores } from "@/lib/api/clinics"
import { CompareClinicPage } from "@/components/istanbulmedic-connect/comparison/CompareClinicPage"

export const metadata = {
  title: "Compare Clinics — Instagram | IstanbulMedic Connect",
  description: "Side-by-side Instagram intelligence comparison",
}

export default async function CompareInstagramPage() {
  const { clinics } = await getClinics({ pageSize: 500, sort: "A-Z" })
  const scores = await getClinicSourceScores(clinics.map(c => c.id))
  const enriched = clinics.map(c => ({ ...c, ...scores.get(c.id) }))

  return (
    <Suspense>
      <CompareClinicPage clinics={enriched} source="instagram" />
    </Suspense>
  )
}
