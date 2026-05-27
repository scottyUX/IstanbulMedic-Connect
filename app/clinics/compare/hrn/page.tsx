import { Suspense } from "react"
import { getClinics, getClinicSourceScores } from "@/lib/api/clinics"
import { CompareClinicPage } from "@/components/istanbulmedic-connect/comparison/CompareClinicPage"

export const metadata = {
  title: "Compare Clinics — HRN | IstanbulMedic Connect",
  description: "Side-by-side Hair Restoration Network signals comparison",
}

export default async function CompareHRNPage() {
  const { clinics } = await getClinics({ pageSize: 500, sort: "Alphabetical" })
  const scores = await getClinicSourceScores(clinics.map(c => c.id))
  const enriched = clinics.map(c => ({ ...c, ...scores.get(c.id) }))

  return (
    <Suspense>
      <CompareClinicPage clinics={enriched} source="hrn" />
    </Suspense>
  )
}
