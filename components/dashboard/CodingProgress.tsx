import Link from "next/link";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
import {
  CodingProgressError,
  getCodingProgress,
} from "@/lib/dashboard/coding-progress";
import { measureServerData } from "@/lib/supabase/diagnostics";
import { Code2, CheckCircle2, Gauge, Trophy } from "lucide-react";

const difficultyClasses = {
  easy: "text-success",
  medium: "text-warning",
  hard: "text-error",
} as const;

function formatStatus(status: string): string {
  return status.replaceAll("_", " ");
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export async function CodingProgress() {
  let progress: Awaited<ReturnType<typeof getCodingProgress>>;
  try {
    progress = await measureServerData(
      "/dashboard",
      "coding progress data",
      getCodingProgress
    );
  } catch (error) {
    if (!(error instanceof CodingProgressError)) throw error;
    return (
      <section
        role="alert"
        className="rounded-xl border border-border bg-bg-card p-5 text-sm text-text-secondary"
      >
        {error.message}
      </section>
    );
  }
  const statCards = [
    { label: "Problems solved", value: progress.totals.solved, icon: Trophy },
    { label: "Easy", value: progress.totals.easy, tone: "text-success" },
    { label: "Medium", value: progress.totals.medium, tone: "text-warning" },
    { label: "Hard", value: progress.totals.hard, tone: "text-error" },
    { label: "Submissions", value: progress.totals.submissions, icon: Code2 },
    {
      label: "Acceptance rate",
      value: `${progress.totals.acceptanceRate.toFixed(1)}%`,
      icon: Gauge,
    },
  ];

  return (
    <div className="space-y-5">
      <section aria-label="Coding statistics" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {statCards.map(({ label, value, icon: Icon, tone }) => (
          <article key={label} className="rounded-xl border border-border bg-bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-text-muted">{label}</p>
              {Icon && <Icon size={15} className="text-accent-secondary" aria-hidden />}
            </div>
            <p className={`mt-2 text-2xl font-semibold tabular-nums ${tone ?? "text-text-primary"}`}>
              {value}
            </p>
            {label === "Acceptance rate" && (
              <p className="mt-1 text-[11px] text-text-muted">
                {progress.totals.accepted} of {progress.totals.judged} judged
              </p>
            )}
          </article>
        ))}
      </section>

      <ActivityHeatmap
        timestamps={progress.activity}
        hasSubmissions={progress.totals.submissions > 0}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <section className="rounded-xl border border-border bg-bg-card p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 size={17} className="text-accent-secondary" aria-hidden />
            <h2 className="text-base font-semibold text-text-primary">Solved by topic</h2>
          </div>
          {progress.topics.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-text-muted">
              Solve a problem to see your topic breakdown.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {progress.topics.map((topic) => (
                <li key={topic.slug}>
                  <Link
                    href={`/problems?topic=${encodeURIComponent(topic.slug)}`}
                    className="flex min-h-11 items-center justify-between gap-3 py-2 text-sm hover:text-accent-secondary"
                  >
                    <span className="truncate text-text-primary">{topic.name}</span>
                    <span className="shrink-0 rounded-full bg-bg-overlay px-2.5 py-1 text-xs tabular-nums text-text-secondary">
                      {topic.solved}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border bg-bg-card p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-text-primary">Recent submissions</h2>
            <Link href="/problems" className="text-xs font-medium text-accent-secondary hover:text-text-primary">
              Browse problems
            </Link>
          </div>
          {progress.recent.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-text-muted">
              Your submissions will appear here after you try a problem.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {progress.recent.map((submission) => (
                <li key={submission.id} className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
                  <div className="min-w-0 flex-1">
                    {submission.problemSlug ? (
                      <Link
                        href={`/problems/${submission.problemSlug}`}
                        className="block truncate text-sm font-medium text-text-primary hover:text-accent-secondary"
                      >
                        {submission.problemTitle}
                      </Link>
                    ) : (
                      <span className="block truncate text-sm font-medium text-text-primary">
                        {submission.problemTitle}
                      </span>
                    )}
                    <p className="mt-1 text-xs text-text-muted">
                      <span className={submission.difficulty ? difficultyClasses[submission.difficulty] : ""}>
                        {submission.difficulty ?? "Unknown difficulty"}
                      </span>
                      <span aria-hidden> · </span>
                      {submission.language.toUpperCase()}
                      <span aria-hidden> · </span>
                      {formatDate(submission.createdAt)}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs capitalize ${
                    submission.status === "accepted"
                      ? "bg-success/10 text-success"
                      : "bg-bg-overlay text-text-secondary"
                  }`}>
                    {formatStatus(submission.status)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
