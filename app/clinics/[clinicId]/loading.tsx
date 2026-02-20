export default function ClinicProfileLoading() {
  return (
    <div className="min-h-screen bg-background text-base antialiased">
      <div className="mx-auto max-w-7xl px-6 py-10 space-y-6">
        <div className="h-12 w-2/3 rounded-lg bg-muted/40 animate-pulse" />
        <div className="h-6 w-1/3 rounded-lg bg-muted/30 animate-pulse" />
        <div className="h-72 w-full rounded-3xl bg-muted/20 animate-pulse" />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="rounded-3xl border border-border/60 bg-muted/5 p-6">
                <div className="h-6 w-1/3 rounded bg-muted/40 animate-pulse" />
                <div className="mt-4 h-4 w-full rounded bg-muted/30 animate-pulse" />
                <div className="mt-2 h-4 w-5/6 rounded bg-muted/30 animate-pulse" />
              </div>
            ))}
          </div>
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-3xl border border-border/60 bg-muted/5 p-6">
              <div className="h-6 w-1/2 rounded bg-muted/40 animate-pulse" />
              <div className="mt-4 h-20 w-full rounded bg-muted/30 animate-pulse" />
            </div>
            <div className="rounded-3xl border border-border/60 bg-muted/5 p-6">
              <div className="h-6 w-2/3 rounded bg-muted/40 animate-pulse" />
              <div className="mt-4 h-24 w-full rounded bg-muted/30 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
