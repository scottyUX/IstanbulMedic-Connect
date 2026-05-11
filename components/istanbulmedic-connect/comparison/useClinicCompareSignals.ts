"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { getMockHRNSignals } from "@/lib/api/hrn.mock"
import type { HRNSignalsData } from "@/components/istanbulmedic-connect/profile/HRNSignalsCard"

export interface RedditSignals {
  threadCount: number
  photoThreadCount: number
  longtermThreadCount: number
  repairMentionCount: number
  sentimentScore: number | null
  sentimentDistribution: Record<string, number>
  aiSummary: string | null
  commonConcerns: string[]
}

export type RegistryLicenseStatus = "active" | "expired" | "suspended" | "revoked" | "pending"

export interface ClinicRegistryRecord {
  source: string
  licenseNumber: string
  licenseStatus: RegistryLicenseStatus
  licensedSince: string | null
  expiresAt: string | null
  registryUrl: string | null
}

export interface ClinicCompareSignals {
  instagram: {
    followerCount: number | null
    handle: string | null
    engagementRate: number | null
  } | null
  reddit: RedditSignals | null
  hrn: HRNSignalsData | null
  registryRecords: ClinicRegistryRecord[]
  extraImages: string[]
}

export function useClinicCompareSignals(clinicId: string | null, clinicName = ""): {
  data: ClinicCompareSignals | null
  loading: boolean
} {
  const [data, setData] = useState<ClinicCompareSignals | null>(null)
  const [loadedId, setLoadedId] = useState<string | null>(null)
  const loading = clinicId != null && loadedId !== clinicId

  useEffect(() => {
    if (!clinicId) return

    let cancelled = false
    const supabase = createClient()
    if (!supabase) return

    Promise.all([
      supabase
        .from("clinic_social_media")
        .select("follower_count, account_handle")
        .eq("clinic_id", clinicId)
        .eq("platform", "instagram")
        .maybeSingle(),

      supabase
        .from("clinic_facts")
        .select("fact_key, fact_value")
        .eq("clinic_id", clinicId)
        .in("fact_key", ["instagram_engagement_rate"]),

      supabase
        .from("clinic_forum_profiles")
        .select(
          "thread_count, photo_thread_count, longterm_thread_count, repair_mention_count, sentiment_score, sentiment_distribution, summary, common_concerns"
        )
        .eq("clinic_id", clinicId)
        .eq("forum_source", "reddit")
        .maybeSingle(),

      supabase
        .from("clinic_registry_records")
        .select("source, license_number, license_status, licensed_since, expires_at, registry_url")
        .eq("clinic_id", clinicId),

      supabase
        .from("clinic_media")
        .select("url, display_order")
        .eq("clinic_id", clinicId)
        .eq("media_type", "image")
        .order("display_order", { ascending: true })
        .limit(4),

      Promise.resolve(
        process.env.NEXT_PUBLIC_USE_MOCK_HRN === "true"
          ? getMockHRNSignals(clinicId, clinicName)
          : null
      ),
    ])
      .then(([social, facts, redditRow, creds, media, hrn]) => {
        const factsMap: Record<string, unknown> = {}
        for (const f of facts.data ?? []) factsMap[f.fact_key] = f.fact_value

        const rawRate = factsMap.instagram_engagement_rate
        const engagementRate =
          rawRate != null ? parseFloat(String(rawRate)) || null : null

        const r = redditRow.data
        const reddit: RedditSignals | null = r
          ? {
              threadCount: r.thread_count ?? 0,
              photoThreadCount: r.photo_thread_count ?? 0,
              longtermThreadCount: r.longterm_thread_count ?? 0,
              repairMentionCount: r.repair_mention_count ?? 0,
              sentimentScore:
                r.sentiment_score != null ? Number(r.sentiment_score) : null,
              sentimentDistribution:
                (r.sentiment_distribution as Record<string, number>) ?? {},
              aiSummary: r.summary ?? null,
              commonConcerns: (r.common_concerns as string[]) ?? [],
            }
          : null

        const registryRecords: ClinicRegistryRecord[] = (creds.data ?? []).map((c) => ({
          source: c.source,
          licenseNumber: c.license_number,
          licenseStatus: c.license_status as RegistryLicenseStatus,
          licensedSince: c.licensed_since,
          expiresAt: c.expires_at,
          registryUrl: c.registry_url,
        }))

        // Skip index 0 — primary image already shown via clinic.image
        const extraImages = (media.data ?? [])
          .map((m) => m.url)
          .filter(Boolean)
          .slice(1, 3) as string[]

        if (cancelled) return
        setData({
          instagram: social.data
            ? {
                followerCount: social.data.follower_count,
                handle: social.data.account_handle,
                engagementRate,
              }
            : null,
          reddit,
          hrn: hrn ?? null,
          registryRecords,
          extraImages,
        })
        setLoadedId(clinicId)
      })
      .catch(() => { if (!cancelled) setLoadedId(clinicId) })

    return () => { cancelled = true }
  }, [clinicId, clinicName])

  return { data: loading ? null : data, loading }
}
