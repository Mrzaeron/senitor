import {
  BookOpenCheck,
  CircleCheck,
  Layers3,
  PlayCircle,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import type { OverallLearningProgress } from "@/types/learning-progress";

export function ProgressMeter({
  completed,
  total,
  percentage,
  label,
}: {
  completed: number;
  total: number;
  percentage: number;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-text-secondary">
          {completed} of {total} lessons completed
        </span>
        <span className="font-semibold tabular-nums text-text-primary">
          {percentage}%
        </span>
      </div>
      <Progress value={percentage} size="sm" label={label} />
    </div>
  );
}

export function LearningOverview({
  progress,
}: {
  progress: OverallLearningProgress;
}) {
  return (
    <Card className="space-y-5 p-5">
      <div>
        <h3 className="font-semibold text-text-primary">Your curriculum progress</h3>
        <p className="mt-1 text-sm text-text-secondary">
          Progress is based on published lessons you have completed.
        </p>
      </div>

      <ProgressMeter
        completed={progress.completed_lessons}
        total={progress.total_lessons}
        percentage={progress.completion_percentage}
        label="Overall curriculum completion"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <ProgressStat
          icon={<Layers3 size={16} aria-hidden />}
          label="Topics"
          value={progress.total_topics}
        />
        <ProgressStat
          icon={<BookOpenCheck size={16} aria-hidden />}
          label="Topics started"
          value={progress.started_topics}
        />
        <ProgressStat
          icon={<PlayCircle size={16} aria-hidden />}
          label="Topics in progress"
          value={progress.in_progress_topics}
        />
        <ProgressStat
          icon={<CircleCheck size={16} aria-hidden />}
          label="Topics completed"
          value={progress.completed_topics}
        />
        <ProgressStat
          icon={<BookOpenCheck size={16} aria-hidden />}
          label="Lessons completed"
          value={progress.completed_lessons}
        />
      </div>
    </Card>
  );
}

function ProgressStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-lg border border-border bg-bg-secondary p-3">
      <div className="flex items-center gap-2 text-text-muted">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-2 text-lg font-semibold tabular-nums text-text-primary">
        {value}
      </p>
    </div>
  );
}

export function LearningProgressErrorState({
  message,
  title = "Learning progress unavailable",
}: {
  message: string;
  title?: string;
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-error/40 bg-error-muted/20 p-5 text-sm text-error"
    >
      <p className="font-semibold">{title}</p>
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
