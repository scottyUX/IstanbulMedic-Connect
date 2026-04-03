"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, ArrowRight, Camera, Plus, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DesiredDensity, DonorAreaAvailability, DonorAreaQuality, PhotoView } from "@/types/patient-profile"
import Container from "@/components/ui/container"
import { createClient } from "@/lib/supabase/client"

// --- Types ---

interface PriorTransplantEntry {
  year: number
  estimatedGrafts: number
  clinicCountry: string
}

interface PriorSurgeryEntry {
  type: string
  year: number
  notes?: string
}

interface PhotoPreview {
  view: PhotoView
  file?: File         // undefined for already-saved photos loaded from DB
  previewUrl: string  // object URL for new files, storage URL for saved ones
  storagePath?: string // set for photos already in storage
}

interface TreatmentProfileData {
  norwoodScale?: number
  durationYears?: number
  donorAreaQuality?: DonorAreaQuality
  donorAreaAvailability?: DonorAreaAvailability
  desiredDensity?: DesiredDensity
  hadPriorTransplant?: boolean
  priorTransplants?: PriorTransplantEntry[]
  allergies?: string[]
  medications?: string[]
  priorSurgeries?: PriorSurgeryEntry[]
  otherConditions?: string[]
}

const STORAGE_KEY = "im.treatment-profile"

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

const PHOTO_VIEWS: { view: PhotoView; label: string; hint: string }[] = [
  { view: "front",      label: "Front",       hint: "Face the camera directly" },
  { view: "left_side",  label: "Left Side",   hint: "Turn your head to the right" },
  { view: "right_side", label: "Right Side",  hint: "Turn your head to the left" },
  { view: "top",        label: "Top / Crown", hint: "Camera looking straight down" },
  { view: "donor_area", label: "Donor Area",  hint: "Back of the head, hair parted" },
]

// --- Options ---

const NORWOOD_OPTIONS: { value: number; label: string; sub: string }[] = [
  { value: 1, label: "Stage 1", sub: "No significant hair loss or recession" },
  { value: 2, label: "Stage 2", sub: "Slight recession at the temples" },
  { value: 3, label: "Stage 3", sub: "Deep temple recession, early signs of loss" },
  { value: 4, label: "Stage 4", sub: "Severe recession with thinning at the crown" },
  { value: 5, label: "Stage 5", sub: "Large areas of loss, narrowing band between zones" },
  { value: 6, label: "Stage 6", sub: "Front and crown merge into one large bald area" },
  { value: 7, label: "Stage 7", sub: "Only a band of hair on the sides and back remains" },
]

const DURATION_OPTIONS: { value: number; label: string }[] = [
  { value: 1,  label: "Less than 1 year" },
  { value: 2,  label: "1 – 2 years" },
  { value: 5,  label: "3 – 5 years" },
  { value: 10, label: "5 – 10 years" },
  { value: 15, label: "More than 10 years" },
]

const DONOR_QUALITY_OPTIONS: { value: DonorAreaQuality; label: string; sub: string }[] = [
  { value: "excellent", label: "Excellent", sub: "Thick, dense hair at the back and sides" },
  { value: "good",      label: "Good",      sub: "Healthy donor area with sufficient density" },
  { value: "adequate",  label: "Adequate",  sub: "Some thinning but enough for a transplant" },
  { value: "poor",      label: "Poor",      sub: "Limited density — may affect graft count" },
]

const DONOR_AVAILABILITY_OPTIONS: { value: DonorAreaAvailability; label: string; sub: string }[] = [
  { value: "good",     label: "Good availability",     sub: "Large donor zone with plenty of grafts" },
  { value: "adequate", label: "Adequate availability", sub: "Enough grafts for most procedures" },
  { value: "limited",  label: "Limited availability",  sub: "Restricted zone or previous extraction" },
]

