import { Suspense } from "react"
import { getClinics } from "@/lib/api/clinics"
import { CompareClinicPage } from "@/components/istanbulmedic-connect/comparison/CompareClinicPage"

export const metadata = {
  title: "Compare Clinics — HRN | IstanbulMedic Connect",
  description: "Side-by-side Hair Restoration Network signals comparison",
}

export default async function CompareHRNPage() {
  const { clinics } = await getClinics({ pageSize: 500, sort: "Alphabetical" })

  return (
    <Suspense>
      <CompareClinicPage clinics={clinics} source="hrn" />
    </Suspense>
  )
}
