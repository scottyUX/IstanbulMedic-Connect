"use client"

import { ArrowLeft, MapPin, Star } from "lucide-react"
import { Merriweather } from "next/font/google"

import { Button } from "@/components/ui/button"
import { StarBar } from "@/components/ui/star-bar"
import { cn } from "@/lib/utils"
import type { ClinicListItem } from "@/lib/api/clinics"
import { useClinicCompareSignals, type GoogleReview } from "./useClinicCompareSignals"

const merriweather = Merriweather({ subsets: ["latin"], weight: ["700"] })

interface GooglePlacesViewProps {
  clinic: ClinicListItem
  onDeselect: () => void
  accentClass: string
}


function formatReviewDate(date: string | null) {
  if (!date) return "Recent"
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

function ReviewCard({ review }: { review: GoogleReview }) {
  return (
    <li className="rounded-xl border border-border/60 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "h-3.5 w-3.5",
                review.rating != null && star <= review.rating
                  ? "fill-[#FFD700] text-[#FFD700]"
                  : "text-muted-foreground/30"
              )}
            />
          ))}
        </div>
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {formatReviewDate(review.date)}
        </span>
      </div>
      <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-foreground">
        {review.text || "No written review provided."}
      </p>
      {review.sourceName && (
        <p className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">
          {review.sourceName.replace(/_/g, " ")}
        </p>
      )}
    </li>
  )
}

export function GooglePlacesView({ clinic, onDeselect, accentClass }: GooglePlacesViewProps) {
  const { data: signals, loading } = useClinicCompareSignals(clinic.id)
  const googlePlaces = signals?.googlePlaces
  const starCounts = googlePlaces?.starCounts ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  const storedReviewTotal = Object.values(starCounts).reduce((sum, count) => sum + count, 0)
  const recentReviews = googlePlaces?.reviews ?? []

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white border border-border/60 shadow-sm text-lg font-bold">
          <span style={{ background: "linear-gradient(135deg,#4285F4,#EA4335,#FBBC05,#34A853)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>G</span>
        </div>
        <div className="min-w-0">
          <h3 className={cn(merriweather.className, "truncate text-base font-bold leading-snug text-foreground")}>
            {clinic.name}
          </h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {clinic.location}
          </p>
        </div>
      </div>

      {/* Google Score — from clinic_source_scores.summary_score */}
      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Google Score
        </p>
        <div className="flex items-baseline gap-2">
          <span className={cn("text-3xl font-bold tabular-nums", clinic.googleScore != null ? accentClass : "text-muted-foreground/40")}>
            {clinic.googleScore != null ? clinic.googleScore.toFixed(1) : "—"}
          </span>
          <span className="text-sm text-muted-foreground">/ 10</span>
        </div>
      </div>

      {/* Rating summary */}
      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Google Rating
        </p>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className={cn("text-4xl font-bold tabular-nums", accentClass)}>
              {typeof clinic.rating === "number" ? clinic.rating.toFixed(1) : "—"}
            </p>
            <div className="mt-1 flex justify-center gap-0.5">
              {[1, 2, 3, 4, 5].map(n => (
                <Star
                  key={n}
                  className={cn(
                    "h-3.5 w-3.5",
                    typeof clinic.rating === "number" && n <= Math.round(clinic.rating)
                      ? "fill-[#FFD700] text-[#FFD700]"
                      : "text-muted-foreground/30"
                  )}
                />
              ))}
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {clinic.reviewCount ? `${clinic.reviewCount.toLocaleString()} reviews` : "No reviews"}
            </p>
          </div>
          <div className="flex-1 space-y-1">
            {loading ? (
              <p className="text-xs text-muted-foreground">Loading review breakdown...</p>
            ) : (
              <>
                <StarBar stars={5} count={starCounts[5]} total={storedReviewTotal} />
                <StarBar stars={4} count={starCounts[4]} total={storedReviewTotal} />
                <StarBar stars={3} count={starCounts[3]} total={storedReviewTotal} />
                <StarBar stars={2} count={starCounts[2]} total={storedReviewTotal} />
                <StarBar stars={1} count={starCounts[1]} total={storedReviewTotal} />
              </>
            )}
          </div>
        </div>
        {!loading && (
          <p className="mt-3 text-[10px] text-muted-foreground">
            Breakdown based on {storedReviewTotal.toLocaleString()} stored Google review{storedReviewTotal === 1 ? "" : "s"}.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Most Recent Google Reviews
        </p>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading recent reviews...</p>
        ) : recentReviews.length > 0 ? (
          <ul className="space-y-2">
            {recentReviews.map((review, index) => (
              <ReviewCard key={`${review.date ?? "undated"}-${index}`} review={review} />
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-white/70 p-4 text-center text-sm text-muted-foreground">
            No stored Google review text is available for this clinic yet.
          </div>
        )}
      </div>

      <Button variant="outline" size="sm" onClick={onDeselect} className="w-full shrink-0">
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Change clinic
      </Button>
    </div>
  )
}
