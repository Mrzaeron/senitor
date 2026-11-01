"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  finishStudySessionAction,
  heartbeatStudySessionAction,
  pauseStudySessionAction,
  resumeStudySessionAction,
  startStudySessionAction,
} from "@/app/(dashboard)/dashboard/study-actions";
import type { DailyStudySummary } from "@/types/study";

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function StudyTimer({
  initialSummary,
  targetMinutes,
}: {
  initialSummary: DailyStudySummary;
  targetMinutes: number | null;
}) {
  const router = useRouter();
  const [summary, setSummary] = useState(initialSummary);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const activeSession = summary.activeSession;
  const targetSeconds = targetMinutes ? targetMinutes * 60 : null;
  const progressPercent = targetSeconds
    ? Math.min((summary.todaySeconds / targetSeconds) * 100, 100)
    : 0;

  useEffect(() => {
    if (activeSession?.status !== "running") return;
    const sessionId = activeSession.id;
    const timer = window.setInterval(() => {
      setSummary((current) => ({
        ...current,
        todaySeconds: current.todaySeconds + 1,
        activeSession: current.activeSession
          ? {
              ...current.activeSession,
              elapsedSeconds: current.activeSession.elapsedSeconds + 1,
            }
          : null,
      }));
    }, 1000);
    const heartbeat = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void heartbeatStudySessionAction(sessionId).then((result) => {
        if (!result.success) {
          setMessage(result.message);
          router.refresh();
        }
      }).catch(() => {
        setMessage("The active session could not be refreshed.");
      });
    }, 30_000);

    return () => {
      window.clearInterval(timer);
      window.clearInterval(heartbeat);
    };
  }, [activeSession?.id, activeSession?.status, router]);

  const runAction = (action: () => Promise<{ success: boolean; message?: string }>) => {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.success) {
          setMessage(result.message ?? "The study session could not be updated.");
          return;
        }
        router.refresh();
      } catch {
        setMessage("The study session could not be updated. Please retry.");
      }
    });
  };

  return (
    <section className="rounded-xl border border-border bg-bg-card p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-accent-secondary">
            Actual study time today (UTC)
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-text-primary">
            {formatDuration(summary.todaySeconds)}
          </p>
          {targetMinutes !== null && (
            <p className="mt-1 text-sm text-text-secondary">
              Daily target: {targetMinutes} minutes
              {targetSeconds !== null &&
                ` · ${Math.max(
                  0,
                  Math.ceil((targetSeconds - summary.todaySeconds) / 60)
                )} minutes remaining`}
            </p>
          )}
        </div>
        {activeSession && (
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
              {activeSession.status === "running" ? "Session running" : "Session paused"}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-text-primary">
              {formatDuration(activeSession.elapsedSeconds)}
            </p>
          </div>
        )}
      </div>

      {targetSeconds !== null && (
        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-bg-overlay"
          role="progressbar"
          aria-label="Daily study target progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPercent)}
        >
          <div
            className="h-full rounded-full bg-accent-primary transition-[width]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {!activeSession ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => runAction(startStudySessionAction)}
            className="rounded-lg bg-accent-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Start session
          </button>
        ) : activeSession.status === "running" ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              runAction(() => pauseStudySessionAction(activeSession.id))
            }
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary disabled:opacity-50"
          >
            Pause
          </button>
        ) : (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              runAction(() => resumeStudySessionAction(activeSession.id))
            }
            className="rounded-lg bg-accent-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Resume
          </button>
        )}
        {activeSession && (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              runAction(() => finishStudySessionAction(activeSession.id))
            }
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary disabled:opacity-50"
          >
            Finish session
          </button>
        )}
      </div>

      {message && (
        <p role="alert" className="mt-3 text-sm text-error">
          {message}
        </p>
      )}
      <p className="mt-3 text-xs text-text-muted">
        Sessions pause automatically after 90 seconds without a browser heartbeat.
      </p>
    </section>
  );
}
