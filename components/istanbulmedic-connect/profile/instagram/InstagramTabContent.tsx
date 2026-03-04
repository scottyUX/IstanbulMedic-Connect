"use client"

import { EmptyState } from "@/components/ui/empty-state"
import type { InstagramIntelligenceVM } from "@/components/istanbulmedic-connect/types"
import { ProfileHeader } from "./ProfileHeader"
import { PostsSection } from "./PostsSection"

// Minimal Instagram presence view for medical tourism patients
// Shows: profile info, engagement stats, bio, and recent posts
//
// Additional components available but not used (can re-add if needed):
// - HashtagsSection: Top hashtags and inferred services
// - InstagramMetricsRow: Detailed metrics grid
// - EngagementSection: Engagement metric cards
//
// See docs/instagram-section-data-support.md for data availability analysis

export function InstagramTabContent({
  data,
}: {
  data?: InstagramIntelligenceVM | null
}) {
  if (!data?.username && !data?.profileUrl) {
    return (
      <EmptyState
        title="Instagram data is not available yet."
        description="Connect this profile to view insights."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Header with stats and bio */}
      <ProfileHeader data={data} />

      {/* Recent Posts Grid */}
      <PostsSection posts={data.posts} username={data.username} />
    </div>
  )
}
