"use client"

import { useState } from "react"
import { Star, Trophy } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type ReviewSource,
  REVIEW_SOURCE_ICON,
  REVIEW_SOURCE_LABEL,
} from "@/lib/review-sources"

export interface Review {
  author: string
  rating: number
  date: string
  text: string
  verified: boolean
  source: ReviewSource
}

interface ReviewsSectionProps {
  averageRating: number | null
  totalReviews: number
  reviews: Review[]
}

const REVIEW_TRUNCATE_LENGTH = 250

export const ReviewsSection = ({
  averageRating,
  totalReviews,
  reviews,
}: ReviewsSectionProps) => {
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set())

  // Get unique sources present in reviews
  const uniqueSources = Array.from(new Set(reviews.map(r => r.source)))

  const toggleReviewExpanded = (reviewKey: string) => {
    setExpandedReviews(prev => {
      const next = new Set(prev)
      if (next.has(reviewKey)) {
        next.delete(reviewKey)
      } else {
        next.add(reviewKey)
      }
      return next
    })
  }

  const truncateText = (text: string, key: string) => {
    if (text.length <= REVIEW_TRUNCATE_LENGTH) {
      return { text, isTruncated: false }
    }
    if (expandedReviews.has(key)) {
      return { text, isTruncated: false, canCollapse: true }
    }
    return { text: text.slice(0, REVIEW_TRUNCATE_LENGTH) + "...", isTruncated: true }
  }

  return (
    <div id="reviews" className="py-8 border-t border-border/60 scroll-mt-32">
      {/* Rating Header */}
      <div className="flex flex-col items-center justify-center text-center mb-16 pt-4">
        <div className="flex items-center justify-center mb-4 relative">
          <span className="text-[8rem] font-bold leading-none tracking-tighter text-foreground select-none">
            {averageRating !== null ? averageRating.toFixed(2) : "—"}
          </span>
          {/* Only show trophy if clinic qualifies as patient favorite */}
          {averageRating !== null && averageRating >= 4.5 && totalReviews >= 5 && (
            <div className="absolute -top-8 -right-16 rotate-12 bg-[#FFD700]/10 p-3 rounded-full hidden sm:block">
              <Trophy className="h-10 w-10 text-[#FFD700] fill-[#FFD700]" />
            </div>
          )}
        </div>

        {/* Patient Favorite badge - only show if clinic qualifies */}
        {averageRating !== null && averageRating >= 4.5 && totalReviews >= 5 ? (
          <div className="flex flex-col items-center gap-2 mb-10">
            <div className="text-2xl font-bold text-foreground">Patient Favorite</div>
            <p className="text-base text-muted-foreground max-w-sm text-center">
              One of the top highly rated clinics for patient outcomes and service quality.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 mb-10">
            <div className="text-2xl font-bold text-foreground">Patient Reviews</div>
            <p className="text-base text-muted-foreground max-w-sm text-center">
              {totalReviews > 0
                ? `Based on ${totalReviews} patient review${totalReviews === 1 ? "" : "s"}.`
                : "No reviews yet. Be the first to share your experience."}
            </p>
          </div>
        )}
      </div>

      {/* Source Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6 flex h-auto w-fit flex-wrap gap-2 rounded-full border-0 bg-transparent p-0">
          <TabsTrigger
            value="all"
            className={cn(
              "inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50",
              "data-[state=active]:border-transparent data-[state=active]:bg-[#17375B] data-[state=active]:text-white data-[state=active]:hover:bg-[#17375B]"
            )}
          >
            All
          </TabsTrigger>
          {uniqueSources.map((source) => (
            <TabsTrigger
              key={source}
              value={source}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50",
                "data-[state=active]:border-transparent data-[state=active]:bg-[#17375B] data-[state=active]:text-white data-[state=active]:hover:bg-[#17375B] [&[data-state=active]_svg]:!text-white"
              )}
            >
              {REVIEW_SOURCE_ICON[source]}
              {REVIEW_SOURCE_LABEL[source]}
            </TabsTrigger>
          ))}
        </TabsList>

        {["all", ...uniqueSources].map((source) => {
          const filteredReviews =
            source === "all"
              ? reviews
              : reviews.filter((r) => r.source === source)
          const visibleReviews = filteredReviews.slice(0, 4)

          return (
            <TabsContent key={source} value={source} className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
                {visibleReviews.map((review, idx) => {
                  const reviewKey = `${review.author}-${review.date}-${idx}`
                  const { text: displayText, isTruncated, canCollapse } = truncateText(review.text, reviewKey)

                  return (
                    <div key={reviewKey} className="flex flex-col gap-3">
                      <div className="flex items-center gap-4 mb-1">
                        <div className="h-12 w-12 rounded-full bg-neutral-200 flex items-center justify-center text-lg font-medium text-neutral-600">
                          {review.author.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-base text-foreground">{review.author}</div>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              {REVIEW_SOURCE_ICON[review.source]}
                              <span className="text-foreground/80 font-medium">{REVIEW_SOURCE_LABEL[review.source]}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, starIdx) => (
                            <Star
                              key={starIdx}
                              className={
                                starIdx < review.rating
                                  ? "h-3 w-3 fill-[#FFD700] text-[#FFD700]"
                                  : "h-3 w-3 text-neutral-300"
                              }
                            />
                          ))}
                        </div>
                        <span className="text-muted-foreground">·</span>
                        <span className="font-medium text-muted-foreground">{review.date}</span>
                        {review.verified && (
                          <>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-muted-foreground">Verified</span>
                          </>
                        )}
                      </div>

                      <p className="text-foreground leading-relaxed">
                        {displayText}
                      </p>

                      {(isTruncated || canCollapse) && (
                        <button
                          type="button"
                          className="text-foreground font-semibold underline underline-offset-2 self-start hover:text-neutral-600 transition-colors"
                          onClick={() => toggleReviewExpanded(reviewKey)}
                        >
                          {isTruncated ? "Show more" : "Show less"}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              {filteredReviews.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  No reviews found for this source.
                </div>
              )}
            </TabsContent>
          )
        })}
      </Tabs>

      {/* Show All Reviews Modal */}
      <div className="mt-10">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-base font-semibold border-black/80 hover:bg-neutral-50 rounded-lg">
              Show all {totalReviews} reviews
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl h-[80vh] p-0 gap-0 overflow-hidden sm:rounded-2xl flex flex-col border-0 shadow-2xl">
            <div className="hidden">
              <DialogTitle>All Reviews</DialogTitle>
            </div>
            {/* Custom Close Button */}
            <DialogClose className="absolute left-4 top-4 z-50 rounded-full bg-background p-2 hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>

            <div className="flex flex-col md:flex-row h-full">
              {/* Left Sidebar - Fixed Stats */}
              <div className="hidden md:flex w-1/3 flex-col p-8 border-r border-border/40 bg-muted/5 h-full overflow-y-auto">
                {/* Only show trophy badge if clinic qualifies as patient favorite */}
                {averageRating !== null && averageRating >= 4.5 && totalReviews >= 5 ? (
                  <>
                    <div className="flex items-center gap-4 mb-8 mt-4">
                      <Trophy className="h-16 w-16 text-[#FFD700] fill-[#FFD700]" />
                      <div className="bg-[#FFD700] text-black text-3xl font-bold px-4 py-2 rounded-xl">
                        {averageRating.toFixed(2)}
                      </div>
                    </div>

                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-foreground mb-2">Patient Favorite</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        One of the most loved highly rated clinics for patient outcomes and service quality on Istanbul Medic.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-4 mb-8 mt-4">
                      <Star className="h-16 w-16 text-muted-foreground" />
                      <div className="bg-muted text-foreground text-3xl font-bold px-4 py-2 rounded-xl">
                        {averageRating !== null ? averageRating.toFixed(2) : "—"}
                      </div>
                    </div>

                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-foreground mb-2">Patient Reviews</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {totalReviews > 0
                          ? `Reviews from ${totalReviews} patient${totalReviews === 1 ? "" : "s"}.`
                          : "No reviews yet."}
                      </p>
                    </div>
                  </>
                )}

                {/* Source breakdown */}
                {uniqueSources.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Sources</h4>
                    {uniqueSources.map((source) => {
                      const count = reviews.filter(r => r.source === source).length
                      return (
                        <div key={source} className="flex items-center gap-3">
                          <div className="shrink-0">{REVIEW_SOURCE_ICON[source]}</div>
                          <span className="text-sm text-foreground">{REVIEW_SOURCE_LABEL[source]}</span>
                          <span className="text-sm text-muted-foreground ml-auto">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Right Content - Scrollable Reviews */}
              <div className="flex-1 flex flex-col h-full bg-background">
                {/* Sticky Header inside Right Col */}
                <div className="p-6 md:p-8 pb-4 border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                  <h2 className="text-2xl font-bold mb-6 pl-8 md:pl-0">
                    {reviews.length < totalReviews
                      ? `Showing ${reviews.length} of ${totalReviews.toLocaleString()} reviews`
                      : `${totalReviews} reviews`}
                  </h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search reviews"
                      className="pl-10 h-11 bg-muted/30 border-border/60 rounded-full focus-visible:ring-1"
                    />
                  </div>
                </div>

                {/* Scrollable List */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 pt-4">
                  <div className="space-y-8">
                    {reviews.map((review, i) => (
                      <div key={`${review.author}-${i}-modal`} className="flex flex-col gap-3 group">
                        <div className="flex items-center gap-4 mb-1">
                          <div className="h-12 w-12 rounded-full bg-neutral-200 flex items-center justify-center text-lg font-medium text-neutral-600 shrink-0">
                            {review.author.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-base text-foreground">{review.author}</div>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              {REVIEW_SOURCE_ICON[review.source]}
                              <span className="font-medium text-foreground/80">{REVIEW_SOURCE_LABEL[review.source]}</span>
                              <span>·</span>
                              <span>{review.date}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <Star key={idx} className={`h-3.5 w-3.5 ${idx < review.rating ? 'fill-[#FFD700] text-[#FFD700]' : 'text-neutral-300'}`} />
                            ))}
                          </div>
                        </div>

                        <p className="text-foreground leading-relaxed text-base">
                          {review.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
