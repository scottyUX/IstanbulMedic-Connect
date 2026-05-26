"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { getMockHRNSignals } from "@/lib/api/hrn.mock"
import type { HRNSignalsData } from "@/components/istanbulmedic-connect/profile/HRNSignalsCard"

export interface RedditSignals {
  score: number | null
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

export interface GoogleReview {
  rating: number | null
  text: string
  date: string | null
  sourceName: string | null
}

export interface GooglePlacesSignals {
  starCounts: Record<1 | 2 | 3 | 4 | 5, number>
  reviews: GoogleReview[]
}

export interface ClinicCompareSignals {
  instagram: {
    followerCount: number | null
    handle: string | null
    engagementRate: number | null
  } | null
  reddit: RedditSignals | null
  googlePlaces: GooglePlacesSignals | null
  hrn: HRNSignalsData | null
  registryRecords: ClinicRegistryRecord[]
  extraImages: string[]
}

type ReviewSource = {
  source_name: string | null
  source_type: string | null
}

type ReviewSourceRow = ReviewSource | ReviewSource[] | null

type ReviewRow = {
  rating: string | null
  review_text: string
  review_date: string | null
  sources?: ReviewSourceRow
}

function parseRating(raw: string | null): number | null {
  if (!raw) return null
  const match = raw.match(/\d+(?:\.\d+)?/)
  if (!match) return null

  const value = Number(match[0])
  if (!Number.isFinite(value)) return null

  return Math.min(5, Math.max(1, Math.round(value)))
}

function getSource(row: ReviewRow): { sourceName: string | null; sourceType: string | null } {
  const source = Array.isArray(row.sources) ? row.sources[0] : row.sources
  return {
    sourceName: source?.source_name ?? null,
    sourceType: source?.source_type ?? null,
  }
}

function isGoogleReview(row: ReviewRow) {
  const { sourceName, sourceType } = getSource(row)
  const sourceText = `${sourceName ?? ""} ${sourceType ?? ""}`.toLowerCase()
  return sourceText.includes("google")
}

function buildGooglePlacesSignals(rows: ReviewRow[]): GooglePlacesSignals {
  const starCounts: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  }

  const reviews = rows
    .filter(isGoogleReview)
    .map((row) => {
      const rating = parseRating(row.rating)
      if (rating) starCounts[rating as 1 | 2 | 3 | 4 | 5] += 1

      return {
        rating,
        text: row.review_text,
        date: row.review_date,
        sourceName: getSource(row).sourceName,
      }
    })

  return { starCounts, reviews: reviews.slice(0, 5) }
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
          "score, thread_count, photo_thread_count, longterm_thread_count, repair_mention_count, sentiment_score, sentiment_distribution, summary, common_concerns"
        )
        .eq("clinic_id", clinicId)
        .eq("forum_source", "reddit")
        .maybeSingle(),

      supabase
        .from("clinic_registry_records")
        .select("source, license_number, license_status, licensed_since, expires_at, registry_url")
        .eq("clinic_id", clinicId),

      supabase
        .from("clinic_reviews")
        .select("rating, review_text, review_date, sources (source_name, source_type)")
        .eq("clinic_id", clinicId)
        .order("review_date", { ascending: false, nullsFirst: false })
        .limit(100),

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
      .then(([social, facts, redditRow, creds, reviews, media, hrn]) => {
        const factsMap: Record<string, unknown> = {}
        for (const f of facts.data ?? []) factsMap[f.fact_key] = f.fact_value

        const rawRate = factsMap.instagram_engagement_rate
        const engagementRate =
          rawRate != null ? parseFloat(String(rawRate)) || null : null

        const r = redditRow.data
        const reddit: RedditSignals | null = r
          ? {
              score: r.score ?? null,
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

        const googlePlaces = buildGooglePlacesSignals((reviews.data ?? []) as ReviewRow[])

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
          googlePlaces,
          hrn: hrn ?? null,
          registryRecords,
          extraImages,
        })
        setLoadedId(clinicId)
      })
      .catch(() => { if (!cancelled) { setData(null); setLoadedId(clinicId) } })

    return () => { cancelled = true }
  }, [clinicId, clinicName])

  return { data: loading ? null : data, loading }
}
