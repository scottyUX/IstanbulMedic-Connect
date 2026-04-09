"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Circle, Lock, ChevronRight, User, Stethoscope, Sparkles, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Container from "@/components/ui/container"

// --- Phase definitions ---

const PHASES = [
  {
    number: 1,
    id: "get-started",
    label: "Get Started",
    description: "Set up your account details, review consent, and tell us your basic preferences.",
    includes: ["Contact details", "Travel preferences", "Budget & timeline", "Consent"],
    icon: User,
    href: "/profile/get-started",
  },
  {
    number: 2,
    id: "treatment-profile",
    label: "Treatment Profile",
    description: "Build your full medical profile so clinics have everything they need.",
    includes: ["Hair loss history", "Medical background", "Donor area details", "Photo uploads"],
    icon: Stethoscope,
    href: "/profile/treatment-profile",
  },
  {
    number: 3,
    id: "ai-insights",
    label: "AI Insights",
    description: "Get an AI-powered analysis of your hair loss stage and estimated graft requirements.",
    includes: ["Norwood stage estimate", "Graft range", "Donor capacity score", "Risk flags"],
    icon: Sparkles,
    href: "/profile/ai-insights",
  },
  {
    number: 4,
    id: "share-connect",
    label: "Share & Connect",
    description: "Share your passport with vetted clinics and compare their personalised offers.",
    includes: ["Clinic shortlist", "Secure profile sharing", "Offer comparison", "Consultation booking"],
    icon: Share2,
    href: "/profile/share-connect",
  },
] as const

type Completion = Record<string, number>

function getPhaseStatus(phaseId: string, phaseNumber: number, completion: Completion) {
  const pct = completion[phaseId] ?? 0
  const prevPhaseId = PHASES[phaseNumber - 2]?.id
  const prevComplete = phaseNumber === 1 || (completion[prevPhaseId] ?? 0) === 100

  if (pct === 100) return "complete"
  if (pct > 0) return "in-progress"
  if (prevComplete) return "available"
  return "locked"
}

// --- Progress stepper ---

