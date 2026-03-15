"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AgeTier, BudgetTier, Gender, Timeline } from "@/types/patient-profile"
import { createClient as createBrowserClient } from "@/lib/supabase/client"

// --- Types ---

interface QualificationData {
  ageTier?: AgeTier
  gender?: Gender
  country?: string
  hairLossPattern?: string
  budgetTier?: BudgetTier
  timeline?: Timeline
  fullName?: string
  email?: string
  whatsApp?: string
  preferredLanguage?: string
}

const STORAGE_KEY = "im.qualification"

// --- Step definitions ---

const AGE_OPTIONS: { value: AgeTier; label: string }[] = [
  { value: "18_24", label: "18 – 24" },
  { value: "25_34", label: "25 – 34" },
  { value: "35_44", label: "35 – 44" },
  { value: "45_54", label: "45 – 54" },
  { value: "55_64", label: "55 – 64" },
  { value: "65_plus", label: "65+" },
]

const GENDER_OPTIONS: { value: Gender; label: string; sub?: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
]

const HAIR_LOSS_OPTIONS: { value: string; label: string; sub: string }[] = [
  { value: "early", label: "Early stages", sub: "Slight recession at the temples or crown" },
  { value: "moderate", label: "Moderate", sub: "Noticeable thinning across the top" },
  { value: "advanced", label: "Advanced", sub: "Significant loss, scalp clearly visible" },
  { value: "extensive", label: "Extensive", sub: "Most of the top is bald" },
]

const BUDGET_OPTIONS: { value: BudgetTier; label: string; sub: string }[] = [
  { value: "under_2000", label: "Under £2,000", sub: "Entry-level options" },
  { value: "2000_5000", label: "£2,000 – £5,000", sub: "Mid-range clinics" },
  { value: "5000_8000", label: "£5,000 – £8,000", sub: "Premium clinics" },
  { value: "8000_12000", label: "£8,000 – £12,000", sub: "High-end specialists" },
  { value: "12000_plus", label: "£12,000+", sub: "Top-tier / VIP experience" },
]

const TIMELINE_OPTIONS: { value: Timeline; label: string; sub: string }[] = [
  { value: "1_3_months", label: "Within 3 Months", sub: "Ready to schedule soon" },
  { value: "3_6_months", label: "Within 6 Months", sub: "Planning ahead" },
  { value: "6_12_months", label: "Within 1 Year", sub: "Long-term planning" },
  { value: "12_plus_months", label: "Just Researching", sub: "Exploring options" },
]

const STEPS = [
  { id: "age", title: "How old are you?", subtitle: "This helps us find clinics suited to your stage of hair loss." },
  { id: "gender", title: "How do you identify?", subtitle: "Used for medical profiling only." },
  { id: "hair_loss", title: "How would you describe your hair loss?", subtitle: "Be as honest as you can — it helps Leila make a better match." },
  { id: "country", title: "Where are you based?", subtitle: "This helps us account for travel logistics and clinic proximity." },
  { id: "budget", title: "What's your budget for treatment?", subtitle: "All-inclusive. No hidden costs from the clinics we recommend." },
  { id: "timeline", title: "When would you like your procedure?", subtitle: "This helps clinics prepare their availability." },
  { id: "contact", title: "Create Your Treatment Passport", subtitle: "One profile. Share with multiple clinics." },
  { id: "terms", title: "Almost there.", subtitle: "Review your answers and agree to our terms to create your account." },
]

const TOTAL_STEPS = STEPS.length

// --- Option card ---

function OptionCard({
  label,
  sub,
  selected,
  onClick,
}: {
  label: string
  sub?: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl border-2 px-5 py-4 transition-all duration-150",
        selected
          ? "border-[#17375B] bg-[#17375B]/5"
          : "border-slate-200 bg-white hover:border-[#17375B]/40 hover:bg-slate-50",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={cn("im-text-body font-semibold", selected ? "text-[#0D1E32]" : "text-foreground")}>
            {label}
          </p>
          {sub && (
            <p className="im-text-body-sm text-slate-400 mt-0.5">{sub}</p>
          )}
        </div>
        <div
          className={cn(
            "shrink-0 h-5 w-5 rounded-full border-2 transition-colors",
            selected ? "border-[#17375B] bg-[#17375B]" : "border-slate-300",
          )}
        >
          {selected && <CheckCircle2 className="h-full w-full text-white" />}
        </div>
      </div>
    </button>
  )
}

// --- Step dots ---

