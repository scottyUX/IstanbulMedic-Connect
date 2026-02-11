// ReviewsSection.tsx
// Reviews -- IstanbulMedic brand. Copper stars, teal "commonly mentioned" tags, navy text.

import { Star, ThumbsUp } from "lucide-react";
import { Review } from "./types";

interface ReviewsSectionProps {
  rating: number;
  reviewCount: number;
  commonlyMentioned: string[];
  reviews: Review[];
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="border border-gray-200 rounded-lg p-5">
      {/* Header: Name + Verified Badge */}
      <div className="flex items-center gap-2 mb-2">
        <span className="font-semibold text-brand-text">{review.name}</span>
        {review.verified && (
          <span className="bg-teal-50 text-teal-700 text-xs font-medium px-2 py-0.5 rounded-full border border-teal-200">
            Verified Patient
          </span>
        )}
      </div>

      {/* Stars + Date */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= review.rating
                  ? "fill-brand-copper text-brand-copper"
                  : "fill-gray-200 text-gray-200"
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-brand-text-light">{review.date}</span>
      </div>

      {/* Review Content */}
      <p className="text-sm text-brand-text-secondary leading-relaxed">{review.content}</p>
    </div>
  );
}

export function ReviewsSection({
  rating,
  reviewCount,
  commonlyMentioned,
  reviews,
}: ReviewsSectionProps) {
  return (
    <div className="p-6 font-body">
      {/* Rating Overview Row */}
      <div className="flex items-center gap-6 mb-6">
        <div>
          <p className="text-4xl font-bold text-brand-navy">{rating}</p>
          <div className="flex mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(rating)
                    ? "fill-brand-copper text-brand-copper"
                    : "fill-gray-200 text-gray-200"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-brand-text-light mt-1">{reviewCount} reviews</p>
        </div>

        {/* Commonly Mentioned Tags */}
        <div>
          <p className="text-sm text-brand-text-light mb-2">Commonly mentioned:</p>
          <div className="flex flex-wrap gap-2">
            {commonlyMentioned.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm font-medium"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Individual Review Cards */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {/* View All Link */}
      <div className="text-center mt-5">
        <a
          href="#"
          className="text-sm text-brand-teal hover:text-teal-700 font-medium transition-colors"
        >
          View all {reviewCount} reviews &rarr;
        </a>
      </div>
    </div>
  );
}
