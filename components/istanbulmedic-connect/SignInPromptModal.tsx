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

interface SignInPromptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSignIn: () => void
}

export function SignInPromptModal({ open, onOpenChange, onSignIn }: SignInPromptModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0">
          <DialogTitle>Sign in to save clinics</DialogTitle>
          <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <X className="h-4 w-4" aria-hidden />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <p className="text-sm text-muted-foreground pt-2">
          Sign in to bookmark clinics and access them from any device. Your selection will be saved automatically once you sign in.
        </p>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="teal-primary" className="flex-1" onClick={onSignIn}>
            Sign In
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
