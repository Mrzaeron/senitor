"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";

type LearningInsightsData = {
  syntheticDemo: true;
  model: string;
  probability: number | null;
  prediction: {
    explanation: string;
  };
  topicMastery: Array<{
    slug: string;
    name: string;
    mastery: number | null;
    attempts: number;
    accuracy: number;
  }>;
  weakTopics: Array<{
    slug: string;
    name: string;
    mastery: number;
    attempts: number;
    accuracy: number;
  }>;
  recommendedNextTopic: {
    slug: string;
    name: string;
    mastery: number;
    attempts: number;
    accuracy: number;
  } | null;
  recommendedProblems: Array<{
    id: string;
    slug: string;
    title: string;
    difficulty: string;
    topic: string;
    reason: string;
  }>;
  explanation: string;
  submissionCount: number;
};

type LoadState =
  | { requestKey: string; status: "success"; data: LearningInsightsData }
  | { requestKey: string; status: "error"; message: string };

export function LearningInsights({
  problemId,
  submissionVersion,
}: {
  problemId: string;
  submissionVersion: string;
}) {
  const requestKey = `${problemId}:${submissionVersion}`;
  const [loadState, setLoadState] = useState<LoadState | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/learning-insights?problemId=${encodeURIComponent(problemId)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = (await response.json()) as
          | LearningInsightsData
          | { error?: string };
        if (!response.ok) {
          throw new Error(
            "error" in result && result.error
              ? result.error
              : "Learning insights could not be loaded."
          );
        }
        setLoadState({
          requestKey,
          status: "success",
          data: result as LearningInsightsData,
        });
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setLoadState({
          requestKey,
          status: "error",
          message:
            cause instanceof Error
              ? cause.message
              : "Learning insights could not be loaded.",
        });
      });

    return () => controller.abort();
  }, [problemId, requestKey]);

  const currentState =
    loadState?.requestKey === requestKey ? loadState : null;

  return (
    <Card className="space-y-4 border-border bg-bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-text-primary">
            <Sparkles size={17} className="text-accent-secondary" aria-hidden />
            Learning insights
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            Synthetic ML demonstration
          </p>
        </div>
      </div>

      {!currentState && (
        <p role="status" className="text-sm text-text-secondary">
          Analyzing your learning activity…
        </p>
      )}

      {currentState?.status === "error" && (
        <p role="alert" className="flex items-start gap-2 text-sm text-error">
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
          <span>{currentState.message}</span>
        </p>
      )}

      {currentState?.status === "success" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-bg-secondary p-3">
            <p className="text-xs text-text-muted">
              Problem-solving probability · {currentState.data.model}
            </p>
            <p className="mt-1 text-2xl font-bold text-text-primary">
              {currentState.data.probability === null
                ? "Not enough data"
                : `${Math.round(currentState.data.probability * 100)}%`}
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              {currentState.data.prediction.explanation} This estimate uses a model
              trained only on synthetic data.
            </p>
          </div>

          <section aria-labelledby="topic-mastery-heading">
            <h3
              id="topic-mastery-heading"
              className="mb-2 text-sm font-semibold text-text-primary"
            >
              Topic mastery
            </h3>
            <ul className="space-y-2">
              {currentState.data.topicMastery.map((topic) => (
                <li key={topic.slug}>
                  <div className="mb-1 flex justify-between gap-2 text-xs">
                    <span className="truncate text-text-secondary">{topic.name}</span>
                    <span className="text-text-muted">
                      {topic.mastery === null || topic.attempts === 0
                        ? "Not attempted"
                        : `${Math.round(topic.mastery * 100)}%`}
                    </span>
                  </div>
                  {topic.mastery !== null && topic.attempts > 0 && (
                    <div
                      className="h-1.5 overflow-hidden rounded-full bg-bg-overlay"
                      role="progressbar"
                      aria-label={`${topic.name} mastery`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(topic.mastery * 100)}
                    >
                      <div
                        className="h-full rounded-full bg-accent-primary"
                        style={{ width: `${topic.mastery * 100}%` }}
                      />
                    </div>
                  )}
                  <p className="mt-1 text-[11px] text-text-muted">
                    {topic.attempts
                      ? `${Math.round(topic.accuracy * 100)}% accuracy · ${topic.attempts} attempts`
                      : "No judged attempts yet"}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-text-primary">Weak topics</h3>
            <p className="mt-1 text-xs text-text-secondary">
              {currentState.data.weakTopics.length
                ? currentState.data.weakTopics
                    .slice(0, 4)
                    .map(
                      (topic) =>
                        `${topic.name} (${topic.attempts} attempts, ${Math.round(topic.accuracy * 100)}% accuracy)`
                    )
                    .join(" · ")
                : "No weak topics with judged attempts yet."}
            </p>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-text-primary">
              Recommended next topic
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              {currentState.data.explanation}
            </p>
          </section>

          {currentState.data.recommendedProblems.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-text-primary">
                Recommended problems
              </h3>
              <ul className="space-y-2">
                {currentState.data.recommendedProblems.map((problem) => (
                  <li
                    key={problem.id}
                    className="rounded-lg border border-border p-3"
                  >
                    <Link
                      href={`/problems/${problem.slug}`}
                      className="text-sm font-medium text-accent-secondary hover:text-text-primary"
                    >
                      {problem.title}
                    </Link>
                    <p className="mt-1 text-xs capitalize text-text-muted">
                      {problem.topic} · {problem.difficulty}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-text-secondary">
                      {problem.reason}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </Card>
  );
}
