"use client"

import { useState } from "react"
import { Plus, Share2, X, Globe, Check } from "lucide-react"
import { useRouter } from "next/navigation"

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
import { FEATURE_CONFIG } from "@/lib/filterConfig"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"
import { ConsultationConfirmModal } from "@/components/istanbulmedic-connect/ConsultationConfirmModal"
import { BookmarkButton } from "@/components/istanbulmedic-connect/BookmarkButton"

interface SummarySidebarProps {
  clinicId: string
  clinicName: string
  clinicLocation?: string
  clinicImageUrl?: string | null
  transparencyScore?: number
  topSpecialties?: string[]
  rating: number | null
  reviewCount: number
  websiteUrl?: string | null
  priceEstimate?: string
  consultationFee?: string
  serviceCharge?: string
  totalEstimate?: string
  onTalkToLeila?: () => void
  onAddToCompare?: () => void
  onSave?: () => void
  onShare?: () => void
}

export const SummarySidebar = ({
  clinicId,
  clinicName,
  clinicLocation = "",
  clinicImageUrl,
  rating,
  reviewCount,
  websiteUrl,
  priceEstimate = "$1,200",
  consultationFee = "$0",
  serviceCharge = "$0",
  totalEstimate = "$1,200",
  onTalkToLeila,
  onAddToCompare,
  onShare,
}: SummarySidebarProps) => {
  const [feeModalOpen, setFeeModalOpen] = useState<"consultation" | "service" | null>(null)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [consultationRequested, setConsultationRequested] = useState(false)
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  // suppress unused-var warning — kept for future use
  void clinicLocation
  void clinicImageUrl

  const handleConsultationClick = () => {
    if (!isAuthenticated) {
      document.cookie = `auth_redirect_next=${encodeURIComponent(window.location.pathname)}; path=/; max-age=300`
      router.push("/auth/login")
      return
    }
    if (!consultationRequested) {
      setConfirmModalOpen(true)
    }
  }

  const handleConsultationConfirm = async () => {
    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicIds: [clinicId] }),
      })
      if (!res.ok) throw new Error('request failed')
      setConsultationRequested(true)
    } catch {
      // leave UI unchanged — user can retry
    }
  }

  return (
    <div className="sticky top-24">
      <Card variant="sidebar">
        <CardHeader className="pb-6">
          <PriceRatingBlock
            price={FEATURE_CONFIG.profilePricing ? priceEstimate : undefined}
            priceLabel="est. starting"
            rating={rating}
            reviewCount={reviewCount}
            reviewsHref="#reviews"
          />
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {FEATURE_CONFIG.bookConsultation && (
              consultationRequested ? (
                <div className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-muted-foreground"
                )}>
                  <Check className="h-4 w-4 text-[#3EBBB7]" />
                  Consultation Requested
                </div>
              ) : (
                <Button
                  variant="teal-primary"
                  className="w-full"
                  onClick={handleConsultationClick}
                >
                  Request Free Consultation
                </Button>
              )
            )}

            <Button
              variant="leila-link"
              className="w-full font-medium text-base"
              href="/langchain"
              onClick={onTalkToLeila}
            >
              Talk to Leila
            </Button>

            {FEATURE_CONFIG.bookConsultation && (
              <BookmarkButton
                clinicId={clinicId}
                clinicName={clinicName}
                label="Save Clinic"
                labelSaved="Saved"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-medium hover:border-[#3EBBB7]"
                iconClassName="h-4 w-4"
              />
            )}
          </div>

          {FEATURE_CONFIG.profilePricing && (
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
          )}
        </CardContent>
      </Card>

      {FEATURE_CONFIG.profileTransparency && (
        <VerificationBadge label="Verified by Istanbul Medic" className="mt-6" />
      )}

      <div className="mt-6 space-y-3">
        {FEATURE_CONFIG.compare && (
          <IconActionLink icon={<Plus className="h-4 w-4" />} onClick={onAddToCompare}>
            Add to Compare
          </IconActionLink>
        )}
        {FEATURE_CONFIG.share && (
          <IconActionLink icon={<Share2 className="h-4 w-4" />} onClick={onShare}>
            Share
          </IconActionLink>
        )}
        {websiteUrl && (
          <IconActionLink
            icon={<Globe className="h-4 w-4" />}
            onClick={() => window.open(websiteUrl, "_blank", "noopener,noreferrer")}
          >
            Visit Website
          </IconActionLink>
        )}
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

      <ConsultationConfirmModal
        open={confirmModalOpen}
        onOpenChange={(open) => !open && setConfirmModalOpen(false)}
        clinicName={clinicName}
        isRemoving={false}
        onConfirm={handleConsultationConfirm}
      />
    </div>
  )
}
