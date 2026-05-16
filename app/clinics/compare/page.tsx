import { Suspense } from "react"
import { getClinics } from "@/lib/api/clinics"
import { CompareClinicPage } from "@/components/istanbulmedic-connect/CompareClinicPage"

export const metadata = {
  title: "Compare Clinics | IstanbulMedic Connect",
  description: "Side-by-side comparison of hair transplant clinics",
}

export default async function ComparePage() {
  const { clinics } = await getClinics({ pageSize: 50, sort: "Alphabetical" })

  return (
    <Suspense>
      <CompareClinicPage clinics={clinics} />
    </Suspense>
  )
}
