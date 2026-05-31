import { Suspense } from 'react'
import ProfileDashboard from '@/components/istanbulmedic-connect/user-profile/ProfileDashboard'

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfileDashboard />
    </Suspense>
  )
}
