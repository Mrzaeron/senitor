import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  CurriculumEmptyState,
  CurriculumErrorState,
  CurriculumLoadingState,
  DifficultyBadge,
  EstimatedTime,
  TopicIcon,
} from "@/components/learn/CurriculumUI";
import {
  LearningProgressErrorState,
  ProgressMeter,
} from "@/components/learn/LearningProgressSummary";
import {
  CurriculumDataError,
  getSubtopicsByTopic,
  getTopicBySlug,
} from "@/lib/curriculum/data";
import {
  getTopicProgress,
  LearningProgressError,
} from "@/lib/learning/progress";

type TopicPageProps = {
  params: Promise<{ topicSlug: string }>;
};

export default function TopicPage({ params }: TopicPageProps) {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <Suspense fallback={<CurriculumLoadingState label="Loading topic..." />}>
        <TopicContent params={params} />
      </Suspense>
    </div>
  );
}

async function TopicContent({ params }: TopicPageProps) {
  await connection();
  const result = await loadTopic(params);
  if ("error" in result && typeof result.error === "string") {
    return result.errorType === "progress" ? (
      <LearningProgressErrorState message={result.error} />
    ) : (
      <CurriculumErrorState message={result.error} />
    );
  }

  const { topic, subtopics, progress } = result;
  if (!topic) notFound();
  if (!progress) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/learn"
        className="inline-flex min-h-11 w-fit items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft size={16} aria-hidden />
        All topics
      </Link>

      <header className="flex flex-col gap-4 rounded-xl border border-border bg-bg-card p-5 md:flex-row md:items-start md:p-7">
        <TopicIcon name={topic.icon} />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default" dot>DSA curriculum</Badge>
            <DifficultyBadge difficulty={topic.difficulty} />
          </div>
          <h2 className="text-2xl font-bold text-text-primary md:text-3xl">
            {topic.name}
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-text-secondary">
            {topic.description}
          </p>
          <ProgressMeter
            completed={progress.completed_lessons}
            total={progress.total_lessons}
            percentage={progress.completion_percentage}
            label={`${topic.name} completion`}
          />
          <p className="text-xs text-text-muted">
            {subtopics.length}{" "}
            {subtopics.length === 1 ? "subtopic" : "subtopics"} in learning
            order
          </p>
        </div>
      </header>

      {subtopics.length === 0 ? (
        <CurriculumEmptyState
          title="No published subtopics"
          message="This topic is being prepared. Check back soon."
        />
      ) : (
        <ol className="space-y-3">
          {subtopics.map((subtopic, index) => {
            const subtopicProgress = progress.subtopics.find(
              (item) => item.subtopic_id === subtopic.id
            );

            return (
              <li key={subtopic.id}>
                <Link
                  href={`/learn/${topic.slug}/${subtopic.slug}`}
                  className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                >
                  <Card className="flex items-center gap-4 p-4 transition-colors group-hover:border-border-accent md:p-5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-overlay font-mono text-sm text-text-secondary">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-text-primary group-hover:text-accent-secondary">
                        {subtopic.name}
                      </h3>
                      <p className="mt-1 text-sm leading-5 text-text-secondary">
                        {subtopic.description}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-4">
                        <EstimatedTime minutes={subtopic.estimated_minutes} />
                        <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                          <BookOpen size={14} aria-hidden />
                          {subtopic.lesson_count}{" "}
                          {subtopic.lesson_count === 1 ? "lesson" : "lessons"}
                        </span>
                      </div>
                      {subtopicProgress && subtopicProgress.total_lessons > 0 && (
                        <div className="mt-3 max-w-md">
                          <ProgressMeter
                            completed={subtopicProgress.completed_lessons}
                            total={subtopicProgress.total_lessons}
                            percentage={subtopicProgress.completion_percentage}
                            label={`${subtopic.name} completion`}
                          />
                        </div>
                      )}
                    </div>
                    <ArrowRight
                      size={18}
                      className="shrink-0 text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent-secondary"
                      aria-hidden
                    />
                  </Card>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

async function loadTopic(params: TopicPageProps["params"]) {
  try {
    const { topicSlug } = await params;
    const topic = await getTopicBySlug(topicSlug);
    if (!topic) return { topic: null, subtopics: [], progress: null };

    const [subtopics, progress] = await Promise.all([
      getSubtopicsByTopic(topic.id),
      getTopicProgress(topic.id),
    ]);
    return { topic, subtopics, progress };
  } catch (error) {
    if (error instanceof CurriculumDataError) {
      return { error: error.message, errorType: "curriculum" };
    }
    if (error instanceof LearningProgressError) {
      return { error: error.message, errorType: "progress" };
    }
    throw error;
  }
}
