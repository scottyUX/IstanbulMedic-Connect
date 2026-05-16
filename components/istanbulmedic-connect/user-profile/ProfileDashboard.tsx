'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import ProfileHome from './sections/ProfileHome'
import ProfilePersonalInfo from './sections/ProfilePersonalInfo'
import ProfileMedicalHistory from './sections/ProfileMedicalHistory'
import ProfileHairLossStatus from './sections/ProfileHairLossStatus'
import ProfileConsultations from './sections/ProfileConsultations'

export type DashboardSection =
  | 'home'
  | 'personal-info'
  | 'medical-history'
  | 'hair-loss-status'
  | 'consultations'

const NAV: {
  id: DashboardSection
  label: string
  icon: (active: boolean) => React.ReactNode
}[] = [
  {
    id: 'home',
    label: 'Home',
    icon: (active) => (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    id: 'personal-info',
    label: 'Personal info',
    icon: (active) => (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    id: 'medical-history',
    label: 'Medical history',
    icon: (active) => (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    id: 'hair-loss-status',
    label: 'Hair loss status',
    icon: (active) => (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    id: 'consultations',
    label: 'Consultations',
    icon: (active) => (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
  },
]

export default function ProfileDashboard() {
  const [active, setActive] = useState<DashboardSection>('home')
  const { profile, user, loading } = useAuth()

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'instant' : 'smooth' })
  }, [active])

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-80px)]">
        <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white border-r border-slate-200">
          <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100 animate-pulse">
            <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 bg-slate-200 rounded w-24" />
              <div className="h-2.5 bg-slate-100 rounded w-32" />
            </div>
          </div>
          <div className="flex-1 py-3 space-y-1 animate-pulse px-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-10 rounded-lg bg-slate-100" />)}
          </div>
        </aside>
        <main className="flex-1 p-6 animate-pulse space-y-4" style={{ backgroundColor: '#FEFCF8' }}>
          <div className="h-32 rounded-2xl bg-slate-100" />
          <div className="h-8 rounded bg-slate-100 w-32" />
          <div className="h-64 rounded-2xl bg-slate-100" />
        </main>
      </div>
    )
  }

  const displayName =
    profile?.full_name || profile?.given_name || user?.email?.split('@')[0] || 'User'
  const initials =
    ((profile?.given_name?.[0] ?? '') + (profile?.family_name?.[0] ?? '')).toUpperCase() ||
    displayName[0]?.toUpperCase() ||
    'U'

  return (
    <div className="flex min-h-[calc(100vh-80px)]">
      {/* ── Sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white border-r border-slate-200 sticky top-[80px] h-[calc(100vh-80px)] overflow-y-auto">
        {/* User identity strip */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={displayName}
              width={36}
              height={36}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#17375B] flex items-center justify-center text-white text-sm font-semibold shrink-0 select-none">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#0D1E32] truncate">{displayName}</p>
            <p className="text-xs text-slate-400 truncate">{profile?.email || user?.email}</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3" role="tablist" aria-label="Dashboard sections">
          {NAV.map((item) => {
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`section-${item.id}`}
                onClick={() => setActive(item.id)}
                className={`relative flex items-center gap-3 w-full px-5 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#3EBBB7]/10 text-[#3EBBB7]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#17375B]'
                }`}
              >
                {/* Active left border indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-[#3EBBB7]" />
                )}
                <span className={isActive ? 'text-[#3EBBB7]' : 'text-slate-400'}>
                  {item.icon(isActive)}
                </span>
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="px-5 py-4 border-t border-slate-100">
          <p className="text-xs text-slate-400">IstanbulMedic Connect</p>
        </div>
      </aside>

      {/* ── Mobile top tab strip ── */}
      <div className="md:hidden fixed top-[80px] inset-x-0 z-40 bg-white border-b border-slate-200 overflow-x-auto">
        <div className="flex gap-1 px-4 py-2 min-w-max" role="tablist" aria-label="Dashboard sections">
          {NAV.map((item) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={active === item.id}
              aria-controls={`section-${item.id}`}
              onClick={() => setActive(item.id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                active === item.id
                  ? 'bg-[#17375B] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0" style={{ backgroundColor: '#FEFCF8' }}>
        {/* Extra top padding on mobile for the tab strip */}
        <div className="md:pt-0 pt-[52px]">
          <div className="max-w-4xl mx-auto px-6 py-8" id={`section-${active}`} role="tabpanel">
            {active === 'home' && <ProfileHome onNavigate={setActive} />}
            {active === 'personal-info' && <ProfilePersonalInfo />}
            {active === 'medical-history' && <ProfileMedicalHistory />}
            {active === 'hair-loss-status' && <ProfileHairLossStatus />}
            {active === 'consultations' && <ProfileConsultations />}
          </div>
        </div>
      </main>
    </div>
  )
}
