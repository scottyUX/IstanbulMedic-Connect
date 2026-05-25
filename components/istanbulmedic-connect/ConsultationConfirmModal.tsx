"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"

interface ConsultationConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clinicName: string
  isRemoving: boolean
  isCancelling?: boolean
  onConfirm: () => Promise<void>
}

export function ConsultationConfirmModal({
  open,
  onOpenChange,
  clinicName,
  isRemoving,
  isCancelling = false,
  onConfirm,
}: ConsultationConfirmModalProps) {
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = async () => {
    if (isRemoving) {
      onConfirm()
      onOpenChange(false)
      return
    }
    setSubmitting(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch {
      // onConfirm handles its own UI state on failure; we just stop submitting
    } finally {
      setSubmitting(false)
    }
  }

  const title = isRemoving ? "Remove Bookmark" : isCancelling ? "Cancel Request" : "Request Free Consultation"
  const confirmLabel = submitting
    ? isCancelling ? "Cancelling…" : "Requesting…"
    : isRemoving ? "Remove" : isCancelling ? "Cancel Request" : "Request Consultation"
  const dismissLabel = isCancelling ? "Keep Request" : "Cancel"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-sm"
        onEscapeKeyDown={submitting ? (e) => e.preventDefault() : undefined}
        onPointerDownOutside={submitting ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader className="flex flex-row items-center justify-between space-y-0">
          <DialogTitle>{title}</DialogTitle>
          <DialogClose
            disabled={submitting}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-30"
          >
            <X className="h-4 w-4" aria-hidden />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <div className="text-sm text-muted-foreground pt-2 space-y-3">
          {isRemoving ? (
            <p>
              Remove <span className="font-semibold text-foreground">{clinicName}</span> from your saved clinics?
            </p>
          ) : isCancelling ? (
            <p>
              Cancel your consultation request with <span className="font-semibold text-foreground">{clinicName}</span>? The team will be notified.
            </p>
          ) : (
            <>
              <p>
                Request a free consultation with <span className="font-semibold text-foreground">{clinicName}</span>?
              </p>
              <p>
                The Istanbul Medic Connect team will be in touch.
              </p>
            </>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            {dismissLabel}
          </Button>
          <Button
            variant={isRemoving || isCancelling ? "destructive" : "teal-primary"}
            className="flex-1"
            disabled={submitting}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
