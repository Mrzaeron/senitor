import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import {
  CurriculumEmptyState,
  CurriculumErrorState,
  CurriculumLoadingState,
  EstimatedTime,
} from "@/components/learn/CurriculumUI";
import {
  LearningProgressErrorState,
  ProgressMeter,
} from "@/components/learn/LearningProgressSummary";
import {
  CurriculumDataError,
  getSubtopicBySlug,
  getSubtopicLessons,
  getSubtopicPrerequisites,
} from "@/lib/curriculum/data";
import {
  getSubtopicProgress,
  LearningProgressError,
} from "@/lib/learning/progress";

type SubtopicPageProps = {
  params: Promise<{ topicSlug: string; subtopicSlug: string }>;
};

export default function SubtopicPage({ params }: SubtopicPageProps) {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <Suspense fallback={<CurriculumLoadingState label="Loading subtopic..." />}>
        <SubtopicContent params={params} />
      </Suspense>
    </div>
  );
}

async function SubtopicContent({ params }: SubtopicPageProps) {
  const result = await loadSubtopic(params);
  if ("error" in result && typeof result.error === "string") {
    return result.errorType === "progress" ? (
      <LearningProgressErrorState message={result.error} />
    ) : (
      <CurriculumErrorState message={result.error} />
    );
  }

  const { context, lessons, prerequisites, progress } = result;
  if (!context) notFound();
  if (!progress) notFound();

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm">
        <Link
          href="/learn"
          className="text-text-secondary transition-colors hover:text-text-primary"
        >
          Learn DSA
        </Link>
        <span className="text-text-muted" aria-hidden>/</span>
        <Link
          href={`/learn/${context.topic.slug}`}
          className="text-text-secondary transition-colors hover:text-text-primary"
        >
          {context.topic.name}
        </Link>
      </nav>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold text-text-primary md:text-3xl">
            {context.subtopic.name}
          </h2>
          <EstimatedTime minutes={context.subtopic.estimated_minutes} />
        </div>
        <p className="max-w-3xl text-sm leading-6 text-text-secondary">
          {context.subtopic.description}
        </p>
        <ProgressMeter
          completed={progress.completed_lessons}
          total={progress.total_lessons}
          percentage={progress.completion_percentage}
          label={`${context.subtopic.name} completion`}
        />
      </header>

      <section className="space-y-3" aria-labelledby="lessons-heading">
        <div className="flex items-center justify-between gap-3">
          <h3 id="lessons-heading" className="text-lg font-semibold text-text-primary">
            Lessons
          </h3>
          <span className="text-xs text-text-muted">
            {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
          </span>
        </div>
        {lessons.length === 0 ? (
          <CurriculumEmptyState
            title="Lessons coming soon"
            message="There are no published lessons for this concept yet."
          />
        ) : (
          <ol className="space-y-3">
            {lessons.map((lesson, index) => (
              <li key={lesson.id}>
                <Link
                  href={`/learn/${context.topic.slug}/${context.subtopic.slug}/${lesson.slug}`}
                  className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                >
                  <Card className="flex items-center gap-4 p-4 transition-colors group-hover:border-border-accent md:p-5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-accent-secondary">
                      <BookOpen size={17} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-text-primary group-hover:text-accent-secondary">
                        {index + 1}. {lesson.title}
                      </h4>
                      <div className="mt-2">
                        <EstimatedTime minutes={lesson.estimated_minutes} />
                      </div>
                    </div>
                    <ArrowRight
                      size={18}
                      className="shrink-0 text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent-secondary"
                      aria-hidden
                    />
                  </Card>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="prerequisites-heading">
        <h3 id="prerequisites-heading" className="text-lg font-semibold text-text-primary">
          Prerequisites
        </h3>
        {prerequisites.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-bg-card p-4 text-sm text-text-secondary">
            <CheckCircle2 size={17} className="text-success" aria-hidden />
            No prerequisite concepts. You can start here.
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {prerequisites.map((item) => (
              <li key={item.prerequisite_subtopic_id}>
                <Link
                  href={`/learn/${item.topic.slug}/${item.prerequisite.slug}`}
                  className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                >
                  <Card className="flex items-center justify-between gap-3 p-4 transition-colors group-hover:border-border-accent">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-text-primary group-hover:text-accent-secondary">
                        {item.prerequisite.name}
                      </span>
                      <span className="mt-1 block truncate text-xs text-text-muted">
                        {item.topic.name}
                      </span>
                    </span>
                    <ArrowRight
                      size={16}
                      className="shrink-0 text-text-muted"
                      aria-hidden
                    />
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link
        href={`/learn/${context.topic.slug}`}
        className="inline-flex w-fit items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft size={16} aria-hidden />
        Back to {context.topic.name}
      </Link>
    </div>
  );
}

async function loadSubtopic(params: SubtopicPageProps["params"]) {
  try {
    const { topicSlug, subtopicSlug } = await params;
    const context = await getSubtopicBySlug(topicSlug, subtopicSlug);
    if (!context) {
      return {
        context: null,
        lessons: [],
        prerequisites: [],
        progress: null,
      };
    }

    const [lessons, prerequisites, progress] = await Promise.all([
      getSubtopicLessons(context.subtopic.id),
      getSubtopicPrerequisites(context.subtopic.id),
      getSubtopicProgress(context.subtopic.id),
    ]);

    return { context, lessons, prerequisites, progress };
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
