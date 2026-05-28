import { Suspense } from 'react'
import { GetStarted } from '@/components/istanbulmedic-connect/user-profile/GetStarted'

export default function GetStartedPage() {
  return (
    <Suspense>
      <GetStarted />
    </Suspense>
  )
}
