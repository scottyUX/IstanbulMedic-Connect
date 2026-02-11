"use client"

import { useState } from "react"
import { ExternalLink, Instagram, Facebook, Youtube, MessageSquare, Globe, ChevronDown, ChevronUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export type PostSource = "reddit" | "instagram" | "google" | "facebook" | "youtube" | "forums" | "other"
export type Sentiment = "Positive" | "Neutral" | "Negative"

export interface CommunityPost {
  source: PostSource
  author: string
  date: string
  snippet: string
  url: string
}

export interface CommunitySummary {
  totalMentions: number
  sentiment: Sentiment
  commonThemes: string[]
}

interface CommunitySignalsSectionProps {
  posts: CommunityPost[]
  summary: CommunitySummary
}

const RedditIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 0C5.373 0 0 5.373 0 12c0 6.627 5.373 12 12 12s12-5.373 12-12c0-6.627-5.373-12-12-12zm4.333 3.284c.854 0 1.55.696 1.55 1.55 0 .854-.696 1.55-1.55 1.55-.854 0-1.55-.696-1.55-1.55 0-.854.696-1.55 1.55-1.55zm-1.82 14.868c-2.38 0-4.32-2.138-4.32-4.78 0-2.64 1.94-4.78 4.32-4.78 2.38 0 4.32 2.14 4.32 4.78 0 2.64-1.94 4.78-4.32 4.78zm4.87-7.397c-.452-.397-.972-.647-1.532-.738.165-.47.254-.972.254-1.492 0-2.522-2.046-4.568-4.568-4.568-2.522 0-4.568 2.046-4.568 4.568 0 .52.09 1.022.254 1.492-.56.09-1.08.34-1.532.738C5.9 11.602 5.06 12.91 5.06 14.368c0 2.944 3.11 5.332 6.94 5.332s6.94-2.388 6.94-5.332c0-1.458-.84-2.766-2.057-3.665z" />
  </svg>
)

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
  </svg>
)

const LOGO_MAP: Record<PostSource, React.ReactNode> = {
  instagram: <Instagram className="h-5 w-5 text-[#E1306C]" />, // Instagram Brand Color
  facebook: <Facebook className="h-5 w-5 text-[#1877F2]" />, // Facebook Brand Color
  youtube: <Youtube className="h-5 w-5 text-[#FF0000]" />, // YouTube Brand Color
  reddit: <RedditIcon className="h-5 w-5 text-[#FF4500]" />, // Reddit Brand Color
  google: <GoogleIcon className="h-5 w-5 text-[#4285F4]" />, // Google Brand Color
  forums: <MessageSquare className="h-5 w-5 text-[#17375B]" />, // Primary Navy for generic/forums
  other: <Globe className="h-5 w-5 text-muted-foreground" />,
}

const sourceLabel: Record<PostSource, string> = {
  reddit: "Reddit",
  instagram: "Instagram",
  google: "Google Reviews",
  facebook: "Facebook",
  youtube: "YouTube",
  forums: "Forums",
  other: "Web",
}

export const CommunitySignalsSection = ({ posts, summary }: CommunitySignalsSectionProps) => {
  const [activeFilter, setActiveFilter] = useState<PostSource | "all">("all")
  const [isExpanded, setIsExpanded] = useState(false)

  // Get unique sources present in posts
  const uniqueSources = Array.from(new Set(posts.map(p => p.source)))

  // Filter posts
  const filteredPosts = activeFilter === "all"
    ? posts
    : posts.filter(p => p.source === activeFilter)

  // Pagination logic (show 4 by default - 2x2 grid feels better than 3)
  const visiblePosts = isExpanded ? filteredPosts : filteredPosts.slice(0, 4)
  const hasHiddenPosts = filteredPosts.length > 4

  return (
    <Card className="border-border/60 shadow-none">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Community Signals</h2>
            <p className="text-base text-muted-foreground">
              Mentions from social platforms and community discussions.
            </p>
          </div>

          <div className="rounded-lg bg-muted/10 px-3 py-2 text-sm">
            <div className="text-sm text-muted-foreground">Mentions</div>
            <div className="mt-1 font-semibold text-xl text-foreground">{summary.totalMentions}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Sentiment Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge className="bg-[#17375B] text-white hover:bg-[#17375B]/90">
            Sentiment: <span className="ml-1 font-bold">{summary.sentiment}</span>
          </Badge>
          {summary.commonThemes.map((theme) => (
            <Badge key={theme} variant="secondary" className="text-sm">
              {theme}
            </Badge>
          ))}
        </div>

        <Separator />

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setActiveFilter("all"); setIsExpanded(false); }}
            className={cn(
              "rounded-full border transition-all shadow-none",
              activeFilter === "all"
                ? "bg-[#17375B] border-[#17375B] text-white hover:bg-[#17375B]/90"
                : "bg-transparent border-input hover:border-[#17375B] hover:text-[#17375B]"
            )}
          >
            All
          </Button>
          {uniqueSources.map(source => (
            <Button
              key={source}
              variant="outline"
              size="sm"
              onClick={() => { setActiveFilter(source); setIsExpanded(false); }}
              className={cn(
                "rounded-full border transition-all gap-1.5 shadow-none",
                activeFilter === source
                  ? "bg-[#17375B] border-[#17375B] text-white hover:bg-[#17375B]/90"
                  : "bg-transparent border-input hover:border-[#17375B] hover:text-[#17375B]"
              )}
            >
              {activeFilter === source ? LOGO_MAP[source] : (
                <span className="opacity-70">{LOGO_MAP[source]}</span>
              )}
              {sourceLabel[source]}
            </Button>
          ))}
        </div>

        {/* Posts List - Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {visiblePosts.map((post, idx) => (
            <div key={`${post.source}-${idx}-${post.date}`} className="rounded-xl bg-muted/5 p-4 border border-border/40 hover:border-border/80 transition-colors flex flex-col h-full">
              <div className="flex flex-col gap-3 flex-1">
                {/* Header: Logo, Author, Meta */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-full shadow-sm border border-border/20 mt-0.5 shrink-0">
                      {LOGO_MAP[post.source]}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-sm text-foreground truncate max-w-[150px]">
                        {post.author}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <span className="font-medium text-foreground/80">{sourceLabel[post.source]}</span>
                        <span>•</span>
                        <span>{post.date}</span>
                      </div>
                    </div>
                  </div>

                  {post.url && post.url !== "#" ? (
                    <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-foreground shrink-0">
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Open source"
                        className="inline-flex items-center gap-1.5"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  ) : null}
                </div>

                {/* Content */}
                <p className="text-base leading-relaxed text-muted-foreground pl-[3.5rem] line-clamp-4">
                  {post.snippet}
                </p>
              </div>
            </div>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No mentions found for this category.
          </div>
        )}

        {/* View All / Expansion Button */}
        {hasHiddenPosts && (
          <div className="pt-2">
            <Button
              variant="ghost"
              className="w-full gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/10 shadow-none"
              onClick={() => setIsExpanded(true)}
            >
              <ChevronDown className="h-4 w-4" />
              View all {filteredPosts.length} mentions
            </Button>
          </div>
        )}

        {isExpanded && filteredPosts.length > 4 && (
          <div className="pt-2">
            <Button
              variant="ghost"
              className="w-full gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/10 shadow-none"
              onClick={() => setIsExpanded(false)}
            >
              <ChevronUp className="h-4 w-4" />
              Show less
            </Button>
          </div>
        )}

      </CardContent>
    </Card>
  )
}

