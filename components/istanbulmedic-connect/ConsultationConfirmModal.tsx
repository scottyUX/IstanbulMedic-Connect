"use client"

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
  onConfirm: () => void
}

export function ConsultationConfirmModal({
  open,
  onOpenChange,
  clinicName,
  isRemoving,
  onConfirm,
}: ConsultationConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0">
          <DialogTitle>
            {isRemoving ? "Remove Bookmark" : "Request Free Consultation"}
          </DialogTitle>
          <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <X className="h-4 w-4" aria-hidden />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <div className="text-sm text-muted-foreground pt-2 space-y-3">
          {isRemoving ? (
            <p>
              Remove <span className="font-semibold text-foreground">{clinicName}</span> from your saved clinics?
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
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant={isRemoving ? "destructive" : "teal-primary"}
            className="flex-1"
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            {isRemoving ? "Remove" : "Request Consultation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
