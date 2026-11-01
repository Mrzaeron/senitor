import {
  BookOpen,
  Clock,
  Code2,
  GitBranch,
  Hash,
  Layers,
  Network,
  Search,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

const topicIcons: Record<string, LucideIcon> = {
  BookOpen,
  Clock,
  Code2,
  GitBranch,
  Hash,
  Layers,
  Network,
  Search,
  TrendingUp,
};

const difficultyVariants = {
  beginner: "easy",
  intermediate: "medium",
  advanced: "hard",
} as const;

export function TopicIcon({ name }: { name: string }) {
  const Icon = topicIcons[name] ?? BookOpen;

  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-accent-subtle text-accent-secondary">
      <Icon size={20} aria-hidden />
    </span>
  );
}

export function DifficultyBadge({
  difficulty,
}: {
  difficulty: keyof typeof difficultyVariants;
}) {
  return (
    <Badge variant={difficultyVariants[difficulty]}>
      {difficulty[0].toUpperCase() + difficulty.slice(1)}
    </Badge>
  );
}

export function EstimatedTime({ minutes }: { minutes: number | null }) {
  if (minutes === null) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
      <Clock size={14} aria-hidden />
      {minutes} min
    </span>
  );
}

export function CurriculumErrorState({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-error/40 bg-error-muted/20 p-5 text-sm text-error"
    >
      <p className="font-semibold">Curriculum unavailable</p>
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

export function CurriculumEmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-8 text-center">
      <BookOpen size={24} className="mx-auto text-text-muted" aria-hidden />
      <h3 className="mt-3 font-semibold text-text-primary">{title}</h3>
      <p className="mt-1 text-sm text-text-secondary">{message}</p>
    </div>
  );
}

export function CurriculumLoadingState({ label }: { label: string }) {
  return (
    <div
      aria-busy="true"
      role="status"
      className="rounded-xl border border-border bg-bg-card p-5 text-sm text-text-secondary"
    >
      {label}
    </div>
  );
}
