"use client"

import { ArrowLeft, ExternalLink, Info, MapPin, TrendingUp } from "lucide-react"
import { Merriweather } from "next/font/google"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { ClinicListItem } from "@/lib/api/clinics"
import { useClinicCompareSignals } from "./useClinicCompareSignals"

const merriweather = Merriweather({ subsets: ["latin"], weight: ["700"] })

interface InstagramViewProps {
  clinic: ClinicListItem
  onDeselect: () => void
  accentClass: string
}

function formatCount(n: number | null | undefined): string {
  if (n == null) return "—"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function engagementInfo(rate: number): { label: string; colorClass: string; barClass: string } {
  if (rate > 0.03) return { label: "High", colorClass: "text-emerald-600", barClass: "bg-emerald-500" }
  if (rate > 0.01) return { label: "Average", colorClass: "text-amber-600", barClass: "bg-amber-400" }
  return { label: "Low", colorClass: "text-rose-500", barClass: "bg-rose-400" }
}

export function InstagramView({ clinic, onDeselect, accentClass }: InstagramViewProps) {
  const { data: signals, loading } = useClinicCompareSignals(clinic.id, clinic.name)
  const ig = signals?.instagram ?? null

  const engRate = ig?.engagementRate ?? null
  const engInfo = engRate != null ? engagementInfo(engRate) : null
  const barWidth = engRate != null ? Math.min(engRate / 0.10, 1) * 100 : 0

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#bc1888] text-white">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        </div>
        <div className="min-w-0">
          <h3 className={cn(merriweather.className, "truncate text-base font-bold leading-snug text-foreground")}>
            {clinic.name}
          </h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {clinic.location}
          </p>
        </div>
      </div>

      {/* Instagram Score */}
      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Instagram Score
        </p>
        <div className="flex items-baseline gap-2">
          <span className={cn(
            "text-3xl font-bold tabular-nums",
            clinic.instagramScore != null ? accentClass : "text-muted-foreground/40"
          )}>
            {clinic.instagramScore != null ? clinic.instagramScore.toFixed(1) : "—"}
          </span>
          <span className="text-sm text-muted-foreground">/ 10</span>
          {!loading && engInfo && (
            <span className={cn("ml-auto text-xs font-medium", engInfo.colorClass)}>{engInfo.label}</span>
          )}
        </div>
      </div>

      {/* Followers */}
      <div className="rounded-xl border border-border/60 bg-white p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Followers
        </p>
        <span className={cn(
          "text-3xl font-bold tabular-nums leading-none",
          loading || !ig ? "text-muted-foreground/40" : accentClass
        )}>
          {loading ? "—" : formatCount(ig?.followerCount)}
        </span>
        {ig?.handle && (
          <p className="mt-1 text-xs text-muted-foreground">@{ig.handle}</p>
        )}
      </div>

      {/* Engagement rate */}
      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Engagement Rate
          </p>
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors" aria-label="How is engagement rate calculated?">
                <Info className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 text-sm" align="end">
              <p className="font-medium mb-2">Engagement Rate is calculated as:</p>
              <p className="text-muted-foreground">(Likes + Comments) ÷ Followers, averaged across recent posts.</p>
              <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
                <li>&lt;1% = Low</li>
                <li>1–3% = Average</li>
                <li>&gt;3% = High</li>
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                Higher engagement suggests an active, responsive online presence. It does not reflect clinical outcomes.
              </p>
            </PopoverContent>
          </Popover>
        </div>
        {loading ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : engRate != null && engInfo ? (
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className={cn("text-2xl font-bold tabular-nums", engInfo.colorClass)}>
                {(engRate * 100).toFixed(1)}%
              </span>
              <span className={cn("text-sm font-medium", engInfo.colorClass)}>
                {engInfo.label}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
              <div className={cn("h-full rounded-full", engInfo.barClass)} style={{ width: `${barWidth}%` }} />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {"<1% = low · 1–3% = average · >3% = high"}
            </p>
          </div>
        ) : (
          <span className="text-xs italic text-muted-foreground/60">No engagement data</span>
        )}
      </div>

      {/* Profile link */}
      {ig?.handle ? (
        <a
          href={`https://instagram.com/${ig.handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl border border-border/60 bg-white p-3 hover:border-[var(--im-color-primary)]/40 hover:shadow-sm transition-all group"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground group-hover:underline">@{ig.handle}</p>
            <p className="text-xs text-muted-foreground">View their posts and comments</p>
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
        </a>
      ) : !loading && (
        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-white p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted/40">
            <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </div>
          <p className="text-xs italic text-muted-foreground/60">No Instagram profile found</p>
        </div>
      )}

      <Button variant="outline" size="sm" onClick={onDeselect} className="w-full shrink-0 mt-auto">
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Change clinic
      </Button>
    </div>
  )
}
