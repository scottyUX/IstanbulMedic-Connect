"use client"

import { ExternalLink } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

type PostSource = "reddit" | "instagram" | "other"
type Sentiment = "Positive" | "Neutral" | "Negative"

interface CommunityPost {
  source: PostSource
  date: string
  snippet: string
  url: string
}

interface CommunitySummary {
  totalMentions: number
  sentiment: Sentiment
  commonThemes: string[]
}

interface CommunitySignalsSectionProps {
  posts: CommunityPost[]
  summary: CommunitySummary
}

const sourceLabel: Record<PostSource, string> = {
  reddit: "Reddit",
  instagram: "Instagram",
  other: "Web",
}

export const CommunitySignalsSection = ({ posts, summary }: CommunitySignalsSectionProps) => {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Community Signals</h2>
            <p className="text-sm text-muted-foreground">
              Mentions from social platforms and community discussions.
            </p>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/10 px-3 py-2 text-sm">
            <div className="text-xs text-muted-foreground">Mentions</div>
            <div className="mt-1 font-semibold text-foreground">{summary.totalMentions}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-background text-foreground">
            Sentiment: <span className="ml-1 font-semibold">{summary.sentiment}</span>
          </Badge>
          {summary.commonThemes.map((theme) => (
            <Badge key={theme} variant="secondary">
              {theme}
            </Badge>
          ))}
        </div>

        <Separator />

        <div className="space-y-3">
          {posts.map((post, idx) => (
            <div key={`${post.source}-${idx}`} className="rounded-xl border border-border/60 bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{sourceLabel[post.source]}</Badge>
                  <span className="text-sm text-muted-foreground">{post.date}</span>
                </div>
                {post.url && post.url !== "#" ? (
                  <Button asChild variant="ghost" className="h-8 px-2">
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Open source"
                      className="inline-flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="text-sm">Open</span>
                    </a>
                  </Button>
                ) : null}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{post.snippet}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

