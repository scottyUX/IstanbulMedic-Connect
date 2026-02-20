"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"

const LoginPageClient = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [manualError, setManualError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { loginWithGoogle, isAuthenticated, loading } = useAuth()

  const queryError = useMemo(() => {
    const errorParam = searchParams.get("error")
    if (errorParam === "auth_callback_error") {
      return "Authentication failed. Please try again."
    }
    return null
  }, [searchParams])

  const error = manualError ?? queryError

  // Redirect if already authenticated
  if (!loading && isAuthenticated) {
    router.push("/leila")
    return null
  }

  const handleGoogleLogin = async () => {
    setManualError(null)
    setIsLoading(true)

    try {
      await loginWithGoogle()
      // Redirect will happen automatically via OAuth flow
    } catch (err) {
      setManualError(
        err instanceof Error ? err.message : "Failed to sign in with Google"
      )
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
      <div className="w-full max-w-md px-6">
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-semibold text-gray-900">
              Welcome to Leila
            </h1>
            <p className="text-gray-600">Sign in to continue your consultation</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading || loading}
            className="flex h-11 w-full items-center justify-center gap-3 border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default LoginPageClient

