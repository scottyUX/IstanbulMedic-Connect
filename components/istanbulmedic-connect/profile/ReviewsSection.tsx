"use client"

import { useState } from "react"
import { Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogClose } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, X } from "lucide-react"
import { GoogleIcon } from "@/components/icons/GoogleIcon"

export interface Review {
  author: string
  rating: number
  date: string
  text: string
  verified: boolean
  source: string
}

interface ReviewsSectionProps {
  averageRating: number | null
  totalReviews: number
  reviews: Review[]
  googleScore?: number | null
}

const REVIEW_TRUNCATE_LENGTH = 250

export type SortOption = "most_recent" | "highest_rated" | "lowest_rated"

const SORT_LABELS: Record<SortOption, string> = {
  most_recent: "Most Recent",
  highest_rated: "Highest Rated",
  lowest_rated: "Lowest Rated",
}

export const parseReviewDate = (dateStr: string): number => {
  const parsed = Date.parse(dateStr)
  return isNaN(parsed) ? 0 : parsed
}

export const sortReviews = (reviews: Review[], sortBy: SortOption): Review[] => {
  const sorted = [...reviews]
  switch (sortBy) {
    case "most_recent":
      return sorted.sort((a, b) => parseReviewDate(b.date) - parseReviewDate(a.date))
    case "highest_rated":
      return sorted.sort((a, b) => b.rating - a.rating)
    case "lowest_rated":
      return sorted.sort((a, b) => a.rating - b.rating)
    default:
      return sorted
  }
}

function StarBar({ stars, count, total }: { stars: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="flex w-14 shrink-0 items-center justify-end gap-0.5 text-muted-foreground">
        {stars} <Star className="h-2.5 w-2.5 fill-[#FFD700] text-[#FFD700]" />
      </span>
      <div className="flex-1 rounded-full bg-muted/30 overflow-hidden h-2">
        <div className="h-full rounded-full bg-[#FFD700]" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right font-medium text-foreground">{pct}%</span>
    </div>
  )
}

