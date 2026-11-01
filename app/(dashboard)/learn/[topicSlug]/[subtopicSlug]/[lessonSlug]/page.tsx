import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import {
  CurriculumErrorState,
  CurriculumLoadingState,
  EstimatedTime,
} from "@/components/learn/CurriculumUI";
import {
  LearningProgressErrorState,
} from "@/components/learn/LearningProgressSummary";
import { LessonContent } from "@/components/learn/LessonContent";
import { LessonProgressControls } from "@/components/learn/LessonProgressControls";
import {
  CurriculumDataError,
  getLessonBySlug,
  getSubtopicLessons,
} from "@/lib/curriculum/data";
import {
  getLessonProgress,
  LearningProgressError,
} from "@/lib/learning/progress";

type LessonPageProps = {
  params: Promise<{
    topicSlug: string;
    subtopicSlug: string;
    lessonSlug: string;
  }>;
};

export default function LessonPage({ params }: LessonPageProps) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <Suspense fallback={<CurriculumLoadingState label="Loading lesson..." />}>
        <LessonContentPage params={params} />
      </Suspense>
    </div>
  );
}

async function LessonContentPage({ params }: LessonPageProps) {
  const result = await loadLesson(params);
  if ("error" in result && typeof result.error === "string") {
    return result.errorType === "progress" ? (
      <LearningProgressErrorState message={result.error} />
    ) : (
      <CurriculumErrorState message={result.error} />
    );
  }

  const { context, lessons, progress } = result;
  if (!context) notFound();

  const lessonIndex = lessons.findIndex(
    (lesson) => lesson.id === context.lesson.id
  );
  if (lessonIndex < 0) notFound();
  const previousLesson = lessonIndex > 0 ? lessons[lessonIndex - 1] : undefined;
  const nextLesson =
    lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : undefined;

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
        <span className="text-text-muted" aria-hidden>/</span>
        <Link
          href={`/learn/${context.topic.slug}/${context.subtopic.slug}`}
          className="text-text-secondary transition-colors hover:text-text-primary"
        >
          {context.subtopic.name}
        </Link>
      </nav>

      <LessonProgressControls
        lessonId={context.lesson.id}
        initialStatus={progress?.status ?? null}
      />

      <article className="space-y-6">
        <header className="space-y-3 border-b border-border pb-5">
          <div className="flex items-center gap-2 text-accent-secondary">
            <BookOpen size={17} aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Lesson {lessonIndex + 1}
            </span>
            <EstimatedTime minutes={context.lesson.estimated_minutes} />
          </div>
          <h2 className="text-2xl font-bold text-text-primary md:text-3xl">
            {context.lesson.title}
          </h2>
          <p className="text-sm text-text-secondary">
            {context.topic.name} <span aria-hidden>·</span>{" "}
            {context.subtopic.name}
          </p>
        </header>

        <Card className="p-5 md:p-8">
          <LessonContent content={context.lesson.content} />
        </Card>
      </article>

      <nav aria-label="Lesson navigation" className="grid gap-3 sm:grid-cols-2">
        {previousLesson ? (
          <Link
            href={`/learn/${context.topic.slug}/${context.subtopic.slug}/${previousLesson.slug}`}
            className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          >
            <Card className="h-full p-4 transition-colors group-hover:border-border-accent">
              <span className="inline-flex items-center gap-2 text-xs text-text-muted">
                <ArrowLeft size={14} aria-hidden />
                Previous lesson
              </span>
              <span className="mt-2 block font-medium text-text-primary group-hover:text-accent-secondary">
                {previousLesson.title}
              </span>
            </Card>
          </Link>
        ) : (
          <Link
            href={`/learn/${context.topic.slug}/${context.subtopic.slug}`}
            className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          >
            <Card className="h-full p-4 transition-colors group-hover:border-border-accent">
              <span className="inline-flex items-center gap-2 text-xs text-text-muted">
                <ArrowLeft size={14} aria-hidden />
                Back to concept
              </span>
              <span className="mt-2 block font-medium text-text-primary group-hover:text-accent-secondary">
                {context.subtopic.name}
              </span>
            </Card>
          </Link>
        )}

        {nextLesson ? (
          <Link
            href={`/learn/${context.topic.slug}/${context.subtopic.slug}/${nextLesson.slug}`}
            className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          >
            <Card className="h-full p-4 text-left transition-colors group-hover:border-border-accent sm:text-right">
              <span className="inline-flex items-center gap-2 text-xs text-text-muted">
                Next lesson
                <ArrowRight size={14} aria-hidden />
              </span>
              <span className="mt-2 block font-medium text-text-primary group-hover:text-accent-secondary">
                {nextLesson.title}
              </span>
            </Card>
          </Link>
        ) : (
          <Link
            href={`/learn/${context.topic.slug}/${context.subtopic.slug}`}
            className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          >
            <Card className="h-full p-4 text-left transition-colors group-hover:border-border-accent sm:text-right">
              <span className="inline-flex items-center gap-2 text-xs text-text-muted">
                Finish section
                <ArrowRight size={14} aria-hidden />
              </span>
              <span className="mt-2 block font-medium text-text-primary group-hover:text-accent-secondary">
                {context.subtopic.name}
              </span>
            </Card>
          </Link>
        )}
      </nav>
    </div>
  );
}

async function loadLesson(params: LessonPageProps["params"]) {
  try {
    const { topicSlug, subtopicSlug, lessonSlug } = await params;
    const context = await getLessonBySlug(
      topicSlug,
      subtopicSlug,
      lessonSlug
    );
    if (!context) return { context: null, lessons: [] };

    const [lessons, progress] = await Promise.all([
      getSubtopicLessons(context.subtopic.id),
      getLessonProgress(context.lesson.id),
    ]);
    return { context, lessons, progress };
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
