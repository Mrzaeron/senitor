import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ArrowRight, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/Card";
import {
  CurriculumEmptyState,
  CurriculumLoadingState,
  DifficultyBadge,
  TopicIcon,
} from "@/components/learn/CurriculumUI";
import {
  LearningOverview,
  LearningProgressErrorState,
} from "@/components/learn/LearningProgressSummary";
import {
  getLearningOverview,
  LearningProgressError,
} from "@/lib/learning/progress";
import type { OverallLearningProgress } from "@/types/learning-progress";
import type { TopicCatalogItem } from "@/types/curriculum";
import { measureServerData } from "@/lib/supabase/diagnostics";

export default function LearnPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-accent-secondary">
          <BookOpen size={18} aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Learning path
          </span>
        </div>
        <h2 className="text-2xl font-bold text-text-primary md:text-3xl">
          Learn DSA
        </h2>
        <p className="max-w-2xl text-sm text-text-secondary">
          Follow a structured curriculum from programming foundations to
          advanced problem-solving techniques.
        </p>
      </header>

      <Suspense fallback={<CurriculumLoadingState label="Loading curriculum..." />}>
        <TopicCatalog />
      </Suspense>
    </div>
  );
}

async function TopicCatalog() {
  await connection();
  const result = await loadTopics();
  if ("error" in result) {
    return (
      <LearningProgressErrorState
        title="Learning overview unavailable"
        message={result.error}
      />
    );
  }

  const { topics, progress } = result;
  if (topics.length === 0) {
    return (
      <>
        <LearningOverview progress={progress} />
        <CurriculumEmptyState
          title="Curriculum coming soon"
          message="There are no published topics available yet."
        />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <LearningOverview progress={progress} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {topics.map((topic) => (
          <Link
            key={topic.id}
            href={`/learn/${topic.slug}`}
            className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          >
            <Card className="flex h-full flex-col gap-4 p-5 transition-colors group-hover:border-border-accent">
              <div className="flex items-start justify-between gap-3">
                <TopicIcon name={topic.icon} />
                <DifficultyBadge difficulty={topic.difficulty} />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-base font-semibold text-text-primary group-hover:text-accent-secondary">
                  {topic.name}
                </h3>
                <p className="text-sm leading-6 text-text-secondary">
                  {topic.description}
                </p>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-text-muted">
                <span>
                  {topic.subtopic_count}{" "}
                  {topic.subtopic_count === 1 ? "subtopic" : "subtopics"}
                </span>
                <span className="inline-flex items-center gap-1 text-accent-secondary">
                  Explore <ArrowRight size={14} aria-hidden />
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

async function loadTopics(): Promise<
  | {
      topics: TopicCatalogItem[];
      progress: OverallLearningProgress;
    }
  | { error: string }
> {
  try {
    return await measureServerData(
      "/learn",
      "curriculum and progress data",
      getLearningOverview
    );
  } catch (error) {
    if (error instanceof LearningProgressError) {
      return { error: error.message };
    }
    throw error;
  }
}
