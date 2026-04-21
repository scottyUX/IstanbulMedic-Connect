'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Merriweather } from 'next/font/google'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import type { DashboardSection } from '../ProfileDashboard'

interface PhotoEntry {
  view: string
  previewUrl: string
  file?: File
  storagePath?: string
}

const PHOTO_VIEW_LABELS: Record<string, string> = {
  front: 'Front',
  left_side: 'Left side',
  right_side: 'Right side',
  top: 'Top / Crown',
  donor_area: 'Donor area',
}

const ALL_PHOTO_VIEWS = ['front', 'left_side', 'right_side', 'top', 'donor_area']

const merriweather = Merriweather({ subsets: ['latin'], weight: ['400', '700'], display: 'swap' })

interface Props {
  onNavigate: (section: DashboardSection) => void
}

const CARDS: {
  id: DashboardSection
  title: string
  description: string
  bullets: string[]
  icon: React.ReactNode
  comingSoon?: boolean
}[] = [
  {
    id: 'personal-info',
    title: 'Personal info',
    description: 'Your contact details, location, and treatment preferences.',
    bullets: ['Name & contact details', 'Country & language', 'Budget & timeline'],
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    id: 'medical-history',
    title: 'Medical history',
    description: 'Prior transplants, surgeries, allergies, and medications.',
    bullets: ['Prior hair transplants', 'Allergies & medications', 'Surgical history'],
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    id: 'hair-loss-status',
    title: 'Hair loss status',
    description: 'Norwood scale, donor area assessment, and your photo uploads.',
    bullets: ['Norwood classification', 'Donor area details', 'Photo uploads (5 views)'],
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    id: 'consultations',
    title: 'Consultations',
    description: 'Book and manage consultations with clinics.',
    bullets: ['Clinic shortlisting', 'Schedule consultations', 'Manage bookings'],
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
    comingSoon: true,
  },
]

