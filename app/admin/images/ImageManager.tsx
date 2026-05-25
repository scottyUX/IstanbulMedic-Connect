'use client'

import { useState } from 'react'
import Image from 'next/image'

type MediaItem = {
  id: string
  url: string
  is_primary: boolean | null
  display_order: number | null
  media_type: string
}

type ClinicWithMedia = {
  id: string
  name: string
  media: MediaItem[]
}

export default function ImageManager({ clinics }: { clinics: ClinicWithMedia[] }) {
  const [state, setState] = useState<Record<string, string | null>>(
    Object.fromEntries(
      clinics.map((c) => [c.id, c.media.find((m) => m.is_primary)?.id ?? null])
    )
  )
  const [loading, setLoading] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filtered = clinics.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  async function setPrimary(clinicId: string, mediaId: string) {
    setLoading(mediaId)
    try {
      const res = await fetch(`/api/clinics/${clinicId}/media`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId }),
      })
      if (!res.ok) throw new Error('Failed')
      setState((prev) => ({ ...prev, [clinicId]: mediaId }))
    } catch {
      alert('Failed to update primary image')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Clinic Primary Images</h1>
        <p className="mb-6 text-sm text-gray-500">
          {clinics.length} clinics with images. Click an image to set it as the primary.
        </p>

        <input
          type="text"
          placeholder="Search clinics..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-8 w-full max-w-sm rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <div className="flex flex-col gap-10">
          {filtered.map((clinic) => {
            const primaryId = state[clinic.id]
            return (
              <div key={clinic.id}>
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="font-semibold text-gray-800">{clinic.name}</h2>
                  <span className="text-xs text-gray-400">{clinic.media.length} images</span>
                  {!primaryId && (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                      no primary set
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  {clinic.media.map((m) => {
                    const isPrimary = primaryId === m.id
                    const isLoading = loading === m.id
                    return (
                      <button
                        key={m.id}
                        onClick={() => !isPrimary && setPrimary(clinic.id, m.id)}
                        disabled={isPrimary || isLoading}
                        className={`group relative h-32 w-32 overflow-hidden rounded-xl border-2 transition-all ${
                          isPrimary
                            ? 'cursor-default border-purple-500 ring-2 ring-purple-300'
                            : 'border-transparent hover:border-purple-300 hover:ring-1 hover:ring-purple-200'
                        }`}
                      >
                        <Image
                          src={m.url}
                          alt=""
                          fill
                          sizes="128px"
                          className="object-cover"
                          unoptimized
                        />
                        {isPrimary && (
                          <div className="absolute inset-x-0 bottom-0 bg-purple-500 py-1 text-center text-xs font-semibold text-white">
                            primary
                          </div>
                        )}
                        {isLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                          </div>
                        )}
                        {!isPrimary && !isLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/20 group-hover:opacity-100">
                            <span className="rounded bg-white px-2 py-1 text-xs font-medium text-gray-800">
                              set primary
                            </span>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <p className="text-sm text-gray-400">No clinics match your search.</p>
          )}
        </div>
      </div>
    </div>
  )
}
