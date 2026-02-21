export default function ClinicsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="space-y-6">
        <div className="h-10 w-2/3 rounded-lg bg-muted/40 animate-pulse" />
        <div className="h-6 w-1/2 rounded-lg bg-muted/30 animate-pulse" />
        <div className="h-16 w-full rounded-2xl bg-muted/20 animate-pulse" />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="rounded-3xl border border-border/60 bg-muted/5 p-6">
            <div className="aspect-[16/9] w-full rounded-2xl bg-muted/30 animate-pulse" />
            <div className="mt-5 h-4 w-24 rounded bg-muted/40 animate-pulse" />
            <div className="mt-3 h-6 w-3/4 rounded bg-muted/40 animate-pulse" />
            <div className="mt-3 h-4 w-full rounded bg-muted/30 animate-pulse" />
            <div className="mt-6 h-4 w-1/3 rounded bg-muted/40 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
