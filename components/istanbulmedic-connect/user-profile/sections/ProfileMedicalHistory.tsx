'use client'

import { useEffect, useRef, useState } from 'react' // useState used for form state; useRef for save timer
import { Merriweather } from 'next/font/google'

const merriweather = Merriweather({ subsets: ['latin'], weight: ['400', '700'], display: 'swap' })

interface PriorTransplant {
  year: number | ''
  estimatedGrafts: number | ''
  clinicCountry: string
}

interface PriorSurgery {
  type: string
  year: number | ''
  notes: string
}

interface FormData {
  allergies: string[]
  medications: string[]
  otherConditions: string[]
  hadPriorTransplant: boolean
  priorTransplants: PriorTransplant[]
  priorSurgeries: PriorSurgery[]
}

const EMPTY_TRANSPLANT: PriorTransplant = { year: '', estimatedGrafts: '', clinicCountry: '' }
const EMPTY_SURGERY: PriorSurgery = { type: '', year: '', notes: '' }

const CURRENT_YEAR = new Date().getFullYear()
function yearError(val: number | string): string | null {
  if (val === '' || val === 0) return null
  const n = Number(val)
  if (!Number.isInteger(n) || n < 1900 || n > CURRENT_YEAR) {
    return `Please enter a valid year (1900–${CURRENT_YEAR})`
  }
  return null
}

type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

function CardHeader({ title, saveState, saveError }: { title: string; saveState: SaveState; saveError?: string | null }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-border/60" style={{ background: 'rgba(62,187,183,0.06)' }}>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
      <span className="text-xs">
        {(saveState === 'pending' || saveState === 'saving') && <span className="text-muted-foreground">Saving…</span>}
        {saveState === 'saved' && <span className="text-[#3EBBB7]">Saved</span>}
        {saveState === 'error' && <span className="text-red-500" title={saveError ?? undefined}>Save failed{saveError ? `: ${saveError}` : ''}</span>}
      </span>
    </div>
  )
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 px-6 py-4 border-b border-border/60 last:border-0">
      <span className="text-muted-foreground shrink-0 w-5 flex justify-center mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-foreground mb-2">{label}</p>
        {children}
      </div>
    </div>
  )
}

