import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { ProblemDifficulty, ProblemListItem } from "@/types/problems";

const difficultyLabels: Record<ProblemDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export function ProblemDifficultyBadge({
  difficulty,
}: {
  difficulty: ProblemDifficulty;
}) {
  return (
    <Badge variant={difficulty} dot>
      {difficultyLabels[difficulty]}
    </Badge>
  );
}

export function ProblemCard({ problem }: { problem: ProblemListItem }) {
  return (
    <Link
      href={`/problems/${problem.slug}`}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
    >
      <Card hoverable className="h-full p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ProblemDifficultyBadge difficulty={problem.difficulty} />
          <span className="text-xs text-text-muted">{problem.topic_name}</span>
        </div>
        <h2 className="mt-4 text-lg font-semibold text-text-primary">
          {problem.title}
        </h2>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-text-secondary">
          {problem.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {problem.tags.map((tag) => (
            <Badge key={tag.id} variant="default" className="font-normal">
              {tag.name}
            </Badge>
          ))}
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-xs text-text-muted">
          {problem.subtopic_name}
          <ArrowRight size={14} aria-hidden />
        </p>
      </Card>
    </Link>
  );
}

export function ProblemEmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-card px-6 py-12 text-center">
      <Search size={24} className="mx-auto text-text-muted" aria-hidden />
      <h2 className="mt-3 font-semibold text-text-primary">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-text-secondary">
        {message}
      </p>
    </div>
  );
}

export function ProblemErrorState({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-error/40 bg-error-muted/20 p-5 text-sm text-error"
    >
      <p className="font-semibold">Problem bank unavailable</p>
      <p className="mt-1 text-text-secondary">{message}</p>
      <a
        href=""
        className="mt-3 inline-flex font-medium text-text-primary underline underline-offset-4"
      >
        Retry
      </a>
    </div>
  );
}
