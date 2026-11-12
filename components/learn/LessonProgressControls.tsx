"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Play } from "lucide-react";
import { completeLessonAction, recordLessonVisitAction } from "@/app/(dashboard)/learn/actions";
import { Button } from "@/components/ui/Button";
import type { LessonProgressStatus } from "@/types/learning-progress";

type LessonProgressControlsProps = {
  lessonId: string;
  initialStatus: LessonProgressStatus | null;
};

export function LessonProgressControls({
  lessonId,
  initialStatus,
}: LessonProgressControlsProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    recordLessonVisitAction(lessonId)
      .then((result) => {
        if (!active) return;
        if (result.success) {
          setStatus(result.status);
          setError(null);
        } else {
          setError(result.error);
        }
      })
      .catch(() => {
        if (active) {
          setError("Your lesson progress could not be saved. Please try again.");
        }
      });

    return () => {
      active = false;
    };
  }, [lessonId, router]);

  function resumeLesson() {
    startTransition(async () => {
      try {
        const result = await recordLessonVisitAction(lessonId);
        if (result.success) {
          setStatus(result.status);
          setError(null);
        } else {
          setError(result.error);
        }
      } catch {
        setError("Your lesson progress could not be saved. Please try again.");
      }
    });
  }

  function markComplete() {
    startTransition(async () => {
      try {
        const result = await completeLessonAction(lessonId);
        if (result.success) {
          setStatus(result.status);
          setError(null);
          router.refresh();
        } else {
          setError(result.error);
        }
      } catch {
        setError("Your lesson could not be marked complete. Please try again.");
      }
    });
  }

  const completed = status === "completed";

  return (
    <section
      aria-label="Lesson progress"
      className="flex flex-col gap-3 rounded-xl border border-border bg-bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-2 text-sm">
        <CheckCircle2
          size={18}
          className={completed ? "text-success" : "text-text-muted"}
          aria-hidden
        />
        <span className="font-medium text-text-primary">
          {completed
            ? "Lesson completed"
            : status === "in_progress"
              ? "Lesson in progress"
              : "Ready to begin"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {!completed && (
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={pending}
              onClick={resumeLesson}
              leftIcon={<Play size={14} />}
              className="min-h-11 flex-1 sm:flex-none"
            >
              {status === "in_progress" ? "Resume lesson" : "Start lesson"}
            </Button>
            <Button
              type="button"
              size="sm"
              loading={pending}
              onClick={markComplete}
              leftIcon={<CheckCircle2 size={14} />}
              className="min-h-11 flex-1 sm:flex-none"
            >
              Mark as complete
            </Button>
          </>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-error sm:basis-full">
          {error}
        </p>
      )}
    </section>
  );
}