export const ReviewsSection = ({
  averageRating,
  totalReviews,
  reviews,
  googleScore = null,
}: ReviewsSectionProps) => {
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set())
  const [modalSortBy, setModalSortBy] = useState<SortOption>("most_recent")
  const [searchQuery, setSearchQuery] = useState("")

  const initialReviewsSorted = sortReviews(reviews, "most_recent")
  const modalReviewsFiltered = searchQuery.trim()
    ? reviews.filter((r) => r.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : reviews
  const modalReviewsSorted = sortReviews(modalReviewsFiltered, modalSortBy)

  const starCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const r of reviews) {
    const s = Math.round(r.rating)
    if (s >= 1 && s <= 5) starCounts[s]++
  }

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

  const visibleReviews = initialReviewsSorted.slice(0, 4)

  return (
    <Card id="reviews" variant="profile" className="scroll-mt-32">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="im-heading-2 text-foreground">Google Reviews</h2>
            {averageRating !== null ? (
              <div className="flex items-center gap-2 mt-2">
                <GoogleIcon className="h-4 w-4" />
                <span className="text-2xl font-bold text-foreground">{averageRating.toFixed(1)}</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={
                        i < Math.round(averageRating)
                          ? "h-4 w-4 fill-[#FFD700] text-[#FFD700]"
                          : "h-4 w-4 text-neutral-300"
                      }
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">· {totalReviews} review{totalReviews === 1 ? "" : "s"}</span>
              </div>
            ) : (
              <p className="text-base text-muted-foreground mt-1">No Google reviews yet.</p>
            )}
            {googleScore !== null && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Google Signal Score</span>
                <span className="rounded-md bg-[#17375B]/10 px-2.5 py-0.5 text-sm font-bold text-[#17375B]">{(googleScore / 10).toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">/ 10</span>
              </div>
            )}
          </div>

        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Review Grid */}
        {visibleReviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
            {visibleReviews.map((review, idx) => {
              const reviewKey = `${review.author}-${review.date}-${idx}`
              const { text: displayText, isTruncated, canCollapse } = truncateText(review.text, reviewKey)

              return (
                <div key={reviewKey} className="flex flex-col gap-3">
                  <div className="flex items-center gap-4 mb-1">
                    <div className="h-10 w-10 rounded-full bg-neutral-200 flex items-center justify-center text-base font-medium text-neutral-600 shrink-0">
                      {review.author.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-base text-foreground">{review.author}</div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <GoogleIcon className="h-3.5 w-3.5" />
                        <span className="text-foreground/80 font-medium">Google Reviews</span>
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

                  <p className="text-foreground leading-relaxed">{displayText}</p>

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
        ) : (
          <p className="text-muted-foreground">No Google reviews yet.</p>
        )}

        {/* Show All Reviews Modal */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-base font-semibold border-black/80 hover:bg-neutral-50 rounded-lg">
              View more Google reviews
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl h-[80vh] p-0 gap-0 overflow-hidden sm:rounded-2xl flex flex-col border-0 shadow-2xl">
            <DialogTitle className="sr-only">All Reviews</DialogTitle>
            <DialogClose className="absolute left-4 top-4 z-50 rounded-full bg-background p-2 hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>

            <div className="flex flex-col md:flex-row h-full">
              {/* Left Sidebar */}
              <div className="hidden md:flex w-1/3 flex-col p-8 border-r border-border/40 bg-muted/5 h-full overflow-y-auto">
                <>
                  <div className="flex items-center gap-3 mb-6 mt-4">
                    <GoogleIcon className="h-8 w-8" />
                    <div className="text-4xl font-bold text-foreground">
                      {averageRating !== null ? averageRating.toFixed(1) : "—"}
                    </div>
                  </div>
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-foreground mb-2">Google Reviews</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {totalReviews > 0
                        ? `${totalReviews} review${totalReviews === 1 ? "" : "s"} from Google.`
                        : "No reviews yet."}
                    </p>
                  </div>
                </>

                {/* Star distribution */}
                {reviews.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Rating breakdown</h4>
                    {[5, 4, 3, 2, 1].map((s) => (
                      <StarBar key={s} stars={s} count={starCounts[s]} total={reviews.length} />
                    ))}
                    <p className="text-xs text-muted-foreground pt-1">
                      Based on {reviews.length} stored review{reviews.length === 1 ? "" : "s"}.
                    </p>
                  </div>
                )}
              </div>

              {/* Right Content - Scrollable Reviews */}
              <div className="flex-1 flex flex-col h-full bg-background">
                <div className="p-6 md:p-8 pb-4 border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                  <h2 className="text-2xl font-bold mb-6 pl-8 md:pl-0">
                    {searchQuery.trim()
                      ? `${modalReviewsSorted.length} result${modalReviewsSorted.length === 1 ? "" : "s"} for "${searchQuery}"`
                      : reviews.length < totalReviews
                        ? `Showing ${reviews.length} of ${totalReviews.toLocaleString()} reviews`
                        : `${totalReviews} reviews`}
                  </h2>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search reviews"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-11 bg-muted/30 border-border/60 rounded-full focus-visible:ring-1"
                      />
                    </div>
                    <Select value={modalSortBy} onValueChange={(value) => setModalSortBy(value as SortOption)}>
                      <SelectTrigger className="w-[160px] h-11 rounded-full border-border/60">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="most_recent">{SORT_LABELS.most_recent}</SelectItem>
                        <SelectItem value="highest_rated">{SORT_LABELS.highest_rated}</SelectItem>
                        <SelectItem value="lowest_rated">{SORT_LABELS.lowest_rated}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 pt-4">
                  {modalReviewsSorted.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <p className="text-muted-foreground text-lg">No reviews match your search.</p>
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="mt-4 text-sm text-foreground underline underline-offset-2 hover:text-muted-foreground"
                      >
                        Clear search
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {modalReviewsSorted.map((review, i) => (
                        <div key={`${review.author}-${i}-modal`} className="flex flex-col gap-3 group">
                          <div className="flex items-center gap-4 mb-1">
                            <div className="h-12 w-12 rounded-full bg-neutral-200 flex items-center justify-center text-lg font-medium text-neutral-600 shrink-0">
                              {review.author.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-base text-foreground">{review.author}</div>
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <GoogleIcon className="h-3.5 w-3.5" />
                                <span className="font-medium text-foreground/80">Google Reviews</span>
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
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
