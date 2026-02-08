import { Suspense } from "react"

import LoginPageClient from "./LoginPageClient"

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
          <div className="text-sm text-muted-foreground">Loading…</div>
        </div>
      }
    >
      <LoginPageClient />
    </Suspense>
  )
}
