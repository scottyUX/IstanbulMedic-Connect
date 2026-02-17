"use client"

import { Facebook, Instagram, Music2 } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import {
  PlatformPillTabs,
  type PlatformPillTabItem,
} from "@/components/ui/platform-pill-tabs"
import type { InstagramIntelligenceVM } from "@/components/istanbulmedic-connect/types"
import { InstagramTabContent } from "./instagram/InstagramTabContent"

const PLATFORM_TABS: PlatformPillTabItem[] = [
  {
    value: "instagram",
    label: "Instagram",
    icon: Instagram,
    iconColor: "text-[#E1306C]",
  },
  {
    value: "tiktok",
    label: "TikTok",
    icon: Music2,
    iconColor: "text-black",
  },
  {
    value: "facebook",
    label: "Facebook",
    icon: Facebook,
    iconColor: "text-[#1877F2]",
  },
]

export interface InstagramIntelligenceSectionProps {
  data?: InstagramIntelligenceVM | null
}

export const InstagramIntelligenceSection = ({
  data,
}: InstagramIntelligenceSectionProps) => {
  return (
    <Card id="instagram-intel" variant="profile" className="scroll-mt-32">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="im-heading-2 text-foreground">
              Social Presence &amp; Brand Signals
            </h2>
            <p className="im-text-body im-text-muted">
              Signals from the clinic&apos;s social media profiles.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-6 pt-4">
        <PlatformPillTabs
          defaultValue="instagram"
          tabs={PLATFORM_TABS}
          listClassName="mb-6"
        >
          <PlatformPillTabs.Content value="instagram" className="mt-0">
            <InstagramTabContent data={data} />
          </PlatformPillTabs.Content>
          <PlatformPillTabs.Content value="tiktok" className="mt-0">
            <EmptyState
              title="TikTok data is not available yet."
              description="Connect this profile to view insights."
            />
          </PlatformPillTabs.Content>
          <PlatformPillTabs.Content value="facebook" className="mt-0">
            <EmptyState
              title="Facebook data is not available yet."
              description="Connect this profile to view insights."
            />
          </PlatformPillTabs.Content>
        </PlatformPillTabs>
      </CardContent>
    </Card>
  )
}
