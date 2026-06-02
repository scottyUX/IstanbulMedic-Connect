"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { StatBlock } from "@/components/ui/stat-block"
import { GoogleIcon } from "@/components/icons/GoogleIcon"

interface ScoreComponent {
  component_key: string
  score: number
  weight: number
  explanation?: string | null
}

interface ClinicSourceScore {
  source_name: string
  summary_score: number
  confidence_score: number | null
  is_current: boolean
}

interface ScoreBreakdownCardProps {
  overallScore: number
  band: "A" | "B" | "C" | "D" | null
  scoreComponents: ScoreComponent[]
  sourceScores?: ClinicSourceScore[]
}

const BAND_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  A: { label: "Excellent", color: "text-emerald-700", bg: "bg-emerald-50" },
  B: { label: "Good",      color: "text-blue-700",    bg: "bg-blue-50"    },
  C: { label: "Fair",      color: "text-amber-700",   bg: "bg-amber-50"   },
  D: { label: "Limited",   color: "text-red-700",     bg: "bg-red-50"     },
}

const PILLAR_CONFIG: Record<string, { label: string; description: string }> = {
  reputation: {
    label: "Reputation",
    description: "Based on Google rating, review volume, Reddit sentiment, and social presence.",
  },
  evidence_transparency: {
    label: "Evidence & Transparency",
    description: "Based on verified credentials, registry records, forum discussion depth, and source breadth.",
  },
}

const SOURCE_CONFIG: Record<string, { label: string; icon: string }> = {
  google:   { label: "Google",  icon: "G" },
  reddit:   { label: "Reddit",  icon: "R" },
  instagram: { label: "Instagram", icon: "I" },
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="relative h-2 w-full rounded-full bg-muted/20 overflow-hidden">
      <div
        className="absolute left-0 top-0 h-full rounded-full bg-[#17375B] transition-all duration-500"
        style={{ width: `${score}%` }}
      />
    </div>
  )
}

export const ScoreBreakdownCard = ({
  overallScore,
  band,
  scoreComponents,
  sourceScores = [],
}: ScoreBreakdownCardProps) => {
  const bandConfig = band ? BAND_CONFIG[band] : null

  const reputation = scoreComponents.find((c) => c.component_key === "reputation")
  const evidence = scoreComponents.find((c) => c.component_key === "evidence_transparency")
  const pillars = [reputation, evidence].filter(Boolean) as ScoreComponent[]

  // Only show Google and Reddit — not Instagram (per architecture doc)
  const publicSources = sourceScores.filter(
    (s) => s.is_current && ["google", "reddit", "instagram"].includes(s.source_name)
  )

  return (
    <Card id="score-breakdown" variant="profile" className="scroll-mt-32">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="im-heading-2 text-foreground">Trust Score</h2>
            <p className="text-base text-muted-foreground">
              Computed from public signals across multiple sources.
            </p>
          </div>
          <div className="flex flex-col items-center shrink-0">
            <StatBlock
              label="Overall"
              value={overallScore}
              variant="centered"
              className="px-4 py-3"
              labelClassName="font-medium uppercase tracking-wider"
              valueClassName="text-4xl font-bold text-[#17375B]"
            />
            {bandConfig && (
              <span
                className={`mt-1 rounded-full px-3 py-0.5 text-xs font-semibold ${bandConfig.bg} ${bandConfig.color}`}
              >
                {band} — {bandConfig.label}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Source score tiles */}
        {publicSources.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {publicSources.map((source) => {
              const config = SOURCE_CONFIG[source.source_name]
              if (!config) return null
              return (
                <div
                  key={source.source_name}
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted/5 px-3 py-2"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#17375B] text-xs font-bold text-white shrink-0">
                    {source.source_name === 'google'
                      ? <GoogleIcon className="h-3.5 w-3.5 text-white" />
                      : config.icon}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">{config.label}</span>
                    <span className="text-sm font-semibold text-foreground">{source.summary_score}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pillar breakdown */}
        {pillars.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pillars.map((pillar) => {
              const config = PILLAR_CONFIG[pillar.component_key]
              const weightPct = Math.round(pillar.weight * 100)
              return (
                <div
                  key={pillar.component_key}
                  className="flex flex-col gap-3 rounded-xl bg-muted/5 p-4 h-full"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-foreground leading-tight">
                      {config?.label ?? pillar.component_key}
                    </span>
                    <span className="text-2xl font-bold text-[#17375B]">{pillar.score}</span>
                  </div>
                  <ScoreBar score={pillar.score} />
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {config?.description}
                    </p>
                    <span className="ml-4 shrink-0 text-xs text-muted-foreground">
                      {weightPct}% weight
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-base text-muted-foreground italic">
            Score breakdown not available yet.
          </p>
        )}

        <p className="text-xs text-muted-foreground pt-1">
          Scores are computed automatically and updated as new data becomes available.
          They do not constitute medical advice or endorsement.
        </p>
      </CardContent>
    </Card>
  )
}