const DENSITY_OPTIONS: { value: DesiredDensity; label: string; sub: string }[] = [
  { value: "maximum", label: "Maximum density",  sub: "Full, thick coverage across all areas" },
  { value: "high",    label: "High density",     sub: "Natural-looking and noticeably dense result" },
  { value: "medium",  label: "Medium density",   sub: "Good coverage with a natural spread" },
  { value: "low",     label: "Natural coverage", sub: "Soft, age-appropriate result with coverage" },
]

const STEPS = [
  { id: "norwood",           title: "What best describes your current hair loss?",      subtitle: "Select the Norwood stage that most closely matches your pattern." },
  { id: "duration",          title: "How long have you been experiencing hair loss?",   subtitle: "This helps clinics understand the progression of your loss." },
  { id: "donor_quality",     title: "How would you describe your donor area quality?",  subtitle: "The density of hair at the back and sides of your scalp." },
  { id: "donor_availability",title: "How available is your donor area?",               subtitle: "The amount of scalp available for graft extraction." },
  { id: "density",           title: "What level of coverage are you hoping to achieve?",subtitle: "Your donor availability may affect what's realistically possible." },
  { id: "prior_transplants", title: "Have you had a hair transplant before?",           subtitle: "Previous procedures affect graft availability and technique options." },
  { id: "photos",            title: "Upload photos of your hair",                       subtitle: "Clear photos help clinics give you an accurate assessment. All views are optional but recommended." },
  { id: "allergies",         title: "Do you have any known allergies?",                 subtitle: "Include drug, material, or anaesthetic allergies. Skip if none." },
  { id: "medications",       title: "Are you currently taking any medications?",        subtitle: "Include prescriptions, supplements, and blood thinners. Skip if none." },
  { id: "prior_surgeries",   title: "Have you had any prior surgeries?",               subtitle: "Any previous operations clinics should be aware of. Skip if none." },
  { id: "medical_conditions",title: "Any other relevant medical conditions?",           subtitle: "e.g. diabetes, hypertension, autoimmune disorders. Skip if none." },
]

const TOTAL_STEPS = STEPS.length

// --- Sub-components ---

