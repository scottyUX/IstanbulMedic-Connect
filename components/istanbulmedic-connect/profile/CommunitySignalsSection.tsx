"use client"

import { useState } from "react"
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { StatBlock } from "@/components/ui/stat-block"
import { cn } from "@/lib/utils"
import { SOCIAL_LOGO_MAP, SOURCE_LABEL, type PostSource } from "@/lib/social-icons"

export type { PostSource }
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
    <Card id="community" variant="profile" className="scroll-mt-32">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="im-heading-2 text-foreground">Community Signals</h2>
            <p className="text-base text-muted-foreground">
              Mentions from social platforms and community discussions.
            </p>
          </div>

          <StatBlock
            label="Mentions"
            value={summary.totalMentions}
            valueClassName="text-xl text-foreground"
          />
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
              {activeFilter === source ? SOCIAL_LOGO_MAP[source] : (
                <span className="opacity-70">{SOCIAL_LOGO_MAP[source]}</span>
              )}
              {SOURCE_LABEL[source]}
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
                      {SOCIAL_LOGO_MAP[post.source]}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-sm text-foreground truncate max-w-[150px]">
                        {post.author}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <span className="font-medium text-foreground/80">{SOURCE_LABEL[post.source]}</span>
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
              variant="link"
              className="w-full gap-2 text-foreground hover:text-[#3EBBB7] justify-start underline-offset-4"
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
              variant="link"
              className="w-full gap-2 text-foreground hover:text-[#3EBBB7] justify-start underline-offset-4"
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