function ListEditor({ items, placeholder, addLabel, onChange }: {
  items: string[]
  placeholder: string
  addLabel: string
  onChange: (items: string[]) => void
}) {
  return (
    <div className="space-y-2">
      {items.filter(Boolean).length === 0 && (
        <p className="text-base text-muted-foreground italic">None recorded — add one below</p>
      )}
      {items.map((item, i) => (
        <div key={i} className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center gap-2">
          <input
            className={inputClass}
            value={item}
            placeholder={placeholder}
            onChange={(e) => {
              const arr = [...items]
              arr[i] = e.target.value
              onChange(arr)
            }}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="shrink-0 text-muted-foreground hover:text-red-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ''])}
        className="flex items-center gap-1.5 text-base text-[#17375B] hover:text-[#3EBBB7] font-medium transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        {addLabel}
      </button>
    </div>
  )
}

const inputClass = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-base text-muted-foreground placeholder:text-muted-foreground/40 focus:border-[#17375B] focus:outline-none transition-colors'

const icons = {
  transplant: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
    </svg>
  ),
  surgery: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  allergy: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  medication: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5" />
    </svg>
  ),
  condition: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  ),
}

export default function ProfileMedicalHistory() {
  const [form, setForm] = useState<FormData>({
    allergies: [], medications: [], otherConditions: [],
    hadPriorTransplant: false, priorTransplants: [], priorSurgeries: [],
  })
  const [loading, setLoading] = useState(true)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/profile/treatment')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data
          setForm({
            allergies: d.allergies ?? [],
            medications: d.medications ?? [],
            otherConditions: d.otherConditions ?? [],
            hadPriorTransplant: d.hadPriorTransplant ?? false,
            priorTransplants: (d.priorTransplants ?? []).map((t: { year: number; estimatedGrafts: number; clinicCountry: string }) => ({
              year: t.year, estimatedGrafts: t.estimatedGrafts, clinicCountry: t.clinicCountry,
            })),
            priorSurgeries: (d.priorSurgeries ?? []).map((s: { type: string; year: number; notes?: string }) => ({
              type: s.type, year: s.year, notes: s.notes ?? '',
            })),
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }, [])

  const doSave = async (data: FormData) => {
    setSaveState('saving')
    try {
      const res = await fetch('/api/profile/treatment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allergies: data.allergies,
          medications: data.medications,
          otherConditions: data.otherConditions,
          hadPriorTransplant: data.priorTransplants.length > 0,
          priorTransplants: data.priorTransplants
            .filter((t) => t.year !== '' && !yearError(t.year))
            .map((t) => ({
              year: Number(t.year),
              estimatedGrafts: Number(t.estimatedGrafts) || 0,
              clinicCountry: t.clinicCountry,
            })),
          priorSurgeries: data.priorSurgeries
            .filter((s) => s.year !== '' && !yearError(s.year))
            .map((s) => ({
              type: s.type,
              year: Number(s.year),
              notes: s.notes || undefined,
            })),
        }),
      })
      const result = await res.json()
      if (result.success) {
        setSaveError(null)
        setSaveState('saved')
        setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 2000)
      } else {
        setSaveError(result.error ?? 'Unknown error')
        setSaveState('error')
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Network error')
      setSaveState('error')
    }
  }

  const triggerSave = (newForm: FormData) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaveState('pending')
    saveTimerRef.current = setTimeout(() => doSave(newForm), 800)
  }

  const setTransplant = (i: number, field: keyof PriorTransplant, value: string) => {
    const arr = [...form.priorTransplants]
    arr[i] = { ...arr[i], [field]: value }
    const newForm = { ...form, priorTransplants: arr }
    setForm(newForm)
    triggerSave(newForm)
  }

  const setSurgery = (i: number, field: keyof PriorSurgery, value: string) => {
    const arr = [...form.priorSurgeries]
    arr[i] = { ...arr[i], [field]: value }
    const newForm = { ...form, priorSurgeries: arr }
    setForm(newForm)
    triggerSave(newForm)
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-8 bg-muted rounded-xl w-48" />
        <div className="bg-card rounded-2xl border border-border h-48" />
        <div className="bg-card rounded-2xl border border-border h-48" />
        <div className="bg-card rounded-2xl border border-border h-48" />
      </div>
    )
  }

  return (
    <div>
      <h1 className={`${merriweather.className} text-2xl font-bold text-foreground mb-6`}>Medical history</h1>

      <div className="space-y-4">

        {/* ── Prior transplants ── */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <CardHeader title="Prior hair transplants" saveState={saveState} saveError={saveError} />
          <Row icon={icons.transplant} label="Prior transplants">
            <div className="space-y-3">
              {form.priorTransplants.length === 0 && (
                <p className="text-base text-muted-foreground italic">None recorded — add one below</p>
              )}
              {form.priorTransplants.map((t, i) => (
                <div key={i} className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <input className={inputClass} type="number" placeholder="Year" value={t.year} onChange={(e) => setTransplant(i, 'year', e.target.value)} />
                      {yearError(t.year) && <p className="text-sm text-red-500 mt-1">{yearError(t.year)}</p>}
                    </div>
                    <input className={inputClass} type="number" placeholder="Grafts" value={t.estimatedGrafts} onChange={(e) => setTransplant(i, 'estimatedGrafts', e.target.value)} />
                    <input className={inputClass} placeholder="Country" value={t.clinicCountry} onChange={(e) => setTransplant(i, 'clinicCountry', e.target.value)} />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newForm = { ...form, priorTransplants: form.priorTransplants.filter((_, j) => j !== i) }
                      setForm(newForm); triggerSave(newForm)
                    }}
                    className="text-sm text-red-400 hover:text-red-600 transition-colors"
                  >Remove</button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newForm = { ...form, priorTransplants: [...form.priorTransplants, { ...EMPTY_TRANSPLANT }] }
                  setForm(newForm); triggerSave(newForm)
                }}
                className="flex items-center gap-1.5 text-base text-[#17375B] hover:text-[#3EBBB7] font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Add transplant
              </button>
            </div>
          </Row>
        </div>

        {/* ── Prior surgeries ── */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <CardHeader title="Prior surgeries" saveState={saveState} saveError={saveError} />
          <Row icon={icons.surgery} label="Prior surgeries">
            <div className="space-y-3">
              {form.priorSurgeries.length === 0 && (
                <p className="text-base text-muted-foreground italic">None recorded — add one below</p>
              )}
              {form.priorSurgeries.map((s, i) => (
                <div key={i} className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input className={inputClass} placeholder="Surgery type" value={s.type} onChange={(e) => setSurgery(i, 'type', e.target.value)} />
                    <div>
                      <input className={inputClass} type="number" placeholder="Year" value={s.year} onChange={(e) => setSurgery(i, 'year', e.target.value)} />
                      {yearError(s.year) && <p className="text-sm text-red-500 mt-1">{yearError(s.year)}</p>}
                    </div>
                  </div>
                  <input className={inputClass} placeholder="Notes (optional)" value={s.notes} onChange={(e) => setSurgery(i, 'notes', e.target.value)} />
                  <button
                    type="button"
                    onClick={() => {
                      const newForm = { ...form, priorSurgeries: form.priorSurgeries.filter((_, j) => j !== i) }
                      setForm(newForm); triggerSave(newForm)
                    }}
                    className="text-sm text-red-400 hover:text-red-600 transition-colors"
                  >Remove</button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newForm = { ...form, priorSurgeries: [...form.priorSurgeries, { ...EMPTY_SURGERY }] }
                  setForm(newForm); triggerSave(newForm)
                }}
                className="flex items-center gap-1.5 text-base text-[#17375B] hover:text-[#3EBBB7] font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Add surgery
              </button>
            </div>
          </Row>
        </div>

        {/* ── Allergies & medications ── */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <CardHeader title="Allergies & medications" saveState={saveState} saveError={saveError} />
          <Row icon={icons.allergy} label="Allergies">
            <ListEditor items={form.allergies} placeholder="e.g. Penicillin" addLabel="Add allergy" onChange={(v) => { const n = { ...form, allergies: v }; setForm(n); triggerSave(n) }} />
          </Row>
          <Row icon={icons.medication} label="Medications">
            <ListEditor items={form.medications} placeholder="e.g. Finasteride" addLabel="Add medication" onChange={(v) => { const n = { ...form, medications: v }; setForm(n); triggerSave(n) }} />
          </Row>
          <Row icon={icons.condition} label="Other conditions">
            <ListEditor items={form.otherConditions} placeholder="e.g. Diabetes" addLabel="Add condition" onChange={(v) => { const n = { ...form, otherConditions: v }; setForm(n); triggerSave(n) }} />
          </Row>
        </div>

      </div>
    </div>
  )
}
