import { Suspense } from "react"
import { getClinics } from "@/lib/api/clinics"
import { CompareClinicPage } from "@/components/istanbulmedic-connect/comparison/CompareClinicPage"

export const metadata = {
  title: "Compare Clinics — Google Places | IstanbulMedic Connect",
  description: "Side-by-side Google Places comparison",
}

export default async function CompareGooglePlacesPage() {
  const { clinics } = await getClinics({ pageSize: 500, sort: "Alphabetical" })

  return (
    <Suspense>
      <CompareClinicPage clinics={clinics} source="google_places" />
    </Suspense>
  )
}
