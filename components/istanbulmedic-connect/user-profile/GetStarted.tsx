"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AgeTier, BudgetTier, Gender, Timeline } from "@/types/patient-profile"
import { createClient as createBrowserClient } from "@/lib/supabase/client"

// --- Types ---

interface QualificationData {
  ageTier?: AgeTier
  gender?: Gender
  birthday?: string
  country?: string
  norwoodScale?: number
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
  { value: "18-24", label: "18 – 24" },
  { value: "25-34", label: "25 – 34" },
  { value: "35-44", label: "35 – 44" },
  { value: "45-54", label: "45 – 54" },
  { value: "55-64", label: "55 – 64" },
  { value: "65-plus", label: "65+" },
]

const GENDER_OPTIONS: { value: Gender; label: string; sub?: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
]

const NORWOOD_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "Stage 1 – Minimal or no recession" },
  { value: 2, label: "Stage 2 – Minor temple recession" },
  { value: 3, label: "Stage 3 – Deepening temples" },
  { value: 4, label: "Stage 4 – Significant crown thinning" },
  { value: 5, label: "Stage 5 – Moderate to significant loss" },
  { value: 6, label: "Stage 6 – Extensive loss, one band remains" },
  { value: 7, label: "Stage 7 – Most extensive pattern" },
]

const BUDGET_OPTIONS: { value: BudgetTier; label: string; sub: string }[] = [
  { value: "under-2000", label: "Under £2,000", sub: "Entry-level options" },
  { value: "2000-5000", label: "£2,000 – £5,000", sub: "Mid-range clinics" },
  { value: "5000-8000", label: "£5,000 – £8,000", sub: "Premium clinics" },
  { value: "8000-12000", label: "£8,000 – £12,000", sub: "High-end specialists" },
  { value: "12000-plus", label: "£12,000+", sub: "Top-tier / VIP experience" },
]

const TIMELINE_OPTIONS: { value: Timeline; label: string; sub: string }[] = [
  { value: "1-3-months", label: "Within 3 Months", sub: "Ready to schedule soon" },
  { value: "3-6-months", label: "Within 6 Months", sub: "Planning ahead" },
  { value: "6-12-months", label: "Within 1 Year", sub: "Long-term planning" },
  { value: "12-plus-months", label: "Just Researching", sub: "Exploring options" },
]

const STEPS = [
  { id: "age", title: "How old are you?", subtitle: "This helps us find clinics suited to your stage of hair loss." },
  { id: "gender", title: "How do you identify?", subtitle: "Used for medical profiling only." },
  { id: "hair_loss", title: "What is your Norwood scale?", subtitle: "Select the stage that best describes your current hair loss." },
  { id: "country", title: "Where are you based?", subtitle: "This helps us account for travel logistics and clinic proximity." },
  { id: "budget", title: "What's your budget for treatment?", subtitle: "All-inclusive. No hidden costs from the clinics we recommend." },
  { id: "timeline", title: "When would you like your procedure?", subtitle: "This helps clinics prepare their availability." },
  { id: "contact", title: "Create Your Treatment Passport", subtitle: "One profile. Share with multiple clinics." },
]

function computeVisibleSteps(d: QualificationData, c: string) {
  return STEPS.filter((s) => {
    if (s.id === "age")       return !d.ageTier && !d.birthday
    if (s.id === "gender")    return !d.gender
    if (s.id === "hair_loss") return !d.norwoodScale
    if (s.id === "country")   return !c.trim()
    if (s.id === "budget")    return !d.budgetTier
    if (s.id === "timeline")  return !d.timeline
    return true // contact: always show
  })
}

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

// --- Validation ---

