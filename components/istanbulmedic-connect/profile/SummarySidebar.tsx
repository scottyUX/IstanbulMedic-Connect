"use client"

import { useState } from "react"
import { Plus, Bookmark, Share2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { FeeLineItem } from "@/components/ui/fee-line-item"
import { IconActionLink } from "@/components/ui/icon-action-link"
import { PriceRatingBlock } from "@/components/ui/price-rating-block"
import { VerificationBadge } from "@/components/ui/verification-badge"
import { CONSULTATION_LINK } from "@/lib/constants"

interface SummarySidebarProps {
  transparencyScore: number
  topSpecialties: string[]
  rating: number | null
  reviewCount: number
  priceEstimate?: string
  consultationFee?: string
  serviceCharge?: string
  totalEstimate?: string
  bookConsultationHref?: string
  onBookConsultation?: () => void
  onTalkToLeila?: () => void
  onAddToCompare?: () => void
  onSave?: () => void
  onShare?: () => void
}

export const SummarySidebar = ({
  transparencyScore,
  topSpecialties,
  rating,
  reviewCount,
  priceEstimate = "$1,200",
  consultationFee = "$0",
  serviceCharge = "$0",
  totalEstimate = "$1,200",
  bookConsultationHref = CONSULTATION_LINK,
  onBookConsultation,
  onTalkToLeila,
  onAddToCompare,
  onSave,
  onShare,
}: SummarySidebarProps) => {
  const [feeModalOpen, setFeeModalOpen] = useState<"consultation" | "service" | null>(null)

  return (
    <div className="sticky top-24">
      <Card variant="sidebar">
        <CardHeader className="pb-6">
          <PriceRatingBlock
            price={priceEstimate}
            priceLabel="est. starting"
            rating={rating}
            reviewCount={reviewCount}
            reviewsHref="#reviews"
          />
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <Button
              variant="teal-primary"
              size="xl"
              className="w-full font-medium"
              href={bookConsultationHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onBookConsultation}
            >
              Book Consultation
            </Button>

            <Button
              variant="leila-link"
              className="w-full font-medium text-base"
              href="/leila"
              onClick={onTalkToLeila}
            >
              Talk to Leila
            </Button>
          </div>

          <div className="mt-6 pt-4">
            <Separator className="mb-4" />
            <FeeLineItem
              label="Consultation fee"
              value={consultationFee}
              onLabelClick={() => setFeeModalOpen("consultation")}
            />
            <FeeLineItem
              label="Service charge"
              value={serviceCharge}
              onLabelClick={() => setFeeModalOpen("service")}
            />
            <FeeLineItem
              label="Total (estimate)"
              value={totalEstimate}
              prominent
            />
          </div>
        </CardContent>
      </Card>

      <VerificationBadge label="Verified by Istanbul Medic" className="mt-6" />

      <div className="mt-6 space-y-3">
        <IconActionLink icon={<Plus className="h-4 w-4" />} onClick={onAddToCompare}>
          Add to Compare
        </IconActionLink>
        <IconActionLink icon={<Bookmark className="h-4 w-4" />} onClick={onSave}>
          Save Clinic
        </IconActionLink>
        <IconActionLink icon={<Share2 className="h-4 w-4" />} onClick={onShare}>
          Share
        </IconActionLink>
      </div>

      <Dialog
        open={feeModalOpen !== null}
        onOpenChange={(open) => !open && setFeeModalOpen(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0">
            <DialogTitle>
              {feeModalOpen === "consultation" ? "Consultation fee" : "Service charge"}
            </DialogTitle>
            <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <X className="h-4 w-4" aria-hidden />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>
          <div className="text-sm text-muted-foreground space-y-4 pt-2">
            {feeModalOpen === "consultation" && (
              <>
                <p>
                  The consultation fee covers your initial video or in-person appointment with the clinic&apos;s medical team. This is a one-time charge to discuss your goals, assess eligibility, and receive a personalized treatment plan and price quote.
                </p>
                <p>
                  Many clinics offer free consultations as part of their patient care. The amount shown reflects this specific clinic&apos;s policy.
                </p>
              </>
            )}
            {feeModalOpen === "service" && (
              <>
                <p>
                  The service charge covers Istanbul Medic&apos;s coordination and support services, including assistance with scheduling, logistics, translation, and patient advocacy throughout your medical journey.
                </p>
                <p>
                  This fee helps us maintain our verification standards, clinic network, and dedicated care team to ensure you receive quality support from inquiry to recovery.
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
