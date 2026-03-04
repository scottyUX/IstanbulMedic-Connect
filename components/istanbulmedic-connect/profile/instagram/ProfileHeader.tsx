"use client"

import { BadgeCheck, Info } from "lucide-react"
import Image from "next/image"
import type { InstagramIntelligenceVM } from "@/components/istanbulmedic-connect/types"
import { formatNumber } from "@/lib/utils"

interface ProfileHeaderProps {
  data: InstagramIntelligenceVM
}

export function ProfileHeader({ data }: ProfileHeaderProps) {
  const {
    profilePicUrl,
    username,
    fullName,
    biography,
    verified,
    followersCount,
    postsCount,
    profileUrl,
    engagement,
  } = data

  const likesPerPost = engagement?.likesPerPost
  const commentsPerPost = engagement?.commentsPerPost
  const hasEngagementData = (likesPerPost != null && likesPerPost > 0) ||
                            (commentsPerPost != null && commentsPerPost > 0)

  return (
    <div className="rounded-lg border border-border/60 bg-card p-5">
      <div className="flex gap-4">
        {/* Profile Picture */}
        <div className="flex-shrink-0">
          {profilePicUrl ? (
            <div className="relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-border/60">
              <Image
                src={profilePicUrl}
                alt={fullName || username || "Profile"}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 text-xl font-bold text-white">
              {(fullName || username || "?").charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex-1 min-w-0">
          {/* Username & Verified Badge */}
          <div className="flex items-center gap-1.5">
            <a
              href={profileUrl || `https://instagram.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base font-semibold text-foreground hover:underline truncate"
            >
              @{username}
            </a>
            {verified && (
              <span title="Verified account">
                <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" fill="currentColor" />
              </span>
            )}
          </div>

          {/* Stats: followers · posts */}
          <div className="mt-1 text-sm text-muted-foreground">
            {followersCount != null && (
              <span>{formatNumber(followersCount)} followers</span>
            )}
            {followersCount != null && postsCount != null && (
              <span> · </span>
            )}
            {postsCount != null && (
              <span>{formatNumber(postsCount)} posts</span>
            )}
          </div>

          {/* Engagement: avg likes · avg comments per post */}
          {hasEngagementData && (
            <div className="mt-1 text-sm text-muted-foreground">
              {likesPerPost != null && likesPerPost > 0 && (
                <span>~{Math.round(likesPerPost)} likes</span>
              )}
              {likesPerPost != null && likesPerPost > 0 && commentsPerPost != null && commentsPerPost > 0 && (
                <span> · </span>
              )}
              {commentsPerPost != null && commentsPerPost > 0 && (
                <span>~{Math.round(commentsPerPost)} comments</span>
              )}
              <span className="text-muted-foreground/70"> per post</span>
            </div>
          )}
        </div>
      </div>

      {/* Biography */}
      {biography && (
        <p className="mt-4 whitespace-pre-line text-sm text-foreground/90 leading-relaxed">
          {biography}
        </p>
      )}

      {/* Based on recent posts note */}
      {hasEngagementData && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground/70">
          <Info className="h-3 w-3" />
          <span>Based on recent posts</span>
        </div>
      )}
    </div>
  )
}
