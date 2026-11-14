import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { CodingProgress } from "@/components/dashboard/CodingProgress";
import {
  LearningOverview,
  LearningProgressErrorState,
} from "@/components/learn/LearningProgressSummary";
import {
  getLastLearningPosition,
  getOverallLearningProgress,
  LearningProgressError,
} from "@/lib/learning/progress";
import { measureServerData } from "@/lib/supabase/diagnostics";
import {
  ArrowRight,
  BrainCircuit,
  BookOpen,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
      <header className="space-y-1">
        <p className="text-sm font-medium text-accent-secondary">Your practice</p>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
          Coding dashboard
        </h1>
        <p className="text-sm text-text-secondary">
          Track your problem-solving progress and keep building your DSA skills.
        </p>
      </header>

      <Card className="border-border bg-bg-card shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-accent-secondary">
            <BrainCircuit size={17} aria-hidden />
            <CardTitle className="text-base font-semibold">
              Learning Insights
            </CardTitle>
          </div>
          <CardDescription>
            Review your attempts, accuracy, topic mastery, recent trend, and lesson completion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/progress"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-accent-secondary hover:text-text-primary"
          >
            Open Learning Insights <ArrowRight size={16} aria-hidden />
          </Link>
        </CardContent>
      </Card>

      <Suspense fallback={<CodingProgressFallback />}>
        <CodingProgress />
      </Suspense>

      <Suspense fallback={<DashboardLearningFallback />}>
        <DashboardLearning />
      </Suspense>
    </div>
  );
}

async function DashboardLearning() {
  await connection();
  const result = await loadDashboardLearning();
  if ("error" in result && typeof result.error === "string") {
    return <LearningProgressErrorState message={result.error} />;
  }

  const { progress, lastPosition } = result;

  return (
    <>
      <LearningOverview progress={progress} />

      <Card className="border-border bg-bg-card shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-accent-secondary">
            <BookOpen size={17} aria-hidden />
            <CardTitle className="text-base font-semibold">
              Continue learning
            </CardTitle>
          </div>
          <CardDescription>
            Pick up where you last visited in the curriculum.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lastPosition ? (
            <Link
              href={`/learn/${lastPosition.topic_slug}/${lastPosition.subtopic_slug}/${lastPosition.lesson_slug}`}
              className="group flex flex-col gap-3 rounded-xl border border-border bg-bg-secondary p-4 transition-colors hover:border-border-accent sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold text-text-primary group-hover:text-accent-secondary">
                  {lastPosition.lesson_title}
                </span>
                <span className="mt-1 block truncate text-sm text-text-secondary">
                  {lastPosition.topic_name} <span aria-hidden>·</span>{" "}
                  {lastPosition.subtopic_name}
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-accent-secondary">
                {lastPosition.progress_status === "completed"
                  ? "Revisit lesson"
                  : "Resume lesson"}
                <ArrowRight size={16} aria-hidden />
              </span>
            </Link>
          ) : (
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-bg-secondary p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-text-secondary">
                Start a lesson to create your learning history and continue
                from here next time.
              </p>
              <Link
                href="/learn"
                className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-accent-secondary hover:text-text-primary"
              >
                Browse curriculum <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

async function loadDashboardLearning() {
  try {
    const result = await measureServerData(
      "/dashboard",
      "learning progress data",
      () =>
        Promise.all([
          getOverallLearningProgress(),
          getLastLearningPosition(),
        ])
    );
    const [progress, lastPosition] = result;
    return { progress, lastPosition };
  } catch (error) {
    if (error instanceof LearningProgressError) {
      return { error: error.message };
    }
    throw error;
  }
}

function CodingProgressFallback() {
  return (
    <div className="space-y-5" role="status" aria-busy="true">
      <span className="sr-only">Loading coding progress…</span>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-xl border border-border bg-bg-card" />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-xl border border-border bg-bg-card" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-xl border border-border bg-bg-card" />
        <div className="h-64 animate-pulse rounded-xl border border-border bg-bg-card" />
      </div>
    </div>
  );
}

function DashboardLearningFallback() {
  return (
    <div className="space-y-4" role="status" aria-busy="true">
      <span className="sr-only">Loading curriculum progress…</span>
      <div className="h-48 animate-pulse rounded-xl border border-border bg-bg-card" />
      <div className="h-36 animate-pulse rounded-xl border border-border bg-bg-card" />
    </div>
  );
}