function StepDots({ total, current, highest, onNavigate }: {
  total: number
  current: number
  highest: number
  onNavigate: (i: number) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5 justify-center mb-6">
      {Array.from({ length: total }).map((_, i) => {
        const isComplete = i < current && i <= highest
        const isCurrent  = i === current
        const isVisited  = i <= highest && i !== current
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
              isVisited && !isComplete && "bg-[#17375B]/10 text-[#17375B] hover:bg-[#17375B]/20 cursor-pointer",
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

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round(((step + 1) / total) * 100)
  return (
    <div className="w-full">
      <div className="flex justify-between im-text-body-xs im-text-muted mb-2">
        <span>Step {step + 1} of {total}</span>
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

function OptionCard({ label, sub, selected, onClick }: { label: string; sub?: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl border-2 px-5 py-4 transition-all duration-150",
        selected ? "border-[#17375B] bg-[#17375B]/5" : "border-slate-200 bg-white hover:border-[#17375B]/40 hover:bg-slate-50",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={cn("im-text-body font-semibold", selected ? "text-[#0D1E32]" : "text-foreground")}>{label}</p>
          {sub && <p className="im-text-body-sm text-slate-400 mt-0.5">{sub}</p>}
        </div>
        <div className={cn("shrink-0 h-5 w-5 rounded-full border-2 transition-colors", selected ? "border-[#17375B] bg-[#17375B]" : "border-slate-300")} />
      </div>
    </button>
  )
}

function TagListInput({ items, onAdd, onRemove, placeholder, inputValue, onInputChange }: {
  items: string[]
  onAdd: () => void
  onRemove: (i: number) => void
  placeholder: string
  inputValue: string
  onInputChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5 rounded-full border border-[#17375B]/20 bg-[#17375B]/5 px-3 py-1.5 im-text-body-sm font-medium text-[#17375B]">
              {item}
              <button type="button" onClick={() => onRemove(i)} aria-label={`Remove ${item}`} className="text-[#17375B]/60 hover:text-red-500 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input type="text" value={inputValue} onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd() } }}
          placeholder={placeholder}
          className="flex-1 rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 im-text-body text-foreground placeholder:text-slate-400 focus:border-[#17375B] focus:outline-none transition-colors"
        />
        <button type="button" onClick={onAdd} disabled={!inputValue.trim()}
          className="flex items-center gap-1.5 rounded-2xl bg-[#17375B] px-4 py-3 im-text-body-sm font-semibold text-white hover:bg-[#102741] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
    </div>
  )
}

// --- Main component ---

export function TreatmentProfile() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [data, setData] = useState<TreatmentProfileData>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [highestStep, setHighestStep] = useState(0)

  // Photo state — kept in memory only (File objects can't be serialised to localStorage)
  const [photos, setPhotos] = useState<PhotoPreview[]>([])
  const [photoErrors, setPhotoErrors] = useState<Partial<Record<PhotoView, string>>>({})
  const fileInputRefs = useRef<Partial<Record<PhotoView, HTMLInputElement | null>>>({})

  // Per-step input state
  const [newTransplant, setNewTransplant] = useState({ year: "", estimatedGrafts: "", clinicCountry: "" })
  const [newSurgery, setNewSurgery] = useState({ type: "", year: "", notes: "" })
  const [allergyInput, setAllergyInput] = useState("")
  const [medicationInput, setMedicationInput] = useState("")
  const [conditionInput, setConditionInput] = useState("")

  // Restore from localStorage and load saved photos on mount
  useEffect(() => {
    async function init() {
      // 1. Restore from localStorage first (fallback / offline)
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY)
        if (stored) setData(JSON.parse(stored) as TreatmentProfileData)
        const alreadyComplete = window.localStorage.getItem("im.treatment-profile.complete") === "true"
        if (alreadyComplete) {
          setHighestStep(TOTAL_STEPS - 1)
        } else {
          const storedHighest = window.localStorage.getItem(STORAGE_KEY + ".highest")
          if (storedHighest) setHighestStep(parseInt(storedHighest) || 0)
        }
      } catch { /* ignore */ }

      // 2. If signed in, fetch from DB and override localStorage
      try {
        const supabase = createClient()
        if (!supabase) return
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const res = await fetch("/api/profile/treatment")
          if (res.ok) {
            const json = await res.json()
            const db = json.data
            if (db) {
              setData({
                norwoodScale: db.norwoodScale,
                durationYears: db.durationYears,
                donorAreaQuality: db.donorAreaQuality,
                donorAreaAvailability: db.donorAreaAvailability,
                desiredDensity: db.desiredDensity,
                hadPriorTransplant: db.hadPriorTransplant,
                priorTransplants: db.priorTransplants,
                allergies: db.allergies,
                medications: db.medications,
                priorSurgeries: db.priorSurgeries,
                otherConditions: db.otherConditions,
              })
              setHighestStep(TOTAL_STEPS - 1)
            }
          }
        }
      } catch { /* ignore — use localStorage */ }

      // 3. Load saved photos from DB
      try {
        const res = await fetch("/api/profile/photos")
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data?.length) {
            setPhotos(json.data.map((p: { photo_view: PhotoView; storage_url: string }) => {
              const pathMatch = p.storage_url.match(/\/user-photos\/(.+)$/)
              return {
                view: p.photo_view,
                previewUrl: p.storage_url,
                storagePath: pathMatch ? pathMatch[1] : undefined,
              }
            }))
          }
        }
      } catch { /* ignore — no photos yet */ }

      setHydrated(true)
    }
    init()
  }, [])

  // Persist — skipped on initial render until hydration re-render applies
  useEffect(() => {
    if (!hydrated) return
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }
    catch { /* ignore */ }
  }, [data, hydrated])

  useEffect(() => {
    if (!hydrated) return
    try { window.localStorage.setItem(STORAGE_KEY + ".highest", String(highestStep)) }
    catch { /* ignore */ }
  }, [highestStep, hydrated])

  // Revoke object URLs on unmount (only for locally-created object URLs, not storage URLs)
  const photosRef = useRef(photos)
  photosRef.current = photos
  useEffect(() => {
    return () => { photosRef.current.forEach((p) => { if (p.file) URL.revokeObjectURL(p.previewUrl) }) }
  }, [])

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [step])

  const currentStep = STEPS[step]

  const canContinue = (() => {
    if (currentStep.id === "norwood")            return !!data.norwoodScale
    if (currentStep.id === "duration")           return !!data.durationYears
    if (currentStep.id === "donor_quality")      return !!data.donorAreaQuality
    if (currentStep.id === "donor_availability") return !!data.donorAreaAvailability
    if (currentStep.id === "density")            return !!data.desiredDensity
    if (currentStep.id === "prior_transplants")  return data.hadPriorTransplant !== undefined
    return true // photos + all medical steps are optional
  })()

  async function goNext() {
    setDirection(1)
    if (step === TOTAL_STEPS - 1) {
      setSaving(true)
      setSaveError(null)
      try {
        // Upload photos to Supabase Storage, collect metadata
        const photoMeta: { view: PhotoView; storageUrl: string; fileSizeBytes: number; mimeType: string }[] = []

        const newPhotos = photos.filter((p) => !!p.file)
        if (newPhotos.length > 0) {
          const supabase = createClient()
          if (!supabase) {
            setSaveError("Storage client not available. Check environment variables.")
            setSaving(false)
            return
          }

          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            setSaveError("Not signed in. Please sign in and try again.")
            setSaving(false)
            return
          }

          for (const photo of newPhotos) {
            const ext = photo.file!.name.split(".").pop() ?? "jpg"
            const path = `${user.id}/${photo.view}.${ext}`
            const { error: uploadError } = await supabase.storage
              .from("user-photos")
              .upload(path, photo.file!, { upsert: true, contentType: photo.file!.type })

            if (uploadError) {
              setSaveError(`Failed to upload ${photo.view} photo: ${uploadError.message}`)
              setSaving(false)
              return
            }

            const { data: urlData } = supabase.storage.from("user-photos").getPublicUrl(path)
            photoMeta.push({
              view: photo.view,
              storageUrl: urlData.publicUrl,
              fileSizeBytes: photo.file!.size,
              mimeType: photo.file!.type,
            })
          }
        }

        const res = await fetch("/api/profile/treatment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, photos: photoMeta }),
        })
        if (!res.ok) {
          const json = await res.json()
          setSaveError(json.error ?? "Failed to save. Please try again.")
          setSaving(false)
          return
        }
      } catch {
        setSaveError("Network error. Please check your connection and try again.")
        setSaving(false)
        return
      }
      window.localStorage.setItem("im.treatment-profile.complete", "true")
      setSaving(false)
      router.push("/profile")
    } else {
      const next = step + 1
      if (next > highestStep) setHighestStep(next)
      setStep(next)
      // Auto-save in background on every step advance (photos saved on final step)
      fetch("/api/profile/treatment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).catch(() => { /* localStorage is the fallback */ })
    }
  }

  function goBack() {
    setDirection(-1)
    if (step === 0) router.push("/profile")
    else setStep((s) => s - 1)
  }

  const sectionComplete = highestStep >= TOTAL_STEPS - 1

  async function saveAndExit() {
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch("/api/profile/treatment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const json = await res.json()
        setSaveError(json.error ?? "Failed to save.")
        setSaving(false)
        return
      }
    } catch {
      // localStorage already has the data — continue to dashboard
    } finally {
      setSaving(false)
    }
    router.push("/profile")
  }

  function navigateTo(i: number) {
    if (i > highestStep) return
    setDirection(i > step ? 1 : -1)
    setStep(i)
  }

  // --- Photo helpers ---

  function handleFileSelect(view: PhotoView, file: File) {
    // Validate type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setPhotoErrors((p) => ({ ...p, [view]: "Only JPG, PNG, or WebP images are accepted." }))
      return
    }
    // Validate size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setPhotoErrors((p) => ({ ...p, [view]: `File must be under ${MAX_FILE_SIZE_MB} MB.` }))
      return
    }
    // Clear error and revoke old object URL (if it was a local file)
    setPhotoErrors((p) => { const next = { ...p }; delete next[view]; return next })
    setPhotos((prev) => {
      const old = prev.find((p) => p.view === view)
      if (old?.file) URL.revokeObjectURL(old.previewUrl)
      // Delete old storage file in background if replacing a saved photo
      if (old?.storagePath) {
        createClient()?.storage.from("user-photos").remove([old.storagePath])
      }
      return [...prev.filter((p) => p.view !== view), { view, file, previewUrl: URL.createObjectURL(file) }]
    })
  }

  async function removePhoto(view: PhotoView) {
    const photo = photos.find((p) => p.view === view)
    if (photo?.file) URL.revokeObjectURL(photo.previewUrl)
    setPhotos((prev) => prev.filter((p) => p.view !== view))
    setPhotoErrors((p) => { const next = { ...p }; delete next[view]; return next })
    // Delete from storage + DB if it was a saved photo
    if (photo?.storagePath) {
      try {
        createClient()?.storage.from("user-photos").remove([photo.storagePath])
        await fetch("/api/profile/photos", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ view }),
        })
      } catch { /* best-effort */ }
    }
  }

  // --- List helpers ---

  function addToList(field: "allergies" | "medications" | "otherConditions", value: string) {
    const trimmed = value.trim()
    if (!trimmed) return
    setData((p) => ({ ...p, [field]: [...(p[field] ?? []), trimmed] }))
  }

  function removeFromList(field: "allergies" | "medications" | "otherConditions", index: number) {
    setData((p) => ({ ...p, [field]: (p[field] ?? []).filter((_, i) => i !== index) }))
  }

  function addTransplant() {
    const year = parseInt(newTransplant.year)
    const grafts = parseInt(newTransplant.estimatedGrafts)
    if (!year || !grafts || !newTransplant.clinicCountry.trim()) return
    setData((p) => ({ ...p, priorTransplants: [...(p.priorTransplants ?? []), { year, estimatedGrafts: grafts, clinicCountry: newTransplant.clinicCountry.trim() }] }))
    setNewTransplant({ year: "", estimatedGrafts: "", clinicCountry: "" })
  }

  function addSurgery() {
    const year = parseInt(newSurgery.year)
    if (!newSurgery.type.trim() || !year) return
    setData((p) => ({ ...p, priorSurgeries: [...(p.priorSurgeries ?? []), { type: newSurgery.type.trim(), year, notes: newSurgery.notes.trim() || undefined }] }))
    setNewSurgery({ type: "", year: "", notes: "" })
  }

  const inputSm = "rounded-xl border-2 border-slate-200 px-3 py-2 im-text-body-sm text-foreground placeholder:text-slate-400 focus:border-[#17375B] focus:outline-none transition-colors"
  const labelSm = "im-text-body-xs font-semibold text-slate-500"

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:  (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
  }

  return (
    <main className="imConnectTheme min-h-screen bg-slate-50 pt-[80px]">
      <Container className="pt-8 pb-16 max-w-xl">

        <button type="button" onClick={() => router.push("/profile")}
          className="flex items-center gap-2 im-text-body-sm font-semibold text-slate-500 hover:text-[#0D1E32] transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </button>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

          <StepDots total={TOTAL_STEPS} current={step} highest={highestStep} onNavigate={navigateTo} />
          <div className="mb-8">
            <ProgressBar step={step} total={TOTAL_STEPS} />
          </div>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div key={currentStep.id} custom={direction} variants={variants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.22, ease: "easeOut" }} className="w-full">

              <h2 className="im-heading-2 text-foreground mb-1">{currentStep.title}</h2>
              <p className="im-text-body-sm im-text-muted mb-6">{currentStep.subtitle}</p>

              {/* Norwood scale */}
              {currentStep.id === "norwood" && (
                <div className="flex flex-col gap-3">
                  {NORWOOD_OPTIONS.map((opt) => (
                    <OptionCard key={opt.value} label={opt.label} sub={opt.sub}
                      selected={data.norwoodScale === opt.value}
                      onClick={() => setData((p) => ({ ...p, norwoodScale: opt.value }))} />
                  ))}
                </div>
              )}

              {/* Duration */}
              {currentStep.id === "duration" && (
                <div className="flex flex-col gap-3">
                  {DURATION_OPTIONS.map((opt) => (
                    <OptionCard key={opt.value} label={opt.label}
                      selected={data.durationYears === opt.value}
                      onClick={() => setData((p) => ({ ...p, durationYears: opt.value }))} />
                  ))}
                </div>
              )}

              {/* Donor quality */}
              {currentStep.id === "donor_quality" && (
                <div className="flex flex-col gap-3">
                  {DONOR_QUALITY_OPTIONS.map((opt) => (
                    <OptionCard key={opt.value} label={opt.label} sub={opt.sub}
                      selected={data.donorAreaQuality === opt.value}
                      onClick={() => setData((p) => ({ ...p, donorAreaQuality: opt.value }))} />
                  ))}
                </div>
              )}

              {/* Donor availability */}
              {currentStep.id === "donor_availability" && (
                <div className="flex flex-col gap-3">
                  {DONOR_AVAILABILITY_OPTIONS.map((opt) => (
                    <OptionCard key={opt.value} label={opt.label} sub={opt.sub}
                      selected={data.donorAreaAvailability === opt.value}
                      onClick={() => setData((p) => ({ ...p, donorAreaAvailability: opt.value }))} />
                  ))}
                </div>
              )}

              {/* Desired density */}
              {currentStep.id === "density" && (
                <div className="flex flex-col gap-3">
                  {DENSITY_OPTIONS.map((opt) => (
                    <OptionCard key={opt.value} label={opt.label} sub={opt.sub}
                      selected={data.desiredDensity === opt.value}
                      onClick={() => setData((p) => ({ ...p, desiredDensity: opt.value }))} />
                  ))}
                </div>
              )}

              {/* Prior transplants */}
              {currentStep.id === "prior_transplants" && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3">
                    <OptionCard label="No, this would be my first" selected={data.hadPriorTransplant === false}
                      onClick={() => setData((p) => ({ ...p, hadPriorTransplant: false, priorTransplants: [] }))} />
                    <OptionCard label="Yes, I've had a transplant before" selected={data.hadPriorTransplant === true}
                      onClick={() => setData((p) => ({ ...p, hadPriorTransplant: true }))} />
                  </div>
                  {data.hadPriorTransplant === true && (
                    <div className="flex flex-col gap-3 mt-1">
                      {(data.priorTransplants ?? []).map((t, i) => (
                        <div key={i} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3">
                          <div>
                            <p className="im-text-body-sm font-semibold text-foreground">{t.clinicCountry} · {t.year}</p>
                            <p className="im-text-body-xs im-text-muted">~{t.estimatedGrafts.toLocaleString()} grafts</p>
                          </div>
                          <button type="button" onClick={() => setData((p) => ({ ...p, priorTransplants: (p.priorTransplants ?? []).filter((_, j) => j !== i) }))}
                            className="text-slate-400 hover:text-red-500 transition-colors" aria-label="Remove">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col gap-3">
                        <p className="im-text-body-sm font-semibold text-foreground">Add a procedure</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className={labelSm}>Year</label>
                            <input type="number" min="1990" max={new Date().getFullYear()} value={newTransplant.year}
                              onChange={(e) => setNewTransplant((p) => ({ ...p, year: e.target.value }))}
                              placeholder="e.g. 2019" className={inputSm} />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className={labelSm}>Est. grafts</label>
                            <input type="number" min="100" value={newTransplant.estimatedGrafts}
                              onChange={(e) => setNewTransplant((p) => ({ ...p, estimatedGrafts: e.target.value }))}
                              placeholder="e.g. 2500" className={inputSm} />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className={labelSm}>Country of clinic</label>
                          <input type="text" value={newTransplant.clinicCountry}
                            onChange={(e) => setNewTransplant((p) => ({ ...p, clinicCountry: e.target.value }))}
                            placeholder="e.g. Turkey" className={inputSm} />
                        </div>
                        <button type="button" onClick={addTransplant}
                          disabled={!newTransplant.year || !newTransplant.estimatedGrafts || !newTransplant.clinicCountry.trim()}
                          className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-2 im-text-body-sm font-semibold text-slate-500 hover:border-[#17375B] hover:text-[#17375B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                          <Plus className="h-4 w-4" /> Add procedure
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Photos */}
              {currentStep.id === "photos" && (
                <div className="flex flex-col gap-3">
                  {PHOTO_VIEWS.map(({ view, label, hint }) => {
                    const uploaded = photos.find((p) => p.view === view)
                    const error = photoErrors[view]
                    return (
                      <div key={view}>
                        {/* Hidden file input */}
                        <input
                          ref={(el) => { fileInputRefs.current[view] = el }}
                          type="file"
                          accept={ACCEPTED_TYPES.join(",")}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileSelect(view, file)
                            e.target.value = "" // reset so same file can be re-selected
                          }}
                        />

                        {uploaded ? (
                          // Preview card
                          <div className="flex items-center gap-4 rounded-2xl border-2 border-[#17375B]/20 bg-[#17375B]/5 px-4 py-3">
                            <img src={uploaded.previewUrl} alt={label}
                              className="h-16 w-16 rounded-xl object-cover shrink-0 border border-slate-200" />
                            <div className="flex-1 min-w-0">
                              <p className="im-text-body-sm font-semibold text-foreground">{label}</p>
                              {uploaded.file
                                ? <>
                                    <p className="im-text-body-xs text-slate-400 truncate">{uploaded.file.name}</p>
                                    <p className="im-text-body-xs text-slate-400">{(uploaded.file.size / (1024 * 1024)).toFixed(1)} MB</p>
                                  </>
                                : <p className="im-text-body-xs text-slate-400">Saved</p>
                              }
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button type="button"
                                onClick={() => fileInputRefs.current[view]?.click()}
                                className="im-text-body-xs font-semibold text-[#17375B] hover:underline">
                                Replace
                              </button>
                              <button type="button" onClick={() => removePhoto(view)}
                                className="text-slate-400 hover:text-red-500 transition-colors" aria-label="Remove">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Upload slot
                          <button type="button"
                            onClick={() => fileInputRefs.current[view]?.click()}
                            className={cn(
                              "w-full flex items-center gap-4 rounded-2xl border-2 border-dashed px-4 py-4 transition-all",
                              error ? "border-red-300 bg-red-50" : "border-slate-200 bg-white hover:border-[#17375B]/40 hover:bg-slate-50",
                            )}
                          >
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                              <Camera className="h-5 w-5 text-slate-400" />
                            </div>
                            <div className="text-left">
                              <p className="im-text-body-sm font-semibold text-foreground">{label}</p>
                              <p className="im-text-body-xs text-slate-400">{hint}</p>
                              {error
                                ? <p className="im-text-body-xs text-red-500 mt-0.5">{error}</p>
                                : <p className="im-text-body-xs text-slate-400 mt-0.5">JPG, PNG or WebP · max {MAX_FILE_SIZE_MB} MB</p>
                              }
                            </div>
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Allergies */}
              {currentStep.id === "allergies" && (
                <TagListInput items={data.allergies ?? []}
                  onAdd={() => { addToList("allergies", allergyInput); setAllergyInput("") }}
                  onRemove={(i) => removeFromList("allergies", i)}
                  placeholder="e.g. Penicillin, Latex, Ibuprofen"
                  inputValue={allergyInput} onInputChange={setAllergyInput} />
              )}

              {/* Medications */}
              {currentStep.id === "medications" && (
                <TagListInput items={data.medications ?? []}
                  onAdd={() => { addToList("medications", medicationInput); setMedicationInput("") }}
                  onRemove={(i) => removeFromList("medications", i)}
                  placeholder="e.g. Finasteride, Minoxidil, Aspirin"
                  inputValue={medicationInput} onInputChange={setMedicationInput} />
              )}

              {/* Prior surgeries */}
              {currentStep.id === "prior_surgeries" && (
                <div className="flex flex-col gap-3">
                  {(data.priorSurgeries ?? []).map((s, i) => (
                    <div key={i} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3">
                      <div>
                        <p className="im-text-body-sm font-semibold text-foreground capitalize">{s.type} · {s.year}</p>
                        {s.notes && <p className="im-text-body-xs im-text-muted">{s.notes}</p>}
                      </div>
                      <button type="button"
                        onClick={() => setData((p) => ({ ...p, priorSurgeries: (p.priorSurgeries ?? []).filter((_, j) => j !== i) }))}
                        className="text-slate-400 hover:text-red-500 transition-colors" aria-label="Remove">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col gap-3">
                    <p className="im-text-body-sm font-semibold text-foreground">Add a surgery</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={labelSm}>Type of surgery</label>
                        <input type="text" value={newSurgery.type}
                          onChange={(e) => setNewSurgery((p) => ({ ...p, type: e.target.value }))}
                          placeholder="e.g. Appendectomy" className={inputSm} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={labelSm}>Year</label>
                        <input type="number" min="1950" max={new Date().getFullYear()} value={newSurgery.year}
                          onChange={(e) => setNewSurgery((p) => ({ ...p, year: e.target.value }))}
                          placeholder="e.g. 2015" className={inputSm} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelSm}>Notes <span className="font-normal text-slate-400">(optional)</span></label>
                      <input type="text" value={newSurgery.notes}
                        onChange={(e) => setNewSurgery((p) => ({ ...p, notes: e.target.value }))}
                        placeholder="Any relevant details" className={inputSm} />
                    </div>
                    <button type="button" onClick={addSurgery}
                      disabled={!newSurgery.type.trim() || !newSurgery.year}
                      className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-2 im-text-body-sm font-semibold text-slate-500 hover:border-[#17375B] hover:text-[#17375B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      <Plus className="h-4 w-4" /> Add surgery
                    </button>
                  </div>
                </div>
              )}

              {/* Other medical conditions */}
              {currentStep.id === "medical_conditions" && (
                <TagListInput items={data.otherConditions ?? []}
                  onAdd={() => { addToList("otherConditions", conditionInput); setConditionInput("") }}
                  onRemove={(i) => removeFromList("otherConditions", i)}
                  placeholder="e.g. Diabetes, Hypertension, Alopecia areata"
                  inputValue={conditionInput} onInputChange={setConditionInput} />
              )}

            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          {saveError && (
            <p className="w-full mt-4 im-text-body-sm text-red-500 text-center">{saveError}</p>
          )}
          <div className="w-full mt-4 flex items-center justify-between gap-4">
            <button type="button" onClick={goBack} disabled={saving}
              className="flex items-center gap-2 im-text-body-sm font-semibold text-slate-500 hover:text-[#0D1E32] transition-colors disabled:opacity-40">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <div className="flex items-center gap-2">
              {sectionComplete && step !== TOTAL_STEPS - 1 && (
                <button type="button" onClick={saveAndExit} disabled={saving}
                  className="flex items-center gap-2 rounded-2xl border-2 border-[#17375B] px-5 py-3 im-text-body font-semibold text-[#17375B] hover:bg-[#17375B]/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  {saving ? "Saving…" : "Save & exit"}
                </button>
              )}
              <button type="button" onClick={goNext} disabled={!canContinue || saving}
                className={cn(
                  "flex items-center gap-2 rounded-2xl px-6 py-3 im-text-body font-semibold transition-all",
                  canContinue && !saving ? "bg-[#17375B] text-white hover:bg-[#102741]" : "bg-slate-200 text-slate-400 cursor-not-allowed",
                )}>
                {saving ? "Saving…" : step === TOTAL_STEPS - 1 ? "Save & continue" : "Continue"}
                {!saving && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </div>

        </div>
      </Container>
    </main>
  )
}