const PHONE_CODES: { code: string; label: string; country: string; digits: [number, number] }[] = [
  { code: "+1",   label: "+1 US/CA",  country: "US / Canada",    digits: [10, 10] },
  { code: "+44",  label: "+44 UK",    country: "United Kingdom",  digits: [10, 10] },
  { code: "+49",  label: "+49 DE",    country: "Germany",         digits: [9,  11] },
  { code: "+33",  label: "+33 FR",    country: "France",          digits: [9,   9] },
  { code: "+34",  label: "+34 ES",    country: "Spain",           digits: [9,   9] },
  { code: "+39",  label: "+39 IT",    country: "Italy",           digits: [9,  10] },
  { code: "+31",  label: "+31 NL",    country: "Netherlands",     digits: [9,   9] },
  { code: "+32",  label: "+32 BE",    country: "Belgium",         digits: [8,   9] },
  { code: "+41",  label: "+41 CH",    country: "Switzerland",     digits: [9,   9] },
  { code: "+43",  label: "+43 AT",    country: "Austria",         digits: [7,  13] },
  { code: "+45",  label: "+45 DK",    country: "Denmark",         digits: [8,   8] },
  { code: "+46",  label: "+46 SE",    country: "Sweden",          digits: [7,   9] },
  { code: "+47",  label: "+47 NO",    country: "Norway",          digits: [8,   8] },
  { code: "+358", label: "+358 FI",   country: "Finland",         digits: [6,  10] },
  { code: "+353", label: "+353 IE",   country: "Ireland",         digits: [7,   9] },
  { code: "+48",  label: "+48 PL",    country: "Poland",          digits: [9,   9] },
  { code: "+380", label: "+380 UA",   country: "Ukraine",         digits: [9,   9] },
  { code: "+7",   label: "+7 RU/KZ",  country: "Russia / KZ",    digits: [10, 10] },
  { code: "+90",  label: "+90 TR",    country: "Turkey",          digits: [10, 10] },
  { code: "+971", label: "+971 AE",   country: "UAE",             digits: [9,   9] },
  { code: "+966", label: "+966 SA",   country: "Saudi Arabia",    digits: [9,   9] },
  { code: "+974", label: "+974 QA",   country: "Qatar",           digits: [8,   8] },
  { code: "+965", label: "+965 KW",   country: "Kuwait",          digits: [8,   8] },
  { code: "+973", label: "+973 BH",   country: "Bahrain",         digits: [8,   8] },
  { code: "+968", label: "+968 OM",   country: "Oman",            digits: [8,   8] },
  { code: "+20",  label: "+20 EG",    country: "Egypt",           digits: [10, 10] },
  { code: "+212", label: "+212 MA",   country: "Morocco",         digits: [9,   9] },
  { code: "+213", label: "+213 DZ",   country: "Algeria",         digits: [9,   9] },
  { code: "+91",  label: "+91 IN",    country: "India",           digits: [10, 10] },
  { code: "+92",  label: "+92 PK",    country: "Pakistan",        digits: [10, 10] },
  { code: "+880", label: "+880 BD",   country: "Bangladesh",      digits: [10, 10] },
  { code: "+86",  label: "+86 CN",    country: "China",           digits: [11, 11] },
  { code: "+81",  label: "+81 JP",    country: "Japan",           digits: [10, 11] },
  { code: "+82",  label: "+82 KR",    country: "South Korea",     digits: [9,  10] },
  { code: "+61",  label: "+61 AU",    country: "Australia",       digits: [9,   9] },
  { code: "+64",  label: "+64 NZ",    country: "New Zealand",     digits: [8,  10] },
  { code: "+27",  label: "+27 ZA",    country: "South Africa",    digits: [9,   9] },
  { code: "+234", label: "+234 NG",   country: "Nigeria",         digits: [10, 10] },
  { code: "+254", label: "+254 KE",   country: "Kenya",           digits: [9,   9] },
  { code: "+55",  label: "+55 BR",    country: "Brazil",          digits: [10, 11] },
  { code: "+52",  label: "+52 MX",    country: "Mexico",          digits: [10, 10] },
  { code: "+54",  label: "+54 AR",    country: "Argentina",       digits: [10, 10] },
  { code: "+57",  label: "+57 CO",    country: "Colombia",        digits: [10, 10] },
  { code: "+56",  label: "+56 CL",    country: "Chile",           digits: [9,   9] },
]

