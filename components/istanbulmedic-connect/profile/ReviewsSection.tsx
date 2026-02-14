"use client"

import { Star, Sparkles, CheckCircle2, Clock, MessageSquare, Building2, Tag, Trophy } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Search, X } from "lucide-react"

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
    <div id="reviews" className="py-8 border-t border-border/60 scroll-mt-32">
      <div className="flex flex-col items-center justify-center text-center mb-16 pt-4">
        <div className="flex items-center justify-center mb-4 relative">
          {/* Laurel decoration placeholder - using text scale for impact as per design */}
          <span className="text-[8rem] font-bold leading-none tracking-tighter text-foreground select-none">
            {averageRating.toFixed(2)}
          </span>
          <div className="absolute -top-8 -right-16 rotate-12 bg-[#FFD700]/10 p-3 rounded-full hidden sm:block">
            <Trophy className="h-10 w-10 text-[#FFD700] fill-[#FFD700]" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 mb-10">
          <div className="text-2xl font-bold text-foreground">Patient Favorite</div>
          <p className="text-base text-muted-foreground max-w-sm text-center">
            One of the top 5% highly rated clinics for patient outcomes and service quality.
          </p>
        </div>

        <div className="w-full max-w-5xl mx-auto overflow-x-auto pb-6">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-6 md:gap-8 min-w-[600px] px-4">
            <div className="flex flex-col items-center md:items-start gap-1 md:border-r border-border/40 last:border-0">
              <div className="text-sm font-semibold text-foreground">Hygiene</div>
              <div className="text-lg font-bold">5.0</div>
              <Sparkles className="h-6 w-6 text-muted-foreground mt-2 stroke-1" />
            </div>
            <div className="flex flex-col items-center md:items-start gap-1 md:border-r border-border/40 last:border-0">
              <div className="text-sm font-semibold text-foreground">Outcome</div>
              <div className="text-lg font-bold">4.9</div>
              <CheckCircle2 className="h-6 w-6 text-muted-foreground mt-2 stroke-1" />
            </div>
            <div className="flex flex-col items-center md:items-start gap-1 md:border-r border-border/40 last:border-0">
              <div className="text-sm font-semibold text-foreground">Process</div>
              <div className="text-lg font-bold">4.8</div>
              <Clock className="h-6 w-6 text-muted-foreground mt-2 stroke-1" />
            </div>
            <div className="flex flex-col items-center md:items-start gap-1 md:border-r border-border/40 last:border-0">
              <div className="text-sm font-semibold text-foreground">Communication</div>
              <div className="text-lg font-bold">5.0</div>
              <MessageSquare className="h-6 w-6 text-muted-foreground mt-2 stroke-1" />
            </div>
            <div className="flex flex-col items-center md:items-start gap-1 md:border-r border-border/40 last:border-0">
              <div className="text-sm font-semibold text-foreground">Facilities</div>
              <div className="text-lg font-bold">4.9</div>
              <Building2 className="h-6 w-6 text-muted-foreground mt-2 stroke-1" />
            </div>
            <div className="flex flex-col items-center md:items-start gap-1 md:border-r border-border/40 last:border-0">
              <div className="text-sm font-semibold text-foreground">Value</div>
              <div className="text-lg font-bold">4.9</div>
              <Tag className="h-6 w-6 text-muted-foreground mt-2 stroke-1" />
            </div>
          </div>
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
              {review.text}
            </p>

            <button type="button" className="text-foreground font-semibold underline underline-offset-2 self-start hover:text-neutral-600 transition-colors">
              Show more
            </button>
          </div>
        ))}
      </div>

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

                <div className="space-y-5 mt-4">
                  {[
                    { label: "Hygiene", score: "5.0", icon: Sparkles },
                    { label: "Outcome", score: "4.9", icon: CheckCircle2 },
                    { label: "Process", score: "4.8", icon: Clock },
                    { label: "Communication", score: "5.0", icon: MessageSquare },
                    { label: "Facilities", score: "4.9", icon: Building2 },
                    { label: "Value", score: "4.9", icon: Tag },
                  ].map((idx) => (
                    <div key={idx.label} className="flex items-center justify-between pb-4 border-b border-border/40 last:border-0">
                      <div className="flex items-center gap-3">
                        <idx.icon className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-foreground">{idx.label}</span>
                      </div>
                      <span className="font-bold text-foreground">{idx.score}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Content - Scrollable Reviews */}
              <div className="flex-1 flex flex-col h-full bg-background">
                {/* Sticky Header inside Right Col */}
                <div className="p-6 md:p-8 pb-4 border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                  <h2 className="text-2xl font-bold mb-6 pl-8 md:pl-0">{totalReviews} reviews</h2>
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
                            <div className="text-sm text-muted-foreground">Patient · 2 years on Platform</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <Star key={idx} className={`h-3.5 w-3.5 ${idx < review.rating ? 'fill-[#FFD700] text-[#FFD700]' : 'text-neutral-300'}`} />
                            ))}
                          </div>
                          <span className="text-muted-foreground">·</span>
                          <span className="font-medium text-muted-foreground">{review.date}</span>
                        </div>

                        <p className="text-foreground leading-relaxed text-base">
                          {review.text}
                        </p>
                      </div>
                    ))}
                    {/* Duplicate for demo scroll */}
                    {reviews.map((review, i) => (
                      <div key={`${review.author}-${i}-modal-dup`} className="flex flex-col gap-3 group pt-8 border-t border-border/40">
                        <div className="flex items-center gap-4 mb-1">
                          <div className="h-12 w-12 rounded-full bg-neutral-200 flex items-center justify-center text-lg font-medium text-neutral-600 shrink-0">
                            {review.author.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-base text-foreground">{review.author}</div>
                            <div className="text-sm text-muted-foreground">Patient · 1 year on Platform</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <Star key={idx} className={`h-3.5 w-3.5 ${idx < review.rating ? 'fill-[#FFD700] text-[#FFD700]' : 'text-neutral-300'}`} />
                            ))}
                          </div>
                          <span className="text-muted-foreground">·</span>
                          <span className="font-medium text-muted-foreground">{review.date}</span>
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

