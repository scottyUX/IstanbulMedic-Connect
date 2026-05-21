"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"

const LS_KEY = 'im.bookmarks'

function lsAdd(clinicId: string) {
  try {
    const ids: string[] = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]')
    if (!ids.includes(clinicId)) localStorage.setItem(LS_KEY, JSON.stringify([...ids, clinicId]))
  } catch {}
}

function lsRemove(clinicId: string) {
  try {
    const ids: string[] = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]')
    localStorage.setItem(LS_KEY, JSON.stringify(ids.filter((id) => id !== clinicId)))
  } catch {}
}

function lsLoad(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

interface BookmarkCountContextValue {
  count: number
  bookmarkedIds: Set<string>
  addId: (clinicId: string) => void
  removeId: (clinicId: string) => void
}

const BookmarkCountContext = createContext<BookmarkCountContextValue>({
  count: 0,
  bookmarkedIds: new Set(),
  addId: () => {},
  removeId: () => {},
})

export function BookmarkCountProvider({ children }: { children: React.ReactNode }) {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      setBookmarkedIds(lsLoad())
      return
    }
    // Seed from LS optimistically so UI reflects locally-saved clinics
    // immediately after sign-in while the API call is still in flight.
    const local = lsLoad()
    if (local.size > 0) setBookmarkedIds(local)
    fetch("/api/bookmarks")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.bookmarks) {
          const apiIds = new Set<string>(data.bookmarks.map((b: { clinicId: string }) => b.clinicId))
          // Merge with LS in case syncLocalBookmarks is still in flight when
          // this response arrives — avoids a stale count replacing the LS seed.
          setBookmarkedIds(new Set<string>([...apiIds, ...lsLoad()]))
        }
      })
      .catch(() => {})
  }, [isAuthenticated])

  const addId = useCallback((clinicId: string) => {
    setBookmarkedIds((prev) => new Set(prev).add(clinicId))
    if (!isAuthenticated) lsAdd(clinicId)
  }, [isAuthenticated])

  const removeId = useCallback((clinicId: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev)
      next.delete(clinicId)
      return next
    })
    if (!isAuthenticated) lsRemove(clinicId)
  }, [isAuthenticated])

  return (
    <BookmarkCountContext.Provider
      value={{ count: bookmarkedIds.size, bookmarkedIds, addId, removeId }}
    >
      {children}
    </BookmarkCountContext.Provider>
  )
}

export const useBookmarkCount = () => useContext(BookmarkCountContext)
