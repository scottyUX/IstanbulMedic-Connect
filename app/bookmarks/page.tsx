"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MapPin, Star, Bookmark, Check, Trash2 } from "lucide-react"
import { Merriweather } from "next/font/google"

import { useAuth } from "@/contexts/AuthContext"
import { useBookmarkCount } from "@/contexts/BookmarkCountContext"
import { Button } from "@/components/ui/button"
import Container from "@/components/ui/container"
import { cn } from "@/lib/utils"
import { ConsultationConfirmModal } from "@/components/istanbulmedic-connect/ConsultationConfirmModal"

const merriweather = Merriweather({ subsets: ["latin"], weight: ["700"] })

const LS_KEY = 'im.bookmarks'

interface BookmarkedClinic {
  bookmarkId: string
  clinicId: string
  name: string
  location: string
  image: string | null
  rating: number | null
  reviewCount: number
  consultationRequested: boolean
}

export default function BookmarksPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { removeId } = useBookmarkCount()
  const router = useRouter()
  const [clinics, setClinics] = useState<BookmarkedClinic[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [bulkSubmitting, setBulkSubmitting] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<BookmarkedClinic | null>(null)
  const [consultTarget, setConsultTarget] = useState<BookmarkedClinic | null>(null)
  const [emailWarning, setEmailWarning] = useState(false)

  const fetchBookmarks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/bookmarks")
      if (!res.ok) return
      const data = await res.json()
      setClinics(data.bookmarks ?? [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchGuestBookmarks = useCallback(async () => {
    setLoading(true)
    try {
      const ids: string[] = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]')
      if (ids.length === 0) { setClinics([]); return }
      const res = await fetch('/api/bookmarks/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicIds: ids }),
      })
      if (!res.ok) return
      const data = await res.json()
      setClinics(data.bookmarks ?? [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (isAuthenticated) fetchBookmarks()
    else fetchGuestBookmarks()
  }, [isAuthenticated, authLoading, fetchBookmarks, fetchGuestBookmarks])

  const handleRemove = async () => {
    if (!removeTarget) return
    const { clinicId } = removeTarget
    setClinics((prev) => prev.filter((c) => c.clinicId !== clinicId))
    setSelected((prev) => { const s = new Set(prev); s.delete(clinicId); return s })
    removeId(clinicId)
    setRemoveTarget(null)
    if (!isAuthenticated) return
    try {
      const res = await fetch("/api/bookmarks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicId }),
      })
      if (!res.ok) fetchBookmarks()
    } catch {
      fetchBookmarks()
    }
  }

  const handleRequestOne = async () => {
    if (!consultTarget) return
    const clinic = consultTarget
    const res = await fetch("/api/consultations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clinicIds: [clinic.clinicId] }),
    })
    if (!res.ok) throw new Error('request failed')
    const data = await res.json()
    setClinics((prev) =>
      prev.map((c) => c.clinicId === clinic.clinicId ? { ...c, consultationRequested: true } : c)
    )
    if (!data.emailSent) setEmailWarning(true)
  }

  const handleBulkRequest = async () => {
    setBulkSubmitting(true)
    const ids = Array.from(selected)
    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicIds: ids }),
      })
      if (!res.ok) throw new Error('request failed')
      const data = await res.json()
      setClinics((prev) =>
        prev.map((c) => ids.includes(c.clinicId) ? { ...c, consultationRequested: true } : c)
      )
      if (!data.emailSent) setEmailWarning(true)
      setSelected(new Set())
    } catch {
      // leave UI unchanged — user can retry
    } finally {
      setBulkSubmitting(false)
    }
  }

  const toggleSelect = (clinicId: string) => {
    setSelected((prev) => {
      const s = new Set(prev)
      if (s.has(clinicId)) s.delete(clinicId)
      else s.add(clinicId)
      return s
    })
  }

  const sortedClinics = useMemo<BookmarkedClinic[]>(
    () => [...clinics].sort((a, b) => Number(a.consultationRequested) - Number(b.consultationRequested)),
    [clinics]
  )
  const selectableIds = clinics.filter((c) => !c.consultationRequested).map((c) => c.clinicId)
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id))
  const toggleAll = () => {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(selectableIds))
  }

  if (authLoading || loading) {
    return (
      <Container className="py-20">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </Container>
    )
  }

  return (
    <Container className="py-12">
      {emailWarning && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your consultation request was saved, but we had trouble sending the notification. Our team will be in touch within 24 hours.
        </div>
      )}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className={cn(merriweather.className, "text-3xl font-bold text-[#0D1E32]")}>
            Saved Clinics
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {clinics.length === 0
              ? "You haven't saved any clinics yet."
              : `${clinics.length} saved clinic${clinics.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {selected.size > 0 && (
          <Button
            variant="teal-primary"
            onClick={() => {
              if (isAuthenticated) {
                setBulkModalOpen(true)
              } else {
                sessionStorage.setItem('consultation_intent', JSON.stringify(Array.from(selected)))
                document.cookie = `auth_redirect_next=${encodeURIComponent('/profile?section=consultations')}; path=/; max-age=300`
                router.push(`/auth/login?next=${encodeURIComponent('/profile?section=consultations')}`)
              }
            }}
            disabled={bulkSubmitting}
            className="shrink-0"
          >
            Request Consultation ({selected.size})
          </Button>
        )}
      </div>

      {clinics.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-20 text-center">
          <Bookmark className="mx-auto mb-4 h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">No saved clinics yet</p>
          <p className="mt-1 text-xs text-slate-400">
            Bookmark clinics while browsing to save them here.
          </p>
          <Link
            href="/clinics"
            className="mt-5 inline-block text-sm font-semibold text-[#3EBBB7] hover:underline"
          >
            Browse clinics
          </Link>
        </div>
      ) : (
        <>
          {selectableIds.length > 1 && (
            <div className="mb-4 flex items-center gap-2">
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs font-medium text-[#3EBBB7] hover:underline"
              >
                {allSelected ? "Deselect all" : "Select all"}
              </button>
              {selected.size > 0 && (
                <span className="text-xs text-slate-400">
                  {selected.size} selected
                </span>
              )}
            </div>
          )}

          <ul className="space-y-3">
            {sortedClinics.map((clinic) => (
              <li
                key={clinic.clinicId}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                {/* Select checkbox (only for unrequested) */}
                {!clinic.consultationRequested && (
                  <input
                    type="checkbox"
                    checked={selected.has(clinic.clinicId)}
                    onChange={() => toggleSelect(clinic.clinicId)}
                    className="h-4 w-4 shrink-0 rounded border-slate-300 accent-[#3EBBB7]"
                    aria-label={`Select ${clinic.name}`}
                  />
                )}

                {/* Clinic image */}
                <Link href={`/clinics/${clinic.clinicId}`} className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  {clinic.image ? (
                    <Image src={clinic.image} alt={clinic.name} fill sizes="56px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-300">
                      No img
                    </div>
                  )}
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/clinics/${clinic.clinicId}`} className="font-semibold text-[#0D1E32] hover:text-[#3EBBB7] transition-colors truncate block">
                    {clinic.name}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {clinic.location}
                    </span>
                    {clinic.rating != null && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Star className="h-3 w-3 fill-current text-[#FFD700]" />
                        {clinic.rating.toFixed(1)}
                        {clinic.reviewCount > 0 && (
                          <span className="text-slate-400/70">({clinic.reviewCount.toLocaleString()})</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-3">
                  {clinic.consultationRequested ? (
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-[#3EBBB7]" />
                        Requested
                      </span>
                      <Link
                        href="/profile?section=consultations"
                        className="text-[10px] text-slate-400 hover:text-[#3EBBB7] hover:underline transition-colors"
                      >
                        Manage →
                      </Link>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (isAuthenticated) {
                          setConsultTarget(clinic)
                        } else {
                          sessionStorage.setItem('consultation_intent', JSON.stringify([clinic.clinicId]))
                          document.cookie = `auth_redirect_next=${encodeURIComponent('/profile?section=consultations')}; path=/; max-age=300`
                          router.push(`/auth/login?next=${encodeURIComponent('/profile?section=consultations')}`)
                        }
                      }}
                      className="text-xs font-medium text-[#3EBBB7] hover:underline underline-offset-2"
                    >
                      {isAuthenticated ? "Request Consultation" : "Sign in to request"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setRemoveTarget(clinic)}
                    aria-label={`Remove ${clinic.name} from bookmarks`}
                    className="text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Individual consultation request modal */}
      <ConsultationConfirmModal
        open={consultTarget !== null}
        onOpenChange={(open) => { if (!open) setConsultTarget(null) }}
        clinicName={consultTarget?.name ?? ""}
        isRemoving={false}
        onConfirm={handleRequestOne}
      />

      {/* Remove bookmark modal */}
      <ConsultationConfirmModal
        open={removeTarget !== null}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        clinicName={removeTarget?.name ?? ""}
        isRemoving={true}
        onConfirm={handleRemove}
      />

      {/* Bulk request modal */}
      <ConsultationConfirmModal
        open={bulkModalOpen}
        onOpenChange={(open) => { if (!open) setBulkModalOpen(false) }}
        clinicName={`${selected.size} clinic${selected.size !== 1 ? "s" : ""}`}
        isRemoving={false}
        onConfirm={handleBulkRequest}
      />
    </Container>
  )
}