function StepDots({ total, current, highest, onNavigate }: {
  total: number
  current: number
  highest: number
  onNavigate: (i: number) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5 justify-center mb-6 w-full">
      {Array.from({ length: total }).map((_, i) => {
        const isComplete = i < current && i <= highest
        const isCurrent  = i === current
        const isLocked   = i > highest
        return (
          <button
            key={i}
            type="button"
            disabled={isLocked}
            onClick={() => !isLocked && onNavigate(i)}
            aria-label={`Go to step ${i + 1}`}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
              isCurrent  && "bg-[#17375B] text-white scale-110 shadow-sm",
              isComplete && "bg-[#3EBBB7] text-white hover:bg-[#35a5a1] cursor-pointer",
              !isCurrent && !isComplete && !isLocked && "bg-[#17375B]/10 text-[#17375B] hover:bg-[#17375B]/20 cursor-pointer",
              isLocked   && "bg-slate-100 text-slate-300 cursor-not-allowed",
            )}
          >
            {i + 1}
          </button>
        )
      })}
    </div>
  )
}

// --- Progress bar ---

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round(((step) / total) * 100)
  return (
    <div className="w-full">
      <div className="flex justify-between im-text-body-xs im-text-muted mb-2">
        <span>Step {step} of {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-200">
        <motion.div
          className="h-1.5 rounded-full bg-[#3EBBB7]"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

// --- Main component ---

export function GetStarted() {
  const router = useRouter()
  const [step, setStep] = useState(0) // 0-indexed
  const [direction, setDirection] = useState(1) // 1 = forward, -1 = back
  const [data, setData] = useState<QualificationData>({})
  const [country, setCountry] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [highestStep, setHighestStep] = useState(0)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Restore from localStorage on mount + check auth session
  useEffect(() => {
    async function init() {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed: QualificationData = JSON.parse(stored)
          setData(parsed)
          if (parsed.country) setCountry(parsed.country)
        }
        const alreadyComplete = window.localStorage.getItem("im.qualification.complete") === "true"
        if (alreadyComplete) {
          setHighestStep(TOTAL_STEPS - 1)
        } else {
          const storedHighest = window.localStorage.getItem(STORAGE_KEY + ".highest")
          if (storedHighest) setHighestStep(parseInt(storedHighest) || 0)
        }
      } catch { /* ignore */ }

      // Check if user is already signed in
      try {
        const supabase = createBrowserClient()
        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            setIsSignedIn(true)
            const hasLocalComplete = window.localStorage.getItem("im.qualification.complete") === "true"
            const hasLocalStored = !!window.localStorage.getItem(STORAGE_KEY)

            if (hasLocalComplete && hasLocalStored) {
              // Fresh local data (e.g. just filled out form then signed in) — push it to DB
              // so the local answers override whatever was already in the database.
              const localRaw = window.localStorage.getItem(STORAGE_KEY)
              if (localRaw) {
                try {
                  const localData = JSON.parse(localRaw)
                  fetch("/api/profile/qualification", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...localData, termsAccepted: true }),
                  }).catch(() => {})
                } catch { /* ignore */ }
              }
            } else {
              // No complete local data — load from DB as the source of truth
              const res = await fetch("/api/profile/qualification")
              if (res.ok) {
                const json = await res.json()
                const db = json.data
                if (db) {
                  setData({
                    ageTier: db.ageTier ?? undefined,
                    gender: db.gender ?? undefined,
                    hairLossPattern: db.hairLossPattern ?? undefined,
                    country: db.country ?? undefined,
                    budgetTier: db.budgetTier ?? undefined,
                    timeline: db.timeline ?? undefined,
                    fullName: db.fullName ?? undefined,
                    email: db.email ?? undefined,
                    whatsApp: db.whatsApp ?? undefined,
                    preferredLanguage: db.preferredLanguage ?? undefined,
                  })
                  if (db.country) setCountry(db.country)
                  if (db.termsAccepted) setHighestStep(TOTAL_STEPS - 1)
                }
              }
            }
          }
        }
      } catch { /* ignore */ }

      setHydrated(true)
    }
    init()
  }, [])

  // Persist to localStorage — skipped on initial render until hydration re-render applies
  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // ignore
    }
  }, [data, hydrated])

  useEffect(() => {
    if (!hydrated) return
    try { window.localStorage.setItem(STORAGE_KEY + ".highest", String(highestStep)) }
    catch { /* ignore */ }
  }, [highestStep, hydrated])


  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [step])

  const currentStep = STEPS[step]
  const isLastStep = step === TOTAL_STEPS - 1

  // Determine if current step has a valid answer
  const canContinue = (() => {
    if (currentStep.id === "age") return !!data.ageTier
    if (currentStep.id === "gender") return !!data.gender
    if (currentStep.id === "hair_loss") return !!data.hairLossPattern
    if (currentStep.id === "country") return country.trim().length > 1
    if (currentStep.id === "budget") return !!data.budgetTier
    if (currentStep.id === "timeline") return !!data.timeline
    if (currentStep.id === "contact") return !!(data.fullName?.trim() && data.email?.trim())
    if (currentStep.id === "terms") return termsAccepted
    return false
  })()

  async function goNext() {
    if (currentStep.id === "country") {
      setData((prev) => ({ ...prev, country: country.trim() }))
    }
    setDirection(1)
    if (currentStep.id === "terms") {
      window.localStorage.setItem("im.qualification.complete", "true")
      if (isSignedIn) {
        // Already authenticated — save to DB then go to dashboard
        setSaving(true)
        setSaveError(null)
        try {
          const res = await fetch("/api/profile/qualification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...data, termsAccepted: true }),
          })
          if (!res.ok) {
            const json = await res.json()
            setSaveError(json.error ?? "Failed to save. Your answers are stored locally.")
            setSaving(false)
            return
          }
        } catch {
          // Network error — localStorage already has the data, continue
        } finally {
          setSaving(false)
        }
        router.push("/profile")
      } else {
        // Not signed in — data is in localStorage, send to sign-up
        router.push("/auth/login?tab=signup&next=/profile")
      }
    } else {
      const next = step + 1
      if (next > highestStep) setHighestStep(next)
      setStep(next)
      // Auto-save in background only for returning users who already completed section 1
      const alreadyComplete = window.localStorage.getItem("im.qualification.complete") === "true"
      if (isSignedIn && alreadyComplete) {
        fetch("/api/profile/qualification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, termsAccepted: true }),
        }).catch(() => { /* localStorage is the fallback */ })
      }
    }
  }

  function navigateTo(i: number) {
    if (i > highestStep) return
    setDirection(i > step ? 1 : -1)
    setStep(i)
  }

  function goBack() {
    setDirection(-1)
    if (step === 0) {
      router.push("/profile")
    } else {
      setStep((s) => s - 1)
    }
  }

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
  }

  return (
    <div className="imConnectTheme min-h-screen bg-slate-50 pt-[80px] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 max-w-lg mx-auto w-full">

        {/* Back to dashboard */}
        <div className="w-full mb-4">
          <Link
            href="/profile"
            className="flex items-center gap-2 im-text-body-sm font-semibold text-slate-500 hover:text-[#0D1E32] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </div>

        {/* Step dots + progress */}
        <div className="w-full mb-8">
          <StepDots total={TOTAL_STEPS} current={step} highest={highestStep} onNavigate={navigateTo} />
          <ProgressBar step={step + 1} total={TOTAL_STEPS} />
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-full"
          >
            <h2 className="im-heading-2 text-foreground mb-1">{currentStep.title}</h2>
            <p className="im-text-body-sm im-text-muted mb-6">{currentStep.subtitle}</p>

            {/* Age */}
            {currentStep.id === "age" && (
              <div className="grid grid-cols-2 gap-3">
                {AGE_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    label={opt.label}
                    selected={data.ageTier === opt.value}
                    onClick={() => setData((prev) => ({ ...prev, ageTier: opt.value }))}
                  />
                ))}
              </div>
            )}

            {/* Gender */}
            {currentStep.id === "gender" && (
              <div className="flex flex-col gap-3">
                {GENDER_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    label={opt.label}
                    selected={data.gender === opt.value}
                    onClick={() => setData((prev) => ({ ...prev, gender: opt.value }))}
                  />
                ))}
              </div>
            )}

            {/* Hair loss */}
            {currentStep.id === "hair_loss" && (
              <div className="flex flex-col gap-3">
                {HAIR_LOSS_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    label={opt.label}
                    sub={opt.sub}
                    selected={data.hairLossPattern === opt.value}
                    onClick={() => setData((prev) => ({ ...prev, hairLossPattern: opt.value }))}
                  />
                ))}
              </div>
            )}

            {/* Country */}
            {currentStep.id === "country" && (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && canContinue && goNext()}
                  placeholder="e.g. United Kingdom"
                  autoFocus
                  className="w-full rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 im-text-body text-foreground placeholder:text-slate-400 focus:border-[#17375B] focus:outline-none transition-colors"
                />
              </div>
            )}

            {/* Budget */}
            {currentStep.id === "budget" && (
              <div className="flex flex-col gap-3">
                {BUDGET_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    label={opt.label}
                    sub={opt.sub}
                    selected={data.budgetTier === opt.value}
                    onClick={() => setData((prev) => ({ ...prev, budgetTier: opt.value }))}
                  />
                ))}
              </div>
            )}

            {/* Timeline */}
            {currentStep.id === "timeline" && (
              <div className="flex flex-col gap-3">
                {TIMELINE_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    label={opt.label}
                    sub={opt.sub}
                    selected={data.timeline === opt.value}
                    onClick={() => setData((prev) => ({ ...prev, timeline: opt.value }))}
                  />
                ))}
              </div>
            )}

            {/* Contact info */}
            {currentStep.id === "contact" && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="im-text-body-sm font-semibold text-foreground">Full Name</label>
                  <input
                    type="text"
                    value={data.fullName ?? ""}
                    onChange={(e) => setData((prev) => ({ ...prev, fullName: e.target.value }))}
                    placeholder="John Smith"
                    className="w-full rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 im-text-body text-foreground placeholder:text-slate-400 focus:border-[#17375B] focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="im-text-body-sm font-semibold text-foreground">Email Address</label>
                  <input
                    type="email"
                    value={data.email ?? ""}
                    onChange={(e) => setData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                    className="w-full rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 im-text-body text-foreground placeholder:text-slate-400 focus:border-[#17375B] focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="im-text-body-sm font-semibold text-foreground">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={data.whatsApp ?? ""}
                    onChange={(e) => setData((prev) => ({ ...prev, whatsApp: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                    className="w-full rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 im-text-body text-foreground placeholder:text-slate-400 focus:border-[#17375B] focus:outline-none transition-colors"
                  />
                  <p className="im-text-body-xs text-slate-400">Clinics prefer WhatsApp for quick communication</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="im-text-body-sm font-semibold text-foreground">Preferred Language</label>
                  <select
                    value={data.preferredLanguage ?? ""}
                    onChange={(e) => setData((prev) => ({ ...prev, preferredLanguage: e.target.value }))}
                    className="w-full rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 im-text-body text-foreground focus:border-[#17375B] focus:outline-none transition-colors appearance-none"
                  >
                    <option value="" disabled>Select language</option>
                    <option value="en">English</option>
                    <option value="de">German</option>
                    <option value="tr">Turkish</option>
                    <option value="ar">Arabic</option>
                    <option value="fr">French</option>
                    <option value="es">Spanish</option>
                  </select>
                </div>
              </div>
            )}

            {/* Terms */}
            {currentStep.id === "terms" && (
              <div className="flex flex-col gap-4">
                {/* Summary */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col gap-2">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="h-4 w-4 text-[#3EBBB7]" />
                    <p className="im-text-body-sm font-semibold text-foreground">Your answers</p>
                  </div>
                  {[
                    { label: "Name", value: data.fullName },
                    { label: "Email", value: data.email },
                    { label: "Age", value: data.ageTier?.replace(/_/g, "–") },
                    { label: "Gender", value: data.gender?.replace(/_/g, " ") },
                    { label: "Hair loss", value: data.hairLossPattern },
                    { label: "Country", value: data.country },
                    { label: "Budget", value: data.budgetTier?.replace(/_/g, " ") },
                    { label: "Timeline", value: data.timeline?.replace(/_/g, " ") },
                  ].map(({ label, value }) => value && (
                    <div key={label} className="flex justify-between im-text-body-sm">
                      <span className="im-text-muted">{label}</span>
                      <span className="font-medium text-foreground capitalize">{value}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setTermsAccepted((v) => !v)}
                  className={`flex items-start gap-3 rounded-2xl px-5 py-4 text-left transition-all ${
                    termsAccepted ? "bg-[#17375B]/5" : "bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                    termsAccepted ? "border-[#17375B] bg-[#17375B]" : "border-slate-300"
                  }`}>
                    {termsAccepted && (
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <p className="im-text-body-sm text-slate-600">
                    I agree to the{" "}
                    <span className="text-[#17375B] font-semibold underline underline-offset-2">Terms of Service</span>
                    {" "}and{" "}
                    <span className="text-[#17375B] font-semibold underline underline-offset-2">Privacy Policy</span>.
                    My data will only be shared with clinics I choose.
                  </p>
                </button>

                {!isSignedIn && (
                  <p className="im-text-body-sm text-center text-slate-500">
                    Already have an account?{" "}
                    <Link
                      href="/auth/login?next=/profile"
                      className="font-semibold text-[#17375B] hover:underline underline-offset-2"
                    >
                      Sign in
                    </Link>
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {saveError && (
          <p className="w-full mt-4 im-text-body-sm text-red-500 text-center">{saveError}</p>
        )}
        <div className="w-full mt-4 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-2 im-text-body-sm font-semibold text-slate-500 hover:text-[#0D1E32] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <button
            type="button"
            onClick={goNext}
            disabled={!canContinue || saving}
            className={cn(
              "flex items-center gap-2 rounded-2xl px-6 py-3 im-text-body font-semibold transition-all",
              canContinue && !saving
                ? "bg-[#17375B] text-white hover:bg-[#102741]"
                : "bg-slate-200 text-slate-400 cursor-not-allowed",
            )}
          >
            {saving ? "Saving…" : currentStep.id === "terms" ? "Create my account" : "Continue"}
            {!saving && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>

      </div>
    </div>
  )
}
