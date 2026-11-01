import Link from "next/link";
import { Suspense } from "react";
import { getUserProfile } from "@/app/auth/actions";
import { Badge } from "@/components/ui/Badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import {
  LearningOverview,
  LearningProgressErrorState,
} from "@/components/learn/LearningProgressSummary";
import {
  getLastLearningPosition,
  getOverallLearningProgress,
  LearningProgressError,
} from "@/lib/learning/progress";
import { ArrowRight, BookOpen, Sparkles, Code2, Target, Clock } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <Suspense fallback={<DashboardProfileFallback />}>
        <DashboardProfile />
      </Suspense>
      <Suspense fallback={<DashboardLearningFallback />}>
        <DashboardLearning />
      </Suspense>
    </div>
  );
}

async function DashboardProfile() {
  const profile = await getUserProfile();

  return (
    <>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="default" dot>Active Session</Badge>
          {profile?.programming_language && (
            <Badge variant="info">
              {profile.programming_language.toUpperCase()}
            </Badge>
          )}
        </div>
        <h2 className="text-2xl font-bold text-text-primary">
          {profile?.full_name ? `Welcome back, ${profile.full_name}` : "Dashboard"}
        </h2>
        <p className="text-text-secondary text-sm">
          Your AI-powered personalized DSA learning workspace.
        </p>
      </div>

      {profile && (
        <Card className="border-border bg-bg-card shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-accent-secondary">
              <Sparkles size={16} />
              <CardTitle className="text-base font-semibold">Your Learning Profile</CardTitle>
            </div>
            <CardDescription>
              Configured during onboarding to personalize your problem recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-secondary border border-border">
                <Code2 size={20} className="text-accent-primary shrink-0" />
                <div>
                  <p className="text-xs text-text-muted">Language & Track</p>
                  <p className="text-sm font-semibold text-text-primary capitalize">
                    {profile.programming_language || "C++"} ({profile.dsa_experience || "Beginner"})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-secondary border border-border">
                <Target size={20} className="text-success shrink-0" />
                <div>
                  <p className="text-xs text-text-muted">Target Goal</p>
                  <p className="text-sm font-semibold text-text-primary capitalize">
                    {profile.learning_goal?.replace(/_/g, " ") || "Interview Prep"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-secondary border border-border">
                <Clock size={20} className="text-warning shrink-0" />
                <div>
                  <p className="text-xs text-text-muted">Daily Target</p>
                  <p className="text-sm font-semibold text-text-primary">
                    {profile.daily_study_target || 30} mins / day
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

async function DashboardLearning() {
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
              Continue Learning
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
    const [progress, lastPosition] = await Promise.all([
      getOverallLearningProgress(),
      getLastLearningPosition(),
    ]);
    return { progress, lastPosition };
  } catch (error) {
    if (error instanceof LearningProgressError) {
      return { error: error.message };
    }
    throw error;
  }
}

function DashboardLearningFallback() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="h-48 animate-pulse rounded-xl border border-border bg-bg-card" />
      <div className="h-36 animate-pulse rounded-xl border border-border bg-bg-card" />
    </div>
  );
}

function DashboardProfileFallback() {
  return (
    <div className="flex flex-col gap-1" aria-busy="true">
      <div className="flex items-center gap-2 mb-1">
        <Badge variant="default" dot>Active Session</Badge>
      </div>
      <h2 className="text-2xl font-bold text-text-primary">Dashboard</h2>
      <p className="text-text-secondary text-sm">
        Your AI-powered personalized DSA learning workspace.
      </p>
    </div>
  );
}
