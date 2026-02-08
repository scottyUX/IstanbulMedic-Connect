"use client"

import { CheckCircle2, Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface Review {
  author: string
  rating: number
  date: string
  text: string
  verified: boolean
}

interface ReviewsSectionProps {
  averageRating: number
  totalReviews: number
  communityTags: string[]
  reviews: Review[]
}

export const ReviewsSection = ({
  averageRating,
  totalReviews,
  communityTags,
  reviews,
}: ReviewsSectionProps) => {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Reviews</h2>
            <p className="text-sm text-muted-foreground">
              Verified patient feedback and common themes.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/10 px-3 py-2">
            <Star className="h-4 w-4 fill-current text-primary" />
            <div className="text-sm font-semibold text-foreground">
              {averageRating.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">({totalReviews})</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {communityTags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>

        <Separator />

        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={`${review.author}-${review.date}`} className="rounded-xl border border-border/60 bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold text-foreground">{review.author}</div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={
                          idx < review.rating
                            ? "h-4 w-4 fill-current text-primary"
                            : "h-4 w-4 text-muted-foreground/40"
                        }
                        aria-label={idx < review.rating ? "Filled star" : "Empty star"}
                      />
                    ))}
                  </div>
                  <span>{review.date}</span>
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {review.text}
              </p>

              {review.verified ? (
                <div className="mt-3 inline-flex items-center gap-2 text-sm text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  Verified review
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

