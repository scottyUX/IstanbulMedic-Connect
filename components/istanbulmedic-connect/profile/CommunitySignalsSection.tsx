"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { StatBlock } from "@/components/ui/stat-block"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  const [isExpanded, setIsExpanded] = useState(false)

  // Get unique sources present in posts
  const uniqueSources = Array.from(new Set(posts.map(p => p.source)))

  return (
    <Card id="community" variant="profile" className="scroll-mt-32">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="im-heading-2 text-foreground">Community Signals</h2>
            <p className="im-text-body im-text-muted">
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
          <Badge className="bg-[var(--im-color-primary)] text-white hover:bg-[var(--im-color-primary)]/90">
            Sentiment: <span className="ml-1 font-bold">{summary.sentiment}</span>
          </Badge>
          {summary.commonThemes.map((theme) => (
            <Badge key={theme} variant="secondary" className="text-sm">
              {theme}
            </Badge>
          ))}
        </div>

        <Separator />

        {/* Filter Tabs - same component as Social Presence */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4 flex h-auto w-fit flex-wrap gap-2 rounded-full border-0 bg-transparent p-0">
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
                {SOCIAL_LOGO_MAP[source]}
                {SOURCE_LABEL[source]}
              </TabsTrigger>
            ))}
          </TabsList>

          {["all", ...uniqueSources].map((source) => {
            const filteredPosts =
              source === "all"
                ? posts
                : posts.filter((p) => p.source === source)
            const visiblePosts = isExpanded ? filteredPosts : filteredPosts.slice(0, 4)
            const hasHiddenPosts = filteredPosts.length > 4

            return (
              <TabsContent key={source} value={source} className="mt-0">
                <div className="grid grid-cols-1 gap-4 pt-0 md:grid-cols-2">
                    {visiblePosts.map((post, idx) => (
                      <div
                        key={`${post.source}-${idx}-${post.date}`}
                        className="flex h-full flex-col rounded-xl border border-border/40 bg-muted/5 p-4 transition-colors hover:border-border/80"
                      >
                        <div className="flex flex-1 flex-col gap-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 shrink-0 rounded-full border border-border/20 bg-white p-2 shadow-sm">
                                {SOCIAL_LOGO_MAP[post.source]}
                              </div>
                              <div className="flex min-w-0 flex-col">
                                <span className="truncate text-sm font-semibold text-foreground max-w-[150px]">
                                  {post.author}
                                </span>
                                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <span className="font-medium text-foreground/80">
                                    {SOURCE_LABEL[post.source]}
                                  </span>
                                  <span>•</span>
                                  <span>{post.date}</span>
                                </div>
                              </div>
                            </div>
                            {post.url && post.url !== "#" ? (
                              <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="h-7 shrink-0 px-2 text-muted-foreground hover:text-foreground"
                              >
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
                          <p className="pl-[3.5rem] im-text-body leading-relaxed im-text-muted line-clamp-4">
                            {post.snippet}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredPosts.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground">
                      No mentions found for this category.
                    </div>
                  )}

                  {hasHiddenPosts && (
                    <div className="pt-2">
                      <Button
                        variant="link"
                        className="w-full justify-start gap-2 text-foreground underline-offset-4 hover:text-[#3EBBB7]"
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
                        className="w-full justify-start gap-2 text-foreground underline-offset-4 hover:text-[#3EBBB7]"
                        onClick={() => setIsExpanded(false)}
                      >
                        <ChevronUp className="h-4 w-4" />
                        Show less
                      </Button>
                    </div>
                  )}
                </TabsContent>
              )
            })}
          </Tabs>
      </CardContent>
    </Card>
  )
}

