"use client"

import { ExternalLink, Heart, MessageCircle, Play, Images } from "lucide-react"
import { ReportSection } from "@/components/ui/report-section"
import type { InstagramPostVM } from "@/components/istanbulmedic-connect/types"
import { formatNumber } from "@/lib/utils"
import Image from "next/image"

interface PostsSectionProps {
  posts?: InstagramPostVM[]
  username?: string
}

function PostTypeIcon({ type }: { type: InstagramPostVM["type"] }) {
  if (type === "Video") {
    return <Play className="h-4 w-4 text-white drop-shadow-md" fill="white" />
  }
  if (type === "Sidecar") {
    return <Images className="h-4 w-4 text-white drop-shadow-md" />
  }
  return null
}

function PostCard({ post }: { post: InstagramPostVM }) {
  const imageUrl = post.displayUrl || "/hero/landing_hero_new.png"

  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative aspect-square overflow-hidden rounded-lg bg-muted transition-all hover:ring-2 hover:ring-primary/50"
    >
      <Image
        src={imageUrl}
        alt={post.alt || post.caption?.slice(0, 50) || "Instagram post"}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      />

      {post.type !== "Image" && (
        <div className="absolute right-2 top-2">
          <PostTypeIcon type={post.type} />
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex items-center gap-1 text-white">
          <Heart className="h-5 w-5" fill="white" />
          <span className="text-sm font-semibold">{formatNumber(post.likesCount)}</span>
        </div>
        <div className="flex items-center gap-1 text-white">
          <MessageCircle className="h-5 w-5" fill="white" />
          <span className="text-sm font-semibold">{formatNumber(post.commentsCount)}</span>
        </div>
      </div>
    </a>
  )
}

export function PostsSection({ posts, username }: PostsSectionProps) {
  if (!posts || posts.length === 0) {
    return null
  }

  const profileUrl = username ? `https://instagram.com/${username}` : null

  return (
    <ReportSection
      title="Recent Posts"
      description="Sample of recent Instagram posts from this clinic profile."
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {posts.slice(0, 6).map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {profileUrl && (
        <div className="mt-4 flex justify-center">
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            View all posts on Instagram
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}
    </ReportSection>
  )
}