export default function ProfileHome({ onNavigate }: Props) {
  const { profile, user, loading } = useAuth()
  const [photos, setPhotos] = useState<PhotoEntry[]>([])
  const [uploadingView, setUploadingView] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [photoLoadError, setPhotoLoadError] = useState(false)

  const photosRef = useRef(photos)
  photosRef.current = photos
  useEffect(() => () => { photosRef.current.forEach((p) => { if (p.file) URL.revokeObjectURL(p.previewUrl) }) }, [])

  useEffect(() => {
    fetch('/api/profile/photos')
      .then((r) => r.json())
      .then((photoRes) => {
        const raw = Array.isArray(photoRes) ? photoRes : (photoRes.data ?? [])
        setPhotos(raw.map((p: { photo_view: string; storage_url: string }) => {
          const pathMatch = p.storage_url.match(/\/user-photos\/(.+)$/)
          return { view: p.photo_view, previewUrl: p.storage_url, storagePath: pathMatch?.[1] }
        }))
      })
      .catch(() => setPhotoLoadError(true))
  }, [])

  const handlePhotoSelect = useCallback(async (view: string, file: File) => {
    setUploadError(null)
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError('Only JPEG, PNG, or WebP images are accepted.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image must be under 10 MB.')
      return
    }
    setUploadingView(view)
    try {
      const supabase = createClient()
      if (!supabase) throw new Error('Storage unavailable.')
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) throw new Error('Not signed in.')

      const old = photosRef.current.find((p) => p.view === view)
      if (old?.storagePath) {
        await supabase.storage.from('user-photos').remove([old.storagePath])
        if (old.file) URL.revokeObjectURL(old.previewUrl)
      }

      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${authUser.id}/${view}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('user-photos')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadErr) throw uploadErr

      const { data: urlData } = supabase.storage.from('user-photos').getPublicUrl(path)

      await fetch('/api/profile/treatment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photos: [{ view, storageUrl: urlData.publicUrl, fileSizeBytes: file.size, mimeType: file.type }],
        }),
      })

      setPhotos((prev) => [
        ...prev.filter((p) => p.view !== view),
        { view, previewUrl: urlData.publicUrl, storagePath: path },
      ])
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setUploadingView(null)
    }
  }, [])

  const handlePhotoDelete = useCallback(async (view: string) => {
    const photo = photosRef.current.find((p) => p.view === view)
    if (!photo) return
    if (photo.file) URL.revokeObjectURL(photo.previewUrl)
    setPhotos((prev) => prev.filter((p) => p.view !== view))
    if (photo.storagePath) {
      const supabase = createClient()
      supabase?.storage.from('user-photos').remove([photo.storagePath])
    }
    await fetch('/api/profile/photos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ view }),
    })
  }, [])

  const photoMap = Object.fromEntries(photos.map((p) => [p.view, p.previewUrl]))

  const displayName =
    profile?.given_name || profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  const initials =
    ((profile?.given_name?.[0] ?? '') + (profile?.family_name?.[0] ?? '')).toUpperCase() ||
    displayName[0]?.toUpperCase() ||
    'U'

  return (
    <div className="space-y-5">
      {/* ── Welcome banner ── */}
      {loading ? (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-8 py-7 animate-pulse">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-slate-200 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-3 bg-slate-200 rounded w-20" />
              <div className="h-5 bg-slate-200 rounded w-48" />
              <div className="h-3 bg-slate-100 rounded w-56" />
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ background: '#eef8f8', borderColor: 'rgba(62,187,183,0.25)' }}>
          <div className="px-8 py-7 flex items-center gap-5">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={displayName}
                width={56}
                height={56}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-full object-cover shrink-0"
                style={{ boxShadow: '0 0 0 3px rgba(62,187,183,0.2)' }}
              />
            ) : (
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-semibold shrink-0 select-none"
                style={{ background: '#17375B' }}
              >
                {initials}
              </div>
            )}
            <div>
              <p className="text-xs font-medium tracking-widest uppercase mb-0.5" style={{ color: '#3EBBB7' }}>
                Your profile
              </p>
              <h1 className={`${merriweather.className} text-2xl font-bold text-[#0D1E32] leading-snug`}>
                Welcome back, {displayName}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage your hair transplant treatment profile
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Hair photos + sections ── */}
      <h2 className={`${merriweather.className} text-lg font-bold text-[#0D1E32]`}>Your profile</h2>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between" style={{ background: 'rgba(62,187,183,0.06)' }}>
          <div>
            <h2 className="text-sm font-semibold text-[#0D1E32]">Hair photos</h2>
            <p className="text-xs text-slate-500 mt-0.5">Upload all 5 views so clinics can assess your case</p>
          </div>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: photos.length === 5 ? 'rgba(62,187,183,0.12)' : 'rgba(23,55,91,0.07)',
              color: photos.length === 5 ? '#3EBBB7' : '#17375B',
            }}
          >
            {photos.length}/5 uploaded
          </span>
        </div>

        {photoLoadError && (
          <div className="mx-6 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
            <p className="text-sm text-amber-700">Could not load your photos. Please refresh to try again.</p>
          </div>
        )}

        {uploadError && (
          <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
            <p className="text-sm text-red-600">{uploadError}</p>
          </div>
        )}

        <div className="px-6 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {ALL_PHOTO_VIEWS.map((view) => {
              const url = photoMap[view]
              const isUploading = uploadingView === view
              return (
                <div key={view} className="flex flex-col gap-1.5">
                  <label className="cursor-pointer group">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={isUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handlePhotoSelect(view, file)
                        e.target.value = ''
                      }}
                    />
                    <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-dashed border-slate-200 group-hover:border-[#17375B] bg-slate-50 transition-colors" style={url ? { borderStyle: 'solid', borderColor: 'rgba(62,187,183,0.4)', background: 'transparent' } : {}}>
                      {isUploading ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-5 h-5 animate-spin text-[#3EBBB7]" fill="none" viewBox="0 0 24 24" role="status" aria-label="Uploading photo">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        </div>
                      ) : url ? (
                        <Image src={url} alt={PHOTO_VIEW_LABELS[view]} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 group-hover:text-[#17375B] transition-colors">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </label>
                  <p className="text-xs text-center text-slate-400">{PHOTO_VIEW_LABELS[view]}</p>
                  {url && (
                    <button
                      type="button"
                      onClick={() => handlePhotoDelete(view)}
                      className="text-xs text-center text-red-400 hover:text-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-xs mt-4 text-slate-400">JPEG, PNG or WebP · Max 10 MB per photo</p>
        </div>
      </div>

      {/* ── Profile sections ── */}
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CARDS.map((card) => {
            const isComingSoon = card.comingSoon === true
            return (
              <button
                key={card.id}
                onClick={() => onNavigate(card.id)}
                className="text-left bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:border-[#3EBBB7]/50 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#17375B]/[0.06] flex items-center justify-center text-[#17375B] group-hover:bg-[#3EBBB7]/10 group-hover:text-[#3EBBB7] transition-colors">
                    {card.icon}
                  </div>
                  {isComingSoon && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: 'rgba(160,83,119,0.08)', color: '#A05377' }}>
                      Coming soon
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-[#0D1E32] mb-1">{card.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{card.description}</p>
                <div className="mt-3 flex items-center gap-1 text-sm font-medium text-[#17375B] group-hover:text-[#3EBBB7] transition-colors">
                  View & edit
                  <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </button>
            )
          })}
        </div>
      </div>

    </div>
  )
}
