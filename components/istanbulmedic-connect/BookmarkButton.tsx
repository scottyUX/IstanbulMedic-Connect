"use client"

import { useEffect, useState } from "react"
import { Bookmark } from "lucide-react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/contexts/AuthContext"
import { useBookmarkCount } from "@/contexts/BookmarkCountContext"
import { cn } from "@/lib/utils"
import { SignInPromptModal } from "@/components/istanbulmedic-connect/SignInPromptModal"

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
  const [showSignInPrompt, setShowSignInPrompt] = useState(false)
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  // After returning from sign-in, auto-bookmark if this clinic was the intent
  useEffect(() => {
    if (!isAuthenticated) return
    const intent = sessionStorage.getItem('bookmark_intent')
    if (intent !== clinicId) return
    sessionStorage.removeItem('bookmark_intent')
    setLoading(true)
    addId(clinicId)
    fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clinicId }),
    })
      .then((res) => { if (!res.ok) removeId(clinicId) })
      .catch(() => removeId(clinicId))
      .finally(() => setLoading(false))
  }, [isAuthenticated, clinicId, addId, removeId])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isAuthenticated) {
      setShowSignInPrompt(true)
      return
    }
    if (bookmarked) {
      handleRemove()
    } else {
      handleAdd()
    }
  }

  const handleSignIn = () => {
    sessionStorage.setItem('bookmark_intent', clinicId)
    router.push(`/auth/login?next=${encodeURIComponent(window.location.pathname)}`)
  }

  const handleAdd = async () => {
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
    <>
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

      <SignInPromptModal
        open={showSignInPrompt}
        onOpenChange={setShowSignInPrompt}
        onSignIn={handleSignIn}
      />
    </>
  )
}
