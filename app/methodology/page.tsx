import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "How Trust Scores Work — IstanbulMedic Connect",
  description: "A transparent breakdown of how clinic trust scores are calculated.",
}

// ─── small primitives ────────────────────────────────────────────────────────

function StepLabel({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#17375B] text-xs font-bold text-white shrink-0">
        {n}
      </span>
      <h2 className="im-heading-2 text-foreground">{label}</h2>
    </div>
  )
}

function Arrow() {
  return (
    <div className="flex justify-center py-4">
      <div className="flex flex-col items-center gap-1">
        <div className="w-px h-6 bg-border" />
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="text-border">
          <path d="M6 8L0 0h12L6 8z" fill="currentColor" />
        </svg>
      </div>
    </div>
  )
}

function SourceChip({
  label,
  sublabel,
  dim,
}: {
  label: string
  sublabel?: string
  dim?: boolean
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border px-4 py-3 text-center min-w-[100px] ${
        dim
          ? "border-border/30 bg-muted/5 opacity-50"
          : "border-border bg-muted/5"
      }`}
    >
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {sublabel && (
        <span className="text-xs text-muted-foreground mt-0.5">{sublabel}</span>
      )}
    </div>
  )
}

function PillarCard({
  title,
  weight,
  color,
  inputs,
  note,
}: {
  title: string
  weight: string
  color: string
  inputs: { label: string; detail?: string; dim?: boolean }[]
  note?: string
}) {
  return (
    <div className={`rounded-xl border-2 ${color} p-5 flex flex-col gap-4`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-base font-semibold text-foreground leading-tight">{title}</p>
        <span className="shrink-0 rounded-full bg-[#17375B] px-2.5 py-0.5 text-xs font-bold text-white">
          {weight}
        </span>
      </div>
      <ul className="space-y-2">
        {inputs.map((inp) => (
          <li
            key={inp.label}
            className={`flex items-start gap-2 ${inp.dim ? "opacity-40" : ""}`}
          >
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#3EBBB7] shrink-0" />
            <div>
              <span className="text-sm text-foreground">{inp.label}</span>
              {inp.detail && (
                <span className="text-xs text-muted-foreground ml-1">— {inp.detail}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
      {note && (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 leading-relaxed">
          {note}
        </p>
      )}
    </div>
  )
}

function SourceScoreCard({
  name,
  sublabel,
  dim,
  disclaimer,
  inputs,
}: {
  name: string
  sublabel?: string
  dim?: boolean
  disclaimer?: string
  inputs: { label: string; detail: string }[]
}) {
  return (
    <div className={`rounded-xl border p-5 flex flex-col gap-3 ${dim ? "opacity-50 border-border/40 bg-muted/5" : "border-border bg-muted/5"}`}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{name}</p>
          {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
        </div>
        {dim && (
          <span className="shrink-0 rounded-full border border-border/40 px-2 py-0.5 text-xs text-muted-foreground">
            coming soon
          </span>
        )}
      </div>
      {!dim && (
        <ul className="space-y-1.5">
          {inputs.map((inp) => (
            <li key={inp.label} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#3EBBB7] shrink-0" />
              <span className="text-sm text-foreground">
                {inp.label}
                <span className="text-xs text-muted-foreground ml-1">— {inp.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {disclaimer && (
        <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
          {disclaimer}
        </p>
      )}
    </div>
  )
}

const BANDS = [
  { band: "A", label: "Excellent", range: "80–100", color: "bg-emerald-50 border-emerald-200 text-emerald-700", dot: "bg-emerald-500" },
  { band: "B", label: "Good",      range: "70–79",  color: "bg-blue-50 border-blue-200 text-blue-700",         dot: "bg-blue-500"    },
  { band: "C", label: "Fair",      range: "60–69",  color: "bg-amber-50 border-amber-200 text-amber-700",       dot: "bg-amber-500"   },
  { band: "D", label: "Limited",   range: "0–59",   color: "bg-red-50 border-red-200 text-red-700",             dot: "bg-red-500"     },
]

// ─── page ─────────────────────────────────────────────────────────────────────

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/60 bg-muted/5">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <p className="text-sm font-medium text-[#3EBBB7] mb-2 uppercase tracking-wider">
            Scoring Methodology
          </p>
          <h1 className="im-heading-1 text-foreground mb-4">How Trust Scores Work</h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
            Every clinic gets a Trust Score built from public data across independent sources.
            Here&apos;s how raw data becomes a number you can act on.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10">

        {/* ── Step 1: Sources ── */}
        <StepLabel n={1} label="We gather data from public sources" />

        <div className="flex flex-wrap gap-3 justify-center">
          <SourceChip label="Google" sublabel="Rating + reviews" />
          <SourceChip label="Reddit" sublabel="Forum discussions" />
          <SourceChip label="HRN" sublabel="Case threads" dim />
          <SourceChip label="Instagram" sublabel="Social presence" />
          <SourceChip label="Registry" sublabel="Ministry records" />
          <SourceChip label="Credentials" sublabel="Accreditations" />
        </div>

        <p className="text-xs text-center text-muted-foreground mt-3">
          HRN data pipeline is not yet live — its weight currently redistributes to Google.
        </p>

        <Arrow />

        {/* ── Step 2: Pillars ── */}
        <StepLabel n={2} label="Signals flow into two pillars" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PillarCard
            title="Reputation"
            weight="60% of final score"
            color="border-[#17375B]/20"
            inputs={[
              { label: "Google star rating",   detail: "40%" },
              { label: "Google review volume", detail: "20%" },
              { label: "Reddit sentiment",     detail: "25%" },
              { label: "HRN sentiment",        detail: "15%", dim: true },
              { label: "Instagram boost",      detail: "small bonus" },
            ]}
            note="HRN not yet live — its 15% is temporarily added to the Google star rating (not review volume), so rating runs at 55% until HRN data is active. Caution/repair signals from Reddit are folded into the sentiment score directly (reducing it) rather than being a separate penalty term — this keeps the weights clean at 100%."
          />
          <PillarCard
            title="Evidence & Transparency"
            weight="40% of final score"
            color="border-[#3EBBB7]/30"
            inputs={[
              { label: "Google review volume",         detail: "20%" },
              { label: "Reddit unique voices",         detail: "15%" },
              { label: "Reddit long-term evidence",    detail: "15%" },
              { label: "Reddit thread count",          detail: "5%" },
              { label: "Credentials & accreditations", detail: "15%" },
              { label: "Registry listed",              detail: "10%" },
              { label: "Active licence",               detail: "5%" },
              { label: "Source breadth",               detail: "15%" },
              { label: "HRN threads & photo followups", detail: "coming soon", dim: true },
            ]}
            note="Missing data uses a neutral floor (not zero) so absence of data ≠ a bad clinic."
          />
        </div>

        <Arrow />

        {/* ── Step 3: Blend ── */}
        <StepLabel n={3} label="The two pillars blend into a final score" />

        <div className="rounded-xl border border-border bg-muted/5 p-6">
          <div className="flex flex-col sm:flex-row items-stretch gap-4">
            <div className="flex-1 flex flex-col items-center justify-center rounded-lg bg-background border border-border px-4 py-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Reputation</p>
              <p className="text-3xl font-bold text-[#17375B]">× 0.60</p>
            </div>
            <div className="flex items-center justify-center text-xl font-light text-muted-foreground">+</div>
            <div className="flex-1 flex flex-col items-center justify-center rounded-lg bg-background border border-border px-4 py-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Evidence & Transparency</p>
              <p className="text-3xl font-bold text-[#3EBBB7]">× 0.40</p>
            </div>
            <div className="flex items-center justify-center text-xl font-light text-muted-foreground">=</div>
            <div className="flex-1 flex flex-col items-center justify-center rounded-lg bg-[#17375B] px-4 py-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-1">Trust Score</p>
              <p className="text-3xl font-bold text-white">0–100</p>
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-4 leading-relaxed">
            Reputation leads because it&apos;s the most intuitive public signal. Evidence &
            Transparency carries enough weight to meaningfully shift the final score.
          </p>
        </div>

        <Arrow />

        {/* ── Step 4: Bands ── */}
        <StepLabel n={4} label="Scores map to a band" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {BANDS.map(({ band, label, range, color, dot }) => (
            <div key={band} className={`rounded-xl border p-4 text-center ${color}`}>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className={`h-2 w-2 rounded-full ${dot}`} />
                <span className="text-lg font-bold">{band}</span>
              </div>
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-xs mt-0.5 opacity-75">{range}</p>
            </div>
          ))}
        </div>

        {/* ── Source scores ── */}
        <div className="mt-10">
          <p className="text-base font-semibold text-foreground mb-1">Source scores shown on clinic profiles</p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
            Alongside the overall Trust Score, clinic profiles show a score for each major source —
            Google and Reddit. These are calculated independently from the pillar scores, using the
            same underlying data but weighted differently: each source score is designed to answer
            &ldquo;what does this source alone say about this clinic?&rdquo; rather than how much it
            contributes to the final blend.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SourceScoreCard
              name="Google"
              inputs={[
                { label: "Star rating", detail: "75% — primary signal" },
                { label: "Review count", detail: "25% — credibility modifier" },
              ]}
              disclaimer="Rating-heavy because that's what users mean by 'Google reputation'. Review count adds context but doesn't overpower the rating itself."
            />
            <SourceScoreCard
              name="Reddit"
              inputs={[
                { label: "Sentiment", detail: "community tone, caution-adjusted" },
                { label: "Recency", detail: "older threads weighted down" },
                { label: "Discussion depth", detail: "long-term followups rewarded" },
                { label: "Community size", detail: "Bayesian confidence scaling" },
              ]}
              disclaimer="Uses a separate forum scoring algorithm — not the same weights as the Reputation pillar. Sparse or low-confidence data shrinks the score toward a neutral baseline rather than awarding a high score."
            />
            <SourceScoreCard
              name="HRN"
              sublabel="Hair Restoration Network"
              dim
              inputs={[]}
            />
          </div>
        </div>

        {/* ── What we don't score publicly ── */}
        <div className="mt-10 rounded-xl border border-border bg-muted/5 p-6">
          <p className="text-sm font-semibold text-foreground mb-3">
            What we don&apos;t show as a public score
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Some signals feed the pillars internally but don&apos;t become a standalone public number.
            This keeps the scorecard readable and avoids rating things that are too thin, too
            sensitive, or too easy to misread.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              "Website disclosure",
              "Registry detail",
              "Doctor credentials",
              "Instagram",
            ].map((label) => (
              <span
                key={label}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* ── How we normalise ── */}
        <div className="mt-10 rounded-xl border border-border bg-muted/5 p-6 space-y-3">
          <p className="text-sm font-semibold text-foreground">How raw numbers become scores</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Every metric starts as a raw number — star ratings, review counts, forum thread volumes.
            We convert these to 0–100 values by looking at the real distribution across all clinics
            in our database, then normalising to reflect what actually separates them.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            For ratings we anchor to the realistic range, so the spread that exists in practice
            maps meaningfully across the full scale rather than compressing everyone into a narrow band.
            For counts — reviews, forum threads, unique voices — we use a log scale so that going from
            0 to 50 discussions matters more than going from 500 to 1,000.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            When a data source has no data for a clinic, we use a neutral floor rather than zero.
            Absence of information isn&apos;t the same as bad information, and we don&apos;t want gaps
            in our coverage to unfairly punish a clinic.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">
            Scores are computed automatically from public data and updated as new information
            becomes available. They do not constitute medical advice or endorsement of any clinic.
          </p>
          <Link
            href="/clinics"
            className="shrink-0 text-sm font-medium text-[#3EBBB7] hover:underline"
          >
            ← Browse clinics
          </Link>
        </div>

      </div>
    </div>
  )
}
