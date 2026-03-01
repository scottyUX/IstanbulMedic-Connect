"use client"

import type { ReactNode } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface PriceRatingBlockProps {
  price?: ReactNode
  priceLabel?: string
  rating: number | null
  reviewCount: number
  reviewsHref?: string
  className?: string
}

const linkClass = "underline underline-offset-4 hover:text-foreground cursor-pointer"

export const PriceRatingBlock = ({
  price,
  priceLabel = "est. starting",
  rating,
  reviewCount,
  reviewsHref,
  className,
}: PriceRatingBlockProps) => {
  const reviewsText = `${reviewCount} reviews`

  return (
    <div className={cn("flex justify-between items-end", className)}>
      {price && (
        <div>
          <span className="text-3xl font-bold">{price}</span>
          {priceLabel && (
            <span className="text-muted-foreground text-base ml-1">{priceLabel}</span>
          )}
        </div>
      )}
      <div className={cn("flex items-center gap-1 text-sm font-semibold", !price && "ml-auto")}>
        <Star className={rating !== null ? "h-3 w-3 fill-[#FFD700] text-[#FFD700]" : "h-3 w-3 text-muted-foreground/40"} aria-hidden />
        {rating !== null ? rating.toFixed(2) : "—"}
        {" · "}
        {reviewsHref ? (
          <a href={reviewsHref} className={linkClass}>
            {reviewsText}
          </a>
        ) : (
          <span className="underline">{reviewsText}</span>
        )}
      </div>
    </div>
  )
}
