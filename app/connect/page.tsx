"use client"

import { useRouter } from "next/navigation"

import { ExploreClinicsPage } from "@/components/istanbulmedic-connect/ExploreClinicsPage"

export default function ConnectExplorePage() {
  const router = useRouter()

  const handleSelectClinic = (clinicId: number) => {
    router.push(`/connect/clinics/${clinicId}`)
  }

  return <ExploreClinicsPage onSelectClinic={handleSelectClinic} />
}

