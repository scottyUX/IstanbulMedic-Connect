"use client"

import { Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"

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
    <div className="py-8 border-t border-border/60">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold flex items-center gap-2 mb-2">
          <Star className="h-6 w-6 fill-black text-black" />
          {averageRating.toFixed(1)} · {totalReviews} reviews
        </h2>
        <div className="flex flex-wrap gap-2 mt-4">
          {communityTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="bg-neutral-100 text-neutral-800 hover:bg-neutral-200 px-3 py-1 text-sm font-normal rounded-full border border-transparent">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
        {reviews.map((review) => (
          <div key={`${review.author}-${review.date}`} className="flex flex-col gap-3">
            <div className="flex items-center gap-4 mb-1">
              <div className="h-12 w-12 rounded-full bg-neutral-200 flex items-center justify-center text-lg font-medium text-neutral-600">
                {review.author.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-base text-foreground">{review.author}</div>
                <div className="text-sm text-muted-foreground">Patient</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-foreground">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star
                    key={idx}
                    className={
                      idx < review.rating
                        ? "h-3 w-3 fill-black text-black"
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
              {review.text}
            </p>

            <button type="button" className="text-foreground font-semibold underline underline-offset-2 self-start hover:text-neutral-600 transition-colors">
              Show more
            </button>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <button type="button" className="px-6 py-3 border border-black rounded-lg font-semibold hover:bg-neutral-50 transition-colors">
          Show all {totalReviews} reviews
        </button>
      </div>
    </div>
  )
}

