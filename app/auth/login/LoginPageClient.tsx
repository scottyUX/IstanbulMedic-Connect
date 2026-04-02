"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

type Tab = "signin" | "signup"

const LoginPageClient = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { loginWithGoogle, signInWithEmail, signUpWithEmail, isAuthenticated, loading } = useAuth()

  const [tab, setTab] = useState<Tab>(searchParams.get("tab") === "signup" ? "signup" : "signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [manualError, setManualError] = useState<string | null>(null)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const [signUpSuccess, setSignUpSuccess] = useState(false)
  const justSignedUp = useRef(false)

  const next = searchParams.get("next") ?? "/profile"

  const queryError = useMemo(() => {
    const errorParam = searchParams.get("error")
    if (errorParam === "auth_callback_error") return "Authentication failed. Please try again."
    return null
  }, [searchParams])

  const error = manualError ?? queryError

  // Redirect if already authenticated (skip if we just signed up — let the timer handle it)
  useEffect(() => {
    if (!loading && isAuthenticated && !justSignedUp.current) {
      router.push(next)
    }
  }, [loading, isAuthenticated, next, router])

  // Pre-fill email from passport contact step when landing on signup
  useEffect(() => {
    if (tab !== "signup" || email) return
    try {
      const stored = window.localStorage.getItem("im.qualification")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.email) setEmail(parsed.email)
      }
    } catch { /* ignore */ }
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setManualError(null)
    setIsLoading(true)

    try {
      if (tab === "signin") {
        await signInWithEmail(email, password)
        router.push(next)
      } else {
        if (password !== confirmPassword) {
          setManualError("Passwords do not match.")
          setIsLoading(false)
          return
        }
        if (password.length < 8) {
          setManualError("Password must be at least 8 characters.")
          setIsLoading(false)
          return
        }
        justSignedUp.current = true
        const { needsConfirmation } = await signUpWithEmail(email, password)
        if (needsConfirmation) {
          justSignedUp.current = false
          setConfirmationSent(true)
        } else {
          setSignUpSuccess(true)
          setTimeout(() => router.push(next), 1500)
        }
      }
    } catch (err) {
      justSignedUp.current = false
      setManualError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setManualError(null)
    setIsLoading(true)
    try {
      await loginWithGoogle(next)
    } catch (err) {
      setManualError(err instanceof Error ? err.message : "Failed to sign in with Google.")
      setIsLoading(false)
    }
  }

  if (confirmationSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="w-full max-w-md px-6">
          <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-200 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#3EBBB7]/10">
              <svg className="h-7 w-7 text-[#3EBBB7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[#0D1E32] mb-2">Check your inbox</h2>
            <p className="text-slate-500 text-sm mb-6">
              We sent a confirmation link to <strong className="text-[#0D1E32]">{email}</strong>.
              Click the link to activate your account and you&apos;ll be taken straight to your profile.
            </p>
            <button
              type="button"
              onClick={() => { setConfirmationSent(false); setTab("signin") }}
              className="text-sm font-semibold text-[#17375B] hover:underline"
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    )
  }

  const inputClass = "w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-[#0D1E32] placeholder:text-slate-400 focus:border-[#17375B] focus:outline-none transition-colors"

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md px-6">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-[#0D1E32] mb-1">IstanbulMedic Connect</h1>
          <p className="text-slate-500 text-sm">Your hair transplant treatment passport</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-200">

          {/* Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
            {(["signin", "signup"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setManualError(null); setPassword(""); setConfirmPassword("") }}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                  tab === t
                    ? "bg-white text-[#17375B] shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {signUpSuccess && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-sm text-emerald-700 font-medium">Account created! Taking you to your profile…</p>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Email/password form */}
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              autoComplete="email"
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              autoComplete={tab === "signin" ? "current-password" : "new-password"}
            />
            {tab === "signup" && (
              <input
                type="password"
                required
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
              />
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-[#17375B] py-3 text-sm font-semibold text-white hover:bg-[#102741] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {isLoading
                ? tab === "signin" ? "Signing in…" : "Creating account…"
                : tab === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

        </div>
      </div>
    </div>
  )
}

export default LoginPageClient
