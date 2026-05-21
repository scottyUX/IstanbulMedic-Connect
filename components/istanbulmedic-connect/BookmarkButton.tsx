"use client"

import { useEffect, useState } from "react"
import { Bookmark } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { useBookmarkCount } from "@/contexts/BookmarkCountContext"
import { cn } from "@/lib/utils"

interface BookmarkButtonProps {
  clinicId: string
  clinicName: string
  className?: string
  iconClassName?: string
  /** Optional text label shown next to the icon */
  label?: string
  /** Label shown when already bookmarked — defaults to label */
  labelSaved?: string
}

export function BookmarkButton({
  clinicId,
  clinicName,
  className,
  iconClassName,
  label,
  labelSaved,
}: BookmarkButtonProps) {
  const { bookmarkedIds, addId, removeId } = useBookmarkCount()
  const bookmarked = bookmarkedIds.has(clinicId)
  const [loading, setLoading] = useState(false)
  const [showGuestTip, setShowGuestTip] = useState(false)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!showGuestTip) return
    const t = setTimeout(() => setShowGuestTip(false), 3000)
    return () => clearTimeout(t)
  }, [showGuestTip])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (bookmarked) {
      handleRemove()
    } else {
      handleAdd()
    }
  }

  const handleAdd = async () => {
    if (!isAuthenticated) {
      addId(clinicId)
      setShowGuestTip(true)
      return
    }
    setLoading(true)
    addId(clinicId)
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicId }),
      })
      if (!res.ok) removeId(clinicId)
    } catch {
      removeId(clinicId)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async () => {
    if (!isAuthenticated) {
      removeId(clinicId)
      return
    }
    setLoading(true)
    removeId(clinicId)
    try {
      const res = await fetch("/api/bookmarks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicId }),
      })
      if (!res.ok) addId(clinicId)
    } catch {
      addId(clinicId)
    } finally {
      setLoading(false)
    }
  }

  const displayLabel = bookmarked ? (labelSaved ?? label) : label

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-label={bookmarked ? `Remove ${clinicName} from bookmarks` : `Bookmark ${clinicName}`}
        className={cn(
          "transition-colors duration-200 disabled:opacity-50",
          bookmarked
            ? "text-[#3EBBB7] hover:text-[#3EBBB7]/60"
            : "text-muted-foreground hover:text-[#3EBBB7]",
          className
        )}
      >
        <Bookmark className={cn("h-4 w-4", bookmarked && "fill-current", iconClassName)} />
        {displayLabel && <span>{displayLabel}</span>}
      </button>

      {showGuestTip && (
        <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-[#0D1E32]/90 px-2 py-0.5 text-[10px] text-white shadow-sm">
          Sign in to save permanently
        </span>
      )}
    </span>
  )
}
