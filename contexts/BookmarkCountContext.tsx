"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"

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

  // Re-fetch the full bookmark list whenever auth state changes.
  // On logout this clears the set; on login it populates it.
  useEffect(() => {
    if (!isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBookmarkedIds(new Set())
      return
    }
    fetch("/api/bookmarks")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.bookmarks) {
          setBookmarkedIds(new Set(data.bookmarks.map((b: { clinicId: string }) => b.clinicId)))
        }
      })
      .catch(() => {})
  }, [isAuthenticated])

  const addId = useCallback((clinicId: string) => {
    setBookmarkedIds((prev) => new Set(prev).add(clinicId))
  }, [])

  const removeId = useCallback((clinicId: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev)
      next.delete(clinicId)
      return next
    })
  }, [])

  return (
    <BookmarkCountContext.Provider
      value={{ count: bookmarkedIds.size, bookmarkedIds, addId, removeId }}
    >
      {children}
    </BookmarkCountContext.Provider>
  )
}

export const useBookmarkCount = () => useContext(BookmarkCountContext)
