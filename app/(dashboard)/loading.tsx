export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6" role="status" aria-busy="true">
      <span className="sr-only">Loading page…</span>
      <div className="h-8 w-56 animate-pulse rounded-lg bg-bg-card" />
      <div className="h-24 animate-pulse rounded-xl border border-border bg-bg-card" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="h-40 animate-pulse rounded-xl border border-border bg-bg-card" />
        <div className="h-40 animate-pulse rounded-xl border border-border bg-bg-card" />
        <div className="h-40 animate-pulse rounded-xl border border-border bg-bg-card" />
      </div>
    </div>
  );
}