const isValidPhone = (code: string, local: string): boolean => {
  const digits = local.replace(/\D/g, '')
  const entry = PHONE_CODES.find(p => p.code === code)
  if (!entry) return digits.length >= 7 && digits.length <= 15
  const [min, max] = entry.digits
  return digits.length >= min && digits.length <= max
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
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [consentAccepted, setConsentAccepted] = useState(false)
  const [visibleSteps, setVisibleSteps] = useState(STEPS)
  const [contactTouched, setContactTouched] = useState<{ whatsApp?: boolean }>({})
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function scheduleAutosave(newData: QualificationData, currentCountry: string, delay = 0) {
    // No isSignedIn guard — the API returns 401 for anon users; the client catch ignores it.
    // This prevents stale-closure bugs where isSignedIn might read false during a valid session.
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => {
      fetch("/api/profile/qualification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ageTier: newData.ageTier,
          gender: newData.gender,
          birthday: newData.birthday,
          norwoodScale: newData.norwoodScale,
          country: currentCountry || newData.country,
          budgetTier: newData.budgetTier,
          timeline: newData.timeline,
          fullName: newData.fullName,
          email: newData.email,
          whatsApp: newData.whatsApp,
          preferredLanguage: newData.preferredLanguage,
          // termsAccepted intentionally omitted — preserves existing DB value
        }),
      }).catch(() => {})
    }, delay)
  }
  const [phoneCode, setPhoneCode] = useState("")
  const [phoneLocal, setPhoneLocal] = useState("")

  // On mount: check auth → DB is source of truth for signed-in users, localStorage for anon
  useEffect(() => {
    async function init() {
      let signedIn = false

      try {
        const supabase = createBrowserClient()
        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            signedIn = true
            setIsSignedIn(true)

            const res = await fetch("/api/profile/qualification")
            if (res.ok) {
              const json = await res.json()
              const db = json.data
              if (db) {
                let finalData: QualificationData = {
                  ageTier: db.ageTier ?? undefined,
                  gender: db.gender ?? undefined,
                  birthday: db.birthday ?? undefined,
                  norwoodScale: db.norwoodScale ?? undefined,
                  country: db.country ?? undefined,
                  budgetTier: db.budgetTier ?? undefined,
                  timeline: db.timeline ?? undefined,
                  fullName: db.fullName ?? undefined,
                  email: db.email ?? undefined,
                  whatsApp: db.whatsApp ?? undefined,
                  preferredLanguage: db.preferredLanguage ?? undefined,
                }
                let finalCountry = db.country ?? ""

                // If DB is completely empty (first sign-in after anon session),
                // fall back to localStorage and sync it to DB — no termsAccepted
                const dbHasData = Object.values(finalData).some(v => v !== undefined)
                if (!dbHasData) {
                  try {
                    const stored = window.localStorage.getItem(STORAGE_KEY)
                    if (stored) {
                      const localParsed: QualificationData = JSON.parse(stored)
                      finalData = localParsed
                      finalCountry = localParsed.country ?? ""
                      fetch("/api/profile/qualification", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(localParsed),
                      }).catch(() => {})
                    }
                  } catch { /* ignore */ }
                }

                setData(finalData)
                if (finalCountry) setCountry(finalCountry)
                if (finalData.whatsApp) {
                  const matched = PHONE_CODES.find(p => finalData.whatsApp!.startsWith(p.code))
                  if (matched) {
                    setPhoneCode(matched.code)
                    setPhoneLocal(finalData.whatsApp.slice(matched.code.length).trimStart())
                  }
                }
                setVisibleSteps(computeVisibleSteps(finalData, finalCountry))
              }
            }
          }
        }
      } catch { /* ignore */ }

      // Not signed in — load from localStorage
      if (!signedIn) {
        try {
          const stored = window.localStorage.getItem(STORAGE_KEY)
          if (stored) {
            const parsed: QualificationData = JSON.parse(stored)
            setData(parsed)
            const parsedCountry = parsed.country ?? ""
            if (parsedCountry) setCountry(parsedCountry)
            if (parsed.whatsApp) {
              const matched = PHONE_CODES.find(p => parsed.whatsApp!.startsWith(p.code))
              if (matched) {
                setPhoneCode(matched.code)
                setPhoneLocal(parsed.whatsApp.slice(matched.code.length).trimStart())
              }
            }
            setVisibleSteps(computeVisibleSteps(parsed, parsedCountry))
          }
        } catch { /* ignore */ }
      }

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



  // Reset contact field touched state when leaving the contact step
  useEffect(() => {
    if (visibleSteps[step]?.id !== "contact") setContactTouched({})
  }, [step, visibleSteps])

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [step])

  const currentStep = visibleSteps[step] ?? visibleSteps[visibleSteps.length - 1]

  // Determine if current step has a valid answer
  const canContinue = (() => {
    if (currentStep.id === "age") return !!data.ageTier
    if (currentStep.id === "gender") return !!data.gender
    if (currentStep.id === "hair_loss") return !!data.norwoodScale
    if (currentStep.id === "country") return country.trim().length > 1
    if (currentStep.id === "budget") return !!data.budgetTier
    if (currentStep.id === "timeline") return !!data.timeline
    if (currentStep.id === "contact") {
      const phoneOk = !phoneLocal.trim() || isValidPhone(phoneCode, phoneLocal.trim())
      return !!(data.fullName?.trim() && phoneOk && consentAccepted)
    }
    return false
  })()

  async function goNext() {
    // Build the committed data for this step before advancing
    let committedData = data
    if (currentStep.id === "country") {
      committedData = { ...data, country: country.trim() }
      setData(committedData)
    }
    setDirection(1)
    const isLastStep = step === visibleSteps.length - 1
    if (isLastStep) {
      // Contact is the final step — save with consent and redirect
      if (isSignedIn) {
        setSaving(true)
        setSaveError(null)
        try {
          const res = await fetch("/api/profile/qualification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...committedData,
              country: country.trim() || committedData.country,
              termsAccepted: true,
            }),
          })
          if (!res.ok) {
            const json = await res.json()
            setSaveError(json.error ?? "Failed to save. Your answers are stored locally.")
            setSaving(false)
            return
          }
          // Only mark complete after save confirms
          window.localStorage.setItem("im.qualification.complete", "true")
        } catch {
          // Network error — still mark complete so user isn't stuck
          window.localStorage.setItem("im.qualification.complete", "true")
        } finally {
          setSaving(false)
        }
        router.push("/profile")
      } else {
        window.localStorage.setItem("im.qualification.complete", "true")
        router.push("/auth/login?tab=signup&next=/profile")
      }
    } else {
      const next = step + 1
      setStep(next)
      // Safety-net: flush any pending debounced save and fire immediately
      scheduleAutosave(committedData, country.trim() || committedData.country || "")
    }
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

  if (!hydrated) return null

  return (
    <div className="imConnectTheme min-h-screen bg-slate-50 pt-[80px] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 max-w-lg mx-auto w-full">

        {/* Skip current step */}
        <div className="w-full mb-8 flex justify-end">
          {step < visibleSteps.length - 1 && (
            <button
              type="button"
              onClick={() => {
                setDirection(1)
                setStep(step + 1)
              }}
              className="im-text-body-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Skip →
            </button>
          )}
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
                    onClick={() => {
                      const n = { ...data, ageTier: opt.value }
                      setData(n)
                      scheduleAutosave(n, country)
                    }}
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
                    onClick={() => {
                      const n = { ...data, gender: opt.value }
                      setData(n)
                      scheduleAutosave(n, country)
                    }}
                  />
                ))}
              </div>
            )}

            {/* Hair loss — Norwood scale */}
            {currentStep.id === "hair_loss" && (
              <div className="flex flex-col gap-3">
                {NORWOOD_OPTIONS.map((opt) => {
                  const selected = data.norwoodScale === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        const n = { ...data, norwoodScale: opt.value }
                        setData(n)
                        scheduleAutosave(n, country)
                      }}
                      className={`flex items-center gap-4 w-full text-left rounded-2xl border-2 px-4 py-3 transition-all duration-150 ${
                        selected
                          ? "border-[#17375B] bg-[#17375B]/5"
                          : "border-slate-200 bg-white hover:border-[#17375B]/40 hover:bg-slate-50"
                      }`}
                    >
                      <div className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        selected ? "border-[#17375B] bg-[#17375B]" : "border-slate-300 bg-white"
                      }`}>
                        {selected && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <img
                        src={`/assets/norwood/stage-${opt.value}.png`}
                        alt={`Stage ${opt.value}`}
                        className="w-16 h-16 object-contain shrink-0"
                      />
                      <p className={`text-base font-semibold ${selected ? "text-[#0D1E32]" : "text-foreground"}`}>
                        {opt.label}
                      </p>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Country */}
            {currentStep.id === "country" && (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value)
                    scheduleAutosave(data, e.target.value, 800)
                  }}
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
                    onClick={() => {
                      const n = { ...data, budgetTier: opt.value }
                      setData(n)
                      scheduleAutosave(n, country)
                    }}
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
                    onClick={() => {
                      const n = { ...data, timeline: opt.value }
                      setData(n)
                      scheduleAutosave(n, country)
                    }}
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
                    onChange={(e) => {
                      const n = { ...data, fullName: e.target.value }
                      setData(n)
                      scheduleAutosave(n, country, 800)
                    }}
                    placeholder="John Smith"
                    className="w-full rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 im-text-body text-foreground placeholder:text-slate-400 focus:border-[#17375B] focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="im-text-body-sm font-semibold text-foreground">Email Address</label>
                  <div className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-5 py-4 im-text-body text-muted-foreground cursor-not-allowed select-none">
                    {data.email ?? "—"}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="im-text-body-sm font-semibold text-foreground">
                    WhatsApp Number <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={phoneCode}
                      onChange={(e) => {
                        const newCode = e.target.value
                        setPhoneCode(newCode)
                        const n = { ...data, whatsApp: phoneLocal ? newCode + phoneLocal : undefined }
                        setData(n)
                        scheduleAutosave(n, country)
                      }}
                      className="rounded-2xl border-2 border-slate-200 bg-white px-3 py-4 im-text-body text-foreground focus:border-[#17375B] focus:outline-none transition-colors appearance-none w-[130px] shrink-0 text-center"
                    >
                      <option value=""></option>
                      {PHONE_CODES.map((p) => (
                        <option key={p.code} value={p.code}>{p.label}</option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={phoneLocal}
                      onChange={(e) => {
                        const local = e.target.value
                        setPhoneLocal(local)
                        const n = { ...data, whatsApp: local && phoneCode ? phoneCode + local : undefined }
                        setData(n)
                        scheduleAutosave(n, country, 800)
                      }}
                      onBlur={() => setContactTouched((prev) => ({ ...prev, whatsApp: true }))}
                      data-testid="phone-local-input"
                      className={`flex-1 rounded-2xl border-2 bg-white px-5 py-4 im-text-body text-foreground placeholder:text-slate-400 focus:outline-none transition-colors ${contactTouched.whatsApp && phoneLocal.trim() && !isValidPhone(phoneCode, phoneLocal.trim()) ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-[#17375B]"}`}
                    />
                  </div>
                  {contactTouched.whatsApp && phoneLocal.trim() && !isValidPhone(phoneCode, phoneLocal.trim()) ? (
                    <p className="im-text-body-xs text-red-500">
                      Please enter a valid number for {PHONE_CODES.find(p => p.code === phoneCode)?.country ?? phoneCode}.
                    </p>
                  ) : (
                    <p className="im-text-body-xs text-slate-400">Clinics prefer WhatsApp for quick communication</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="im-text-body-sm font-semibold text-foreground">Preferred Language</label>
                  <select
                    value={data.preferredLanguage ?? ""}
                    onChange={(e) => {
                      const n = { ...data, preferredLanguage: e.target.value || undefined }
                      setData(n)
                      scheduleAutosave(n, country)
                    }}
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

                {/* Consent checkbox */}
                <button
                  type="button"
                  onClick={() => setConsentAccepted((v) => !v)}
                  className={`flex items-start gap-3 rounded-2xl border px-5 py-4 text-left transition-all ${
                    consentAccepted ? "border-[#17375B]/30 bg-[#17375B]/5" : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                    consentAccepted ? "border-[#17375B] bg-[#17375B]" : "border-slate-300"
                  }`}>
                    {consentAccepted && (
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <p className="im-text-body-sm text-slate-600">
                    I have read and agreed to the{" "}
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
          {step > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-2 im-text-body-sm font-semibold text-slate-500 hover:text-[#0D1E32] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
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
              {saving ? "Saving…" : step === visibleSteps.length - 1 ? "Create my account" : "Continue"}
              {!saving && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
