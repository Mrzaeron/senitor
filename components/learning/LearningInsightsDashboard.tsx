import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Target,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import {
  getLearningInsights,
  LearningInsightsError,
  type InsightPerformance,
} from "@/lib/learning/insights";

function percentage(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function PerformanceBars({
  values,
  emptyMessage,
}: {
  values: InsightPerformance[];
  emptyMessage: string;
}) {
  if (values.every((value) => value.attempts === 0)) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-text-muted">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {values.map((value) => (
        <div key={value.label}>
          <div className="mb-1 flex justify-between gap-3 text-xs">
            <span className="text-text-secondary">{value.label}</span>
            <span className="tabular-nums text-text-muted">
              {value.attempts ? `${percentage(value.accuracy)} · ${value.attempts} attempts` : "No attempts"}
            </span>
          </div>
          <Progress
            value={value.accuracy * 100}
            label={`${value.label} accuracy`}
            variant={value.accuracy >= 0.7 ? "success" : value.accuracy >= 0.4 ? "warning" : "error"}
          />
        </div>
      ))}
    </div>
  );
}

export async function LearningInsightsDashboard() {
  let insights: Awaited<ReturnType<typeof getLearningInsights>>;
  try {
    insights = await getLearningInsights();
  } catch (error) {
    if (!(error instanceof LearningInsightsError)) throw error;
    return (
      <div role="alert" className="flex items-start gap-2 rounded-xl border border-border bg-bg-card p-5 text-sm text-error">
        <AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden />
        <span>{error.message}</span>
      </div>
    );
  }

  const { analytics, prediction } = insights;
  const statCards = [
    ["Attempted problems", analytics.attemptedProblems],
    ["Successful submissions", analytics.successfulSubmissions],
    ["Accuracy", percentage(analytics.accuracy)],
    ["Lessons completed", analytics.lessonActivity.completedLessons],
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map(([label, value]) => (
          <Card key={label} className="p-4">
            <p className="text-xs text-text-muted">{label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-text-primary">{value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <BrainCircuit size={18} className="text-accent-secondary" aria-hidden />
            <h2 className="font-semibold text-text-primary">Performance prediction</h2>
          </div>
          <p className="mt-2 text-sm text-text-secondary">
            Estimated likelihood of solving your next recommended problem successfully.
          </p>
          <p className="mt-5 text-4xl font-bold tabular-nums text-text-primary">
            {prediction.probability === null ? "—" : percentage(prediction.probability)}
          </p>
          <p className="mt-2 text-sm text-text-secondary">{prediction.explanation}</p>
          <p className="mt-4 text-xs leading-5 text-text-muted">
            {prediction.model} trained on synthetic data. This estimate is guidance, not a
            guarantee, and becomes available after three judged submissions.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-accent-secondary" aria-hidden />
            <h2 className="font-semibold text-text-primary">Topic mastery</h2>
          </div>
          <p className="mt-2 text-sm text-text-secondary">
            Mastery uses all of your accepted and unsuccessful judged submissions per topic.
          </p>
          <div className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {insights.topicMastery.map((topic) => (
              <Link key={topic.slug} href={`/learn/${topic.slug}`} className="group">
                <div className="mb-1 flex justify-between gap-3 text-xs">
                  <span className="truncate text-text-secondary group-hover:text-accent-secondary">{topic.name}</span>
                  <span className="flex shrink-0 items-center gap-2 text-[11px]">
                    <span className={topic.mastery >= 0.7 ? "text-success" : "text-warning"}>
                      {topic.mastery >= 0.7 ? "Strong" : "Needs practice"}
                    </span>
                    <span className="tabular-nums text-text-muted">{percentage(topic.mastery)}</span>
                  </span>
                </div>
                <Progress
                  value={topic.mastery * 100}
                  label={`${topic.name} mastery`}
                  variant={topic.mastery >= 0.7 ? "success" : topic.mastery >= 0.4 ? "warning" : "error"}
                />
                <p className="mt-1 text-[11px] text-text-muted">
                  {topic.attempts
                    ? `${percentage(topic.accuracy)} accuracy · ${topic.attempts} attempts`
                    : "No judged attempts yet"}
                </p>
              </Link>
            ))}
          </div>
          {insights.topicMastery.length === 0 && (
            <p className="mt-5 text-sm text-text-muted">No published topics are available yet.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-accent-secondary" aria-hidden />
            <h2 className="font-semibold text-text-primary">Difficulty performance</h2>
          </div>
          <PerformanceBars values={analytics.difficultyPerformance} emptyMessage="Try a problem to see difficulty performance." />
        </Card>
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-accent-secondary" aria-hidden />
            <h2 className="font-semibold text-text-primary">Recent performance</h2>
          </div>
          <PerformanceBars values={analytics.recentTrend} emptyMessage="Your recent trend will appear after you submit a solution." />
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-text-primary">Personalized next steps</h2>
            <p className="mt-1 text-sm text-text-secondary">{insights.explanation}</p>
          </div>
          {insights.recommendedNextTopic && (
            <Link
              href={`/learn/${insights.recommendedNextTopic.slug}`}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-accent-secondary hover:border-border-accent"
            >
              Open topic <ArrowRight size={15} aria-hidden />
            </Link>
          )}
        </div>
        {insights.recommendedProblems.length > 0 ? (
          <ul className="mt-5 grid gap-3 md:grid-cols-3">
            {insights.recommendedProblems.map((problem) => (
              <li key={problem.id} className="rounded-lg border border-border bg-bg-secondary p-4">
                <Link href={`/problems/${problem.slug}`} className="font-medium text-text-primary hover:text-accent-secondary">
                  {problem.title}
                </Link>
                <p className="mt-1 text-xs capitalize text-text-muted">{problem.topic} · {problem.difficulty}</p>
                <p className="mt-3 text-xs leading-5 text-text-secondary">{problem.reason}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-text-muted">
            Complete more curriculum or problem activity to receive a next-step recommendation.
          </p>
        )}
      </Card>
    </div>
  );
}