function Stepper({ completion }: { completion: Completion }) {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex min-w-[480px] items-center justify-between">
        {PHASES.map((phase, index) => {
          const status = getPhaseStatus(phase.id, phase.number, completion)
          const isLast = index === PHASES.length - 1

          return (
            <div key={phase.id} className="flex flex-1 items-center">
              {/* Node */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors",
                    status === "complete" && "border-[#3EBBB7] bg-[#3EBBB7] text-white",
                    status === "in-progress" && "border-[#17375B] bg-[#17375B] text-white",
                    status === "available" && "border-[#17375B] bg-white text-[#17375B]",
                    status === "locked" && "border-slate-300 bg-white text-slate-400",
                  )}
                >
                  {status === "complete" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span>{phase.number}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "im-text-body-xs font-semibold text-center whitespace-nowrap",
                    status === "locked" ? "im-text-muted" : "text-foreground",
                  )}
                >
                  {phase.label}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="flex-1 mx-3 mb-5">
                  <div
                    className={cn(
                      "h-0.5 w-full rounded-full transition-colors",
                      status === "complete" ? "bg-[#3EBBB7]" : "bg-slate-200",
                    )}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- Phase row card ---

function PhaseCard({ phase, completion }: { phase: (typeof PHASES)[number]; completion: Completion }) {
  const status = getPhaseStatus(phase.id, phase.number, completion)
  const pct = completion[phase.id] ?? 0
  const Icon = phase.icon
  const isLocked = status === "locked"

  const card = (
    <div
      className={cn(
        "group flex items-center gap-5 rounded-2xl border p-5 transition-all",
        isLocked
          ? "border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed"
          : "border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-[#17375B]/20 cursor-pointer",
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors",
          status === "complete" && "bg-[#3EBBB7]/10 text-[#3EBBB7]",
          status === "in-progress" && "bg-[#17375B]/10 text-[#17375B]",
          status === "available" && "bg-[#17375B]/10 text-[#17375B] group-hover:bg-[#17375B] group-hover:text-white",
          status === "locked" && "bg-slate-100 text-slate-400",
        )}
      >
        {isLocked ? <Lock className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="im-text-body-xs im-text-muted font-semibold uppercase tracking-wider">
            Phase {phase.number}
          </p>
          <span
            className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full",
              status === "complete" && "bg-[#3EBBB7]/10 text-[#3EBBB7]",
              status === "in-progress" && "bg-[#17375B]/10 text-[#17375B]",
              status === "available" && "bg-slate-100 text-slate-500",
              status === "locked" && "bg-slate-100 text-slate-400",
            )}
          >
            {status === "complete" && "Complete"}
            {status === "in-progress" && "In progress"}
            {status === "available" && "Not started"}
            {status === "locked" && "Locked"}
          </span>
        </div>

        <h2 className="im-heading-4 text-foreground mb-1">{phase.label}</h2>

        <p className="im-text-body-sm im-text-muted leading-snug line-clamp-1">{phase.description}</p>

        {/* Progress bar */}
        {status === "in-progress" && (
          <div className="mt-2">
            <div className="h-1.5 w-full rounded-full bg-slate-100">
              <div
                className="h-1.5 rounded-full bg-[#3EBBB7] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="im-text-body-xs im-text-muted mt-0.5">{pct}% complete</p>
          </div>
        )}

        {/* Includes tags */}
        {!isLocked && status !== "in-progress" && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {phase.includes.map((item) => (
              <span key={item} className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {status === "complete"
                  ? <CheckCircle2 className="h-3 w-3 text-[#3EBBB7]" />
                  : <Circle className="h-3 w-3 text-slate-300" />
                }
                {item}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* CTA arrow */}
      {!isLocked && (
        <div
          className={cn(
            "shrink-0 flex h-9 w-9 items-center justify-center rounded-full transition-colors",
            status === "complete"
              ? "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
              : "bg-[#17375B] text-white group-hover:bg-[#102741]",
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </div>
      )}
    </div>
  )

  if (isLocked) return card

  return (
    <Link href={phase.href} className="block">
      {card}
    </Link>
  )
}

// --- Dashboard ---

function getLocalCompletion(): Completion {
  try {
    const phase1Done = window.localStorage.getItem("im.qualification.complete") === "true"
    const phase2Done = window.localStorage.getItem("im.treatment-profile.complete") === "true"
    return {
      "get-started": phase1Done ? 100 : 0,
      "treatment-profile": phase2Done ? 100 : 0,
      "ai-insights": 0,
      "share-connect": 0,
    }
  } catch {
    return { "get-started": 0, "treatment-profile": 0, "ai-insights": 0, "share-connect": 0 }
  }
}

export function UserProfileDashboard() {
  const [completion, setCompletion] = useState<Completion>(() =>
    typeof window !== "undefined"
      ? getLocalCompletion()
      : { "get-started": 0, "treatment-profile": 0, "ai-insights": 0, "share-connect": 0 }
  )
  const [statusLoading, setStatusLoading] = useState(true)

  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await fetch("/api/profile/status")
        if (res.ok) {
          const json = await res.json()
          if (json.success) {
            setCompletion((prev) => ({
              ...prev,
              "get-started": json.data.qualificationComplete ? 100 : 0,
              "treatment-profile": json.data.treatmentComplete ? 100 : 0,
            }))
            return
          }
        }
      } catch {
        // fall through — localStorage values already loaded as initial state
      } finally {
        setStatusLoading(false)
      }
      // Fallback: ensure localStorage values are reflected (already set as initial state, but re-sync)
      setCompletion(getLocalCompletion())
    }
    loadStatus()
  }, [])

  const totalPhases = PHASES.length
  const completedPhases = PHASES.filter((p) => getPhaseStatus(p.id, p.number, completion) === "complete").length
  const overallPct = Math.round((completedPhases / totalPhases) * 100)

  return (
    <main className="imConnectTheme min-h-screen bg-slate-50 pt-[80px]">
      <Container className="pt-6 pb-10 max-w-5xl">

        {/* Page header */}
        <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="im-heading-1 text-foreground">Digital Treatment Passport</h1>
            <p className="mt-1 im-text-body-sm im-text-muted">
              Complete your profile so Leila can match and connect you with the right clinics.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0 shrink-0">
            <div className="text-right">
              <p className="im-text-body-xs im-text-muted">Overall progress</p>
              <p className="im-heading-2 text-foreground">{overallPct}%</p>
            </div>
            {/* Circular progress indicator */}
            <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.5" fill="none"
                stroke="#3EBBB7" strokeWidth="3"
                strokeDasharray={`${overallPct} 100`}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Stepper */}
        <div className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <Stepper completion={completion} />
        </div>

        {/* Phase cards */}
        <div className="flex flex-col gap-3">
          {statusLoading
            ? PHASES.map((phase) => (
                <div
                  key={phase.id}
                  className="h-[88px] rounded-2xl border border-slate-200 bg-white shadow-sm animate-pulse"
                />
              ))
            : PHASES.map((phase) => (
                <PhaseCard key={phase.id} phase={phase} completion={completion} />
              ))
          }
        </div>

      </Container>
    </main>
  )
}
