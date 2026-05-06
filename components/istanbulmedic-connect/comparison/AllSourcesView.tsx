"use client"

import Image from "next/image"
import Link from "next/link"
import { MapPin, Star, ArrowLeft, Dot, ExternalLink } from "lucide-react"
import { Merriweather } from "next/font/google"

import { Button } from "@/components/ui/button"
import { SpecialtyTag, TAG_VARIANT_SEQUENCE } from "@/components/ui/specialty-tag"
import { cn } from "@/lib/utils"
import type { ClinicListItem } from "@/lib/api/clinics"
import {
  useClinicCompareSignals,
  type RedditSignals,
  type ClinicRegistryRecord,
  type RegistryLicenseStatus,
} from "./useClinicCompareSignals"

const merriweather = Merriweather({ subsets: ["latin"], weight: ["700"] })

interface AllSourcesViewProps {
  clinic: ClinicListItem
  onDeselect: () => void
  accentClass: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatCount(n: number | null | undefined): string {
  if (n == null) return "—"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function sentimentInfo(score: number): { label: string; className: string; dotClass: string } {
  if (score >= 0.65)
    return { label: "Mostly positive", className: "bg-emerald-50 text-emerald-700 border-emerald-200", dotClass: "bg-emerald-500" }
  if (score >= 0.45)
    return { label: "Mixed", className: "bg-amber-50 text-amber-700 border-amber-200", dotClass: "bg-amber-400" }
  return { label: "Mostly negative", className: "bg-rose-50 text-rose-700 border-rose-200", dotClass: "bg-rose-500" }
}

function engagementInfo(rate: number): { label: string; className: string } {
  if (rate > 0.03) return { label: "High", className: "text-emerald-600" }
  if (rate > 0.01) return { label: "Average", className: "text-amber-600" }
  return { label: "Low", className: "text-rose-500" }
}

const SOURCE_LABELS: Record<string, string> = {
  turkish_ministry_of_health: "Turkish Ministry of Health",
}

const STATUS_STYLES: Record<RegistryLicenseStatus, { label: string; className: string }> = {
  active:    { label: "Active",    className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  expired:   { label: "Expired",   className: "bg-rose-50 text-rose-700 border-rose-200" },
  suspended: { label: "Suspended", className: "bg-amber-50 text-amber-700 border-amber-200" },
  revoked:   { label: "Revoked",   className: "bg-rose-50 text-rose-700 border-rose-200" },
  pending:   { label: "Pending",   className: "bg-muted/60 text-muted-foreground border-border/60" },
}

// ── Shared primitives ──────────────────────────────────────────────────────

function NoData({ label = "No data" }: { label?: string }) {
  return <span className="text-xs italic text-muted-foreground/60">{label}</span>
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  )
}

function ForumBullet({ count, label }: { count: number; label: string }) {
  return (
    <li className="flex items-center gap-1.5 text-sm text-foreground">
      <Dot className="h-4 w-4 shrink-0 text-muted-foreground/50" />
      <span className="font-semibold tabular-nums">{count.toLocaleString()}</span>
      <span className="text-muted-foreground">{label}</span>
    </li>
  )
}

// ── Reddit section ─────────────────────────────────────────────────────────

function RedditSection({ reddit, loading }: { reddit: RedditSignals | null; loading: boolean }) {
  return (
    <div className="space-y-2">
      <SectionHeader>Reddit</SectionHeader>

      {loading ? (
        <span className="text-xs text-muted-foreground">—</span>
      ) : reddit ? (
        <>
          <ul className="space-y-0.5">
            <ForumBullet count={reddit.threadCount} label="threads" />
            {reddit.photoThreadCount > 0 && (
              <ForumBullet count={reddit.photoThreadCount} label="with photo evidence" />
            )}
            {reddit.longtermThreadCount > 0 && (
              <ForumBullet count={reddit.longtermThreadCount} label="with long-term evidence" />
            )}
            {reddit.repairMentionCount > 0 && (
              <ForumBullet count={reddit.repairMentionCount} label="repair mentions" />
            )}
          </ul>

          {reddit.sentimentScore != null && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                sentimentInfo(reddit.sentimentScore).className
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", sentimentInfo(reddit.sentimentScore).dotClass)} />
              {sentimentInfo(reddit.sentimentScore).label}
            </span>
          )}
        </>
      ) : (
        <NoData label="No Reddit data" />
      )}
    </div>
  )
}

// ── Registry section ──────────────────────────────────────────────────────

function RegistrySection({ records, loading }: { records: ClinicRegistryRecord[]; loading: boolean }) {
  return (
    <div className="space-y-2">
      <SectionHeader>Registry</SectionHeader>

      {loading ? (
        <span className="text-xs text-muted-foreground">—</span>
      ) : records.length > 0 ? (
        <ul className="space-y-2">
          {records.map((r, i) => (
            <li key={i} className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {SOURCE_LABELS[r.source] ?? r.source}
                </span>
                <span className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                  STATUS_STYLES[r.licenseStatus].className
                )}>
                  {STATUS_STYLES[r.licenseStatus].label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                License #{r.licenseNumber}
                {r.licensedSince && ` · Since ${new Date(r.licensedSince).getFullYear()}`}
                {r.expiresAt && ` · Expires ${new Date(r.expiresAt).getFullYear()}`}
              </p>
              {r.registryUrl && (
                <a
                  href={r.registryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[var(--im-color-primary)] hover:underline"
                >
                  View on registry
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <NoData label="No registry records found" />
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export function AllSourcesView({ clinic, onDeselect, accentClass }: AllSourcesViewProps) {
  const { data: signals, loading } = useClinicCompareSignals(clinic.id)

  const extraImages = signals?.extraImages ?? []
  const scoreOutOfTen =
    clinic.trustScore > 0 ? (clinic.trustScore / 10).toFixed(1) : null

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">

      {/* ── Image gallery ──────────────────────────────────────── */}
      <div
        className={cn(
          "grid gap-1.5 rounded-xl overflow-hidden shrink-0",
          extraImages.length > 0 ? "grid-cols-[2fr_1fr]" : "grid-cols-1"
        )}
      >
        <div className="relative aspect-video bg-muted/40">
          {clinic.image ? (
            <Image src={clinic.image} alt={clinic.name} fill sizes="33vw" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              No photo
            </div>
          )}
        </div>

        {extraImages.length > 0 && (
          <div className={cn("grid gap-1.5", extraImages.length > 1 ? "grid-rows-2" : "grid-rows-1")}>
            {extraImages.map((url, i) => (
              <div key={i} className="relative bg-muted/40 min-h-0">
                <Image
                  src={url}
                  alt={`${clinic.name} photo ${i + 2}`}
                  fill
                  sizes="12vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Clinic name + location ─────────────────────────────── */}
      <div>
        {clinic.trustBand === "A" && (
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-amber-500">
            Top rated
          </p>
        )}
        <h3 className={cn(merriweather.className, "text-lg font-bold leading-snug text-foreground")}>
          {clinic.name}
        </h3>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {clinic.location}
        </p>
      </div>

      {/* ── Specialties ───────────────────────────────────────── */}
      {clinic.specialties.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {clinic.specialties.slice(0, 4).map((s, i) => (
            <SpecialtyTag
              key={s}
              label={s}
              variant={TAG_VARIANT_SEQUENCE[i % TAG_VARIANT_SEQUENCE.length]}
            />
          ))}
        </div>
      )}

      {/* ── Overall score (clinic_scores.overall_score) ───────── */}
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          IstanbulMedic Score
        </p>
        <div className="flex items-baseline gap-1.5">
          <span className={cn("text-4xl font-bold tabular-nums leading-none", scoreOutOfTen ? accentClass : "text-muted-foreground/40")}>
            {scoreOutOfTen ?? "—"}
          </span>
          <span className="text-base text-muted-foreground font-medium">/10</span>
          {clinic.trustBand && (
            <span className="ml-1 rounded-full bg-[var(--im-color-primary)]/10 px-2.5 py-0.5 text-xs font-bold text-[var(--im-color-primary)]">
              Band {clinic.trustBand}
            </span>
          )}
        </div>
      </div>

      {/* ── Google Places ─────────────────────────────────────── */}
      <div className="space-y-1">
        <SectionHeader>Google Places</SectionHeader>
        {typeof clinic.rating === "number" ? (
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-4 w-4",
                  star <= Math.round(clinic.rating!)
                    ? "fill-[#FFD700] text-[#FFD700]"
                    : "text-muted-foreground/30"
                )}
              />
            ))}
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {clinic.rating.toFixed(1)}
            </span>
            {clinic.reviewCount ? (
              <span className="text-xs text-muted-foreground">
                ({formatCount(clinic.reviewCount)} reviews)
              </span>
            ) : null}
          </div>
        ) : (
          <NoData />
        )}
      </div>

      {/* ── Reddit ────────────────────────────────────────────── */}
      <RedditSection reddit={signals?.reddit ?? null} loading={loading} />

      {/* ── Instagram ─────────────────────────────────────────── */}
      <div className="space-y-1">
        <SectionHeader>Instagram</SectionHeader>
        {loading ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : signals?.instagram ? (
          <div className="flex items-center gap-2">
            {signals.instagram.followerCount != null && (
              <>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {formatCount(signals.instagram.followerCount)}
                </span>
                <span className="text-xs text-muted-foreground">followers</span>
              </>
            )}
            {signals.instagram.engagementRate != null && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className={cn("text-xs font-medium", engagementInfo(signals.instagram.engagementRate).className)}>
                  {engagementInfo(signals.instagram.engagementRate).label}
                </span>
                <span className="text-xs text-muted-foreground">
                  engagement — {(signals.instagram.engagementRate * 100).toFixed(1)}%
                </span>
              </>
            )}
          </div>
        ) : (
          <NoData label="No Instagram profile found" />
        )}
      </div>

      {/* ── Registry ──────────────────────────────────────────── */}
      <RegistrySection records={signals?.registryRecords ?? []} loading={loading} />

      {/* ── Actions ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 mt-auto shrink-0">
        <Button asChild size="sm" className="w-full">
          <Link href={`/clinics/${clinic.id}`}>
            View full profile
            <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={onDeselect} className="w-full">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Change clinic
        </Button>
      </div>
    </div>
  )
}
