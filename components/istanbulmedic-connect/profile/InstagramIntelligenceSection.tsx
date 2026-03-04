"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { InstagramIntelligenceVM } from "@/components/istanbulmedic-connect/types"
import { InstagramTabContent } from "./instagram/InstagramTabContent"

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
        <InstagramTabContent data={data} />
      </CardContent>
    </Card>
  )
}
