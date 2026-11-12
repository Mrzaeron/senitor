import { Suspense } from "react";
import { LearningInsightsDashboard } from "@/components/learning/LearningInsightsDashboard";

function InsightsFallback() {
  return (
    <div className="space-y-5" role="status" aria-busy="true">
      <span className="sr-only">Loading learning insights…</span>
      <div className="h-24 animate-pulse rounded-xl border border-border bg-bg-card" />
      <div className="h-80 animate-pulse rounded-xl border border-border bg-bg-card" />
      <div className="h-64 animate-pulse rounded-xl border border-border bg-bg-card" />
    </div>
  );
}

export default function ProgressPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
      <header className="space-y-1">
        <p className="text-sm font-medium text-accent-secondary">Student intelligence</p>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
          Learning insights
        </h1>
        <p className="text-sm text-text-secondary">
          Understand your problem-solving performance and choose your next best step.
        </p>
      </header>
      <Suspense fallback={<InsightsFallback />}>
        <LearningInsightsDashboard />
      </Suspense>
    </div>
  );
}
