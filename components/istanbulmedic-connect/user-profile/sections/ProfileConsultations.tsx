'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Clock } from 'lucide-react'
import { Merriweather } from 'next/font/google'
import { cn } from '@/lib/utils'

const merriweather = Merriweather({ subsets: ['latin'], weight: ['700'] })

interface Consultation {
  id: string
  status: string
  createdAt: string
  clinicId: string | null
  clinicName: string
  clinicLocation: string
  clinicImage: string | null
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600 border border-amber-200">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function ProfileConsultations() {
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/consultations')
      .then((r) => r.json())
      .then((data) => setConsultations(data.consultations ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h1 className={cn(merriweather.className, 'text-2xl font-bold text-[#0D1E32]')}>
          Consultations
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Your consultation requests with clinics
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : consultations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
          <Clock className="mx-auto mb-4 h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">No consultations yet</p>
          <p className="mt-1 text-xs text-slate-400">
            Request a free consultation from any clinic page or your saved clinics.
          </p>
          <div className="mt-5 flex justify-center gap-4">
            <Link href="/clinics" className="text-sm font-semibold text-[#3EBBB7] hover:underline">
              Browse clinics
            </Link>
            <Link href="/bookmarks" className="text-sm font-semibold text-[#3EBBB7] hover:underline">
              Saved clinics
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Clinic
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:table-cell">
                  Date Submitted
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {consultations.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {c.clinicImage ? (
                          <Image
                            src={c.clinicImage}
                            alt={c.clinicName}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-300">
                            No img
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        {c.clinicId ? (
                          <Link
                            href={`/clinics/${c.clinicId}`}
                            className="font-semibold text-[#0D1E32] hover:text-[#3EBBB7] transition-colors truncate block"
                          >
                            {c.clinicName}
                          </Link>
                        ) : (
                          <span className="font-semibold text-[#0D1E32] truncate block">
                            {c.clinicName}
                          </span>
                        )}
                        {c.clinicLocation && (
                          <span className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {c.clinicLocation}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">
                    {formatDate(c.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
