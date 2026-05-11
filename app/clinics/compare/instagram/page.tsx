import { Suspense } from "react"
import { getClinics } from "@/lib/api/clinics"
import { CompareClinicPage } from "@/components/istanbulmedic-connect/comparison/CompareClinicPage"

export const metadata = {
  title: "Compare Clinics — Instagram | IstanbulMedic Connect",
  description: "Side-by-side Instagram intelligence comparison",
}

export default async function CompareInstagramPage() {
  const { clinics } = await getClinics({ pageSize: 500, sort: "Alphabetical" })

  return (
    <Suspense>
      <CompareClinicPage clinics={clinics} source="instagram" />
    </Suspense>
  )
}
