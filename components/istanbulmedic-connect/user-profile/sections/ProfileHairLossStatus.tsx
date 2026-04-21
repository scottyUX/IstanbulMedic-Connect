'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Merriweather } from 'next/font/google'

const merriweather = Merriweather({ subsets: ['latin'], weight: ['400', '700'], display: 'swap' })

interface HairForm {
  norwoodScale: string
  durationYears: string
}

const NORWOOD_OPTIONS = [
  { value: 1, label: 'Stage 1 – Minimal or no recession' },
  { value: 2, label: 'Stage 2 – Minor temple recession' },
  { value: 3, label: 'Stage 3 – Deepening temples' },
  { value: 4, label: 'Stage 4 – Significant crown thinning' },
  { value: 5, label: 'Stage 5 – Moderate to significant loss' },
  { value: 6, label: 'Stage 6 – Extensive loss, one band remains' },
  { value: 7, label: 'Stage 7 – Most extensive pattern' },
]

const DURATION_OPTIONS = [
  { value: 0, label: 'Less than 1 year' },
  { value: 1, label: '1–3 years' },
  { value: 3, label: '3–5 years' },
  { value: 5, label: '5–10 years' },
  { value: 10, label: '10+ years' },
]


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

const icons = {
  norwood: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  duration: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

export default function ProfileHairLossStatus() {
  const [form, setForm] = useState<HairForm>({
    norwoodScale: '', durationYears: '',
  })
  const [loading, setLoading] = useState(true)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }, [])

  useEffect(() => {
    fetch('/api/profile/treatment')
      .then((r) => r.json())
      .then((treat) => {
        if (treat.success && treat.data) {
          const d = treat.data
          setForm({
            norwoodScale: d.norwoodScale != null ? String(d.norwoodScale) : '',
            durationYears: d.durationYears != null ? String(d.durationYears) : '',
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const doSave = async (data: HairForm) => {
    setSaveState('saving')
    try {
      const res = await fetch('/api/profile/treatment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          norwoodScale: data.norwoodScale !== '' ? Number(data.norwoodScale) : undefined,
          durationYears: data.durationYears !== '' ? Number(data.durationYears) : undefined,
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

  const set = (field: keyof HairForm, value: string) => {
    const newForm = { ...form, [field]: value }
    setForm(newForm)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaveState('pending')
    saveTimerRef.current = setTimeout(() => doSave(newForm), 800)
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
      <h1 className={`${merriweather.className} text-2xl font-bold text-foreground mb-6`}>Hair loss status</h1>

      <div className="space-y-4">

        {/* ── Hair loss classification ── */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <CardHeader title="Hair loss classification" saveState={saveState} saveError={saveError} />
          <Row icon={icons.norwood} label="Norwood scale">
            <div className="flex flex-col gap-3" role="radiogroup" aria-label="Norwood scale">
              {NORWOOD_OPTIONS.map((o) => {
                const selected = form.norwoodScale === String(o.value)
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => set('norwoodScale', String(o.value))}
                    className={`flex items-center gap-5 w-full text-left rounded-xl border-2 px-5 py-4 transition-all ${
                      selected
                        ? 'border-[#17375B] bg-[#17375B]/5'
                        : 'border-border bg-background hover:border-[#17375B]/40'
                    }`}
                  >
                    <div className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      selected ? 'border-[#17375B] bg-[#17375B]' : 'border-muted-foreground/30 bg-background'
                    }`}>
                      {selected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <Image
                      src={`/assets/norwood/stage-${o.value}.png`}
                      alt={`Stage ${o.value}`}
                      width={112}
                      height={112}
                      loading="lazy"
                      className="w-28 h-28 object-contain shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-base font-semibold ${selected ? 'text-[#17375B]' : 'text-muted-foreground'}`}>
                        {o.label}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </Row>
          <Row icon={icons.duration} label="Hair loss duration">
            <div className="flex flex-col gap-2" role="radiogroup" aria-label="Hair loss duration">
              {DURATION_OPTIONS.map((o) => {
                const selected = form.durationYears === String(o.value)
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => set('durationYears', String(o.value))}
                    className={`flex items-center gap-4 w-full text-left rounded-xl border-2 px-4 py-3 transition-all ${
                      selected
                        ? 'border-[#17375B] bg-[#17375B]/5'
                        : 'border-border bg-background hover:border-[#17375B]/40'
                    }`}
                  >
                    <div className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      selected ? 'border-[#17375B] bg-[#17375B]' : 'border-muted-foreground/30 bg-background'
                    }`}>
                      {selected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <p className={`text-base font-semibold ${selected ? 'text-[#17375B]' : 'text-muted-foreground'}`}>
                      {o.label}
                    </p>
                  </button>
                )
              })}
            </div>
          </Row>
        </div>


      </div>
    </div>
  )
}
