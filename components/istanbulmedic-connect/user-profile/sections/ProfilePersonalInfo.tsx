'use client'

import { useEffect, useRef, useState } from 'react'
import { Merriweather } from 'next/font/google'
import { useAuth } from '@/contexts/AuthContext'
import type { QualificationPayload } from '@/lib/api/userProfile'

const merriweather = Merriweather({ subsets: ['latin'], weight: ['400', '700'], display: 'swap' })

interface QualData {
  country: string | null
  budgetTier: string | null
  timeline: string | null
  whatsApp: string | null
  preferredLanguage: string | null
  firstName: string | null
  lastName: string | null
  email: string | null
  gender: string | null
  birthday: string | null
}

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

const BUDGET_OPTIONS = [
  { value: 'under-2000', label: 'Under £2,000' },
  { value: '2000-5000', label: '£2,000 – £5,000' },
  { value: '5000-8000', label: '£5,000 – £8,000' },
  { value: '8000-12000', label: '£8,000 – £12,000' },
  { value: '12000-plus', label: '£12,000+' },
]

const TIMELINE_OPTIONS = [
  { value: '1-3-months', label: '1–3 months' },
  { value: '3-6-months', label: '3–6 months' },
  { value: '6-12-months', label: '6–12 months' },
  { value: '12-plus-months', label: '12+ months' },
]

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'tr', label: 'Turkish' },
  { value: 'ar', label: 'Arabic' },
  { value: 'de', label: 'German' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'ru', label: 'Russian' },
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

function DisplayRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-border/60">
      <span className="text-muted-foreground shrink-0 w-5 flex justify-center">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-foreground">{label}</p>
        {value
          ? <p className="text-base text-foreground mt-0.5">{value}</p>
          : <p className="text-base text-muted-foreground italic mt-0.5">Not provided</p>}
      </div>
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
  email: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  ),
  name: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  ),
  gender: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75s.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
    </svg>
  ),
  phone: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  ),
  birthday: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-1.5-.75m16.5 0v-2.625A2.625 2.625 0 0019.5 13.5h-15A2.625 2.625 0 002.25 16.125v2.625" />
    </svg>
  ),
  location: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  ),
  whatsapp: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  budget: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  ),
  timeline: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  language: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
    </svg>
  ),
}

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-base text-muted-foreground placeholder:text-muted-foreground/40 focus:border-[#17375B] focus:outline-none transition-colors'
const selectClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-base text-muted-foreground focus:border-[#17375B] focus:outline-none transition-colors'

export default function ProfilePersonalInfo() {
  const { profile } = useAuth()
  const [form, setForm] = useState<QualData>({
    country: null, budgetTier: null, timeline: null,
    whatsApp: null, preferredLanguage: null,
    firstName: null, lastName: null, email: null, gender: null, birthday: null,
  })
  const [loading, setLoading] = useState(true)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/profile/qualification')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data
          const parts = (d.fullName ?? '').trim().split(/\s+/).filter(Boolean)
          setForm({
            ...d,
            firstName: parts[0] ?? null,
            lastName: parts.length > 1 ? parts.slice(1).join(' ') : null,
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }, [])

  const doSave = async (data: QualData) => {
    setSaveState('saving')
    try {
      const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ') || undefined
      const payload: QualificationPayload = {
        gender: data.gender ?? undefined,
        birthday: data.birthday ?? undefined,
        country: data.country ?? undefined,
        budgetTier: data.budgetTier ?? undefined,
        timeline: data.timeline ?? undefined,
        fullName,
        email: data.email ?? profile?.email ?? undefined,
        whatsApp: data.whatsApp ?? undefined,
        preferredLanguage: data.preferredLanguage ?? undefined,
      }
      const res = await fetch('/api/profile/qualification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  const set = (field: keyof QualData, value: string) => {
    const newForm = { ...form, [field]: value || null }
    setForm(newForm)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaveError(null)
    setSaveState('pending')
    saveTimerRef.current = setTimeout(() => doSave(newForm), 800)
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-8 bg-muted rounded-xl w-40" />
        <div className="bg-card rounded-2xl border border-border h-72" />
        <div className="bg-card rounded-2xl border border-border h-64" />
      </div>
    )
  }

  return (
    <div>
      <h1 className={`${merriweather.className} text-2xl font-bold text-foreground mb-6`}>Personal info</h1>

      <div className="space-y-4">

        {/* ── Personal info card ── */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <CardHeader title="Personal info" saveState={saveState} saveError={saveError} />

          <DisplayRow icon={icons.email} label="Email" value={profile?.email} />

          <Row icon={icons.name} label="First name">
            <input
              className={inputClass}
              value={form.firstName ?? ''}
              onChange={(e) => set('firstName', e.target.value)}
              placeholder="First name"
              autoComplete="given-name"
            />
          </Row>
          <Row icon={icons.name} label="Last name">
            <input
              className={inputClass}
              value={form.lastName ?? ''}
              onChange={(e) => set('lastName', e.target.value)}
              placeholder="Last name"
              autoComplete="family-name"
            />
          </Row>
          <Row icon={icons.gender} label="Gender">
            <select className={selectClass} value={form.gender ?? ''} onChange={(e) => set('gender', e.target.value)}>
              <option value="">Select gender</option>
              {GENDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Row>
          <Row icon={icons.whatsapp} label="WhatsApp number">
            <input
              className={inputClass}
              value={form.whatsApp ?? ''}
              onChange={(e) => set('whatsApp', e.target.value)}
              placeholder="+44 7700 000000"
              type="tel"
              autoComplete="tel"
            />
            {form.whatsApp && !/^\+?[\d\s\-().]{7,20}$/.test(form.whatsApp) && (
              <p className="text-sm text-red-500 mt-1">Please enter a valid phone number (e.g. +44 7700 000000)</p>
            )}
          </Row>
          <Row icon={icons.birthday} label="Birthday">
            <input
              type="date"
              className={inputClass}
              value={form.birthday ?? ''}
              onChange={(e) => set('birthday', e.target.value)}
            />
          </Row>
          <Row icon={icons.location} label="Country / Location">
            <input
              className={inputClass}
              value={form.country ?? ''}
              onChange={(e) => set('country', e.target.value)}
              placeholder="e.g. United Kingdom"
            />
          </Row>
          <Row icon={icons.language} label="Preferred language">
            <select className={selectClass} value={form.preferredLanguage ?? ''} onChange={(e) => set('preferredLanguage', e.target.value)}>
              <option value="">Select language</option>
              {LANGUAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Row>
        </div>

        {/* ── Treatment preferences card ── */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <CardHeader title="Treatment preferences" saveState={saveState} saveError={saveError} />

          <Row icon={icons.budget} label="Budget range">
            <select className={selectClass} value={form.budgetTier ?? ''} onChange={(e) => set('budgetTier', e.target.value)}>
              <option value="">Select budget</option>
              {BUDGET_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Row>
          <Row icon={icons.timeline} label="Treatment timeline">
            <select className={selectClass} value={form.timeline ?? ''} onChange={(e) => set('timeline', e.target.value)}>
              <option value="">Select timeline</option>
              {TIMELINE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Row>
        </div>

      </div>
    </div>
  )
}
