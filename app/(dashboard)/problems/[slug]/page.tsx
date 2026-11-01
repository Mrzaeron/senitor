import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Lightbulb } from "lucide-react";
import { notFound } from "next/navigation";
import {
  ProblemCard,
  ProblemDifficultyBadge,
  ProblemErrorState,
} from "@/components/problems/ProblemUI";
import { ProblemWorkspace } from "@/components/problems/ProblemWorkspace";
import { LessonContent } from "@/components/learn/LessonContent";
import { Card } from "@/components/ui/Card";
import { getProblemBySlug, ProblemDataError } from "@/lib/problems/data";
import { getProblemSubmissionHistory } from "@/lib/problems/submissions";
import { measureServerData } from "@/lib/supabase/diagnostics";

async function ProblemDetails({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) notFound();

  let problem: Awaited<ReturnType<typeof getProblemBySlug>>;
  try {
    problem = await measureServerData(
      "/problems/[slug]",
      "problem and related content",
      () => getProblemBySlug(slug)
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[problem-bank] problem detail failed unexpectedly", {
        name: error instanceof Error ? error.name : "Unknown error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
    return (
      <ProblemErrorState
        message={
          error instanceof ProblemDataError
            ? error.message
            : "This problem could not be loaded. Please try again later."
        }
      />
    );
  }
  if (!problem) notFound();

  let history: Awaited<ReturnType<typeof getProblemSubmissionHistory>> = [];
  let historyError: string | undefined;
  try {
    history = await measureServerData(
      "/problems/[slug]",
      "submission history",
      () => getProblemSubmissionHistory(problem.id)
    );
  } catch (error) {
    console.error("[problem-submissions] problem page history failed");
    historyError =
      error instanceof Error
        ? error.message
        : "Submission history could not be loaded.";
  }

  return (
      <article className="mx-auto max-w-5xl space-y-7">
        <Link
          href="/problems"
          className="inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft size={16} aria-hidden />
          All problems
        </Link>

        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <ProblemDifficultyBadge difficulty={problem.difficulty} />
            <Link
              href={`/problems?topic=${encodeURIComponent(problem.topic_slug)}`}
              className="text-sm text-accent-secondary hover:text-text-primary"
            >
              {problem.topic_name}
            </Link>
            <span className="text-sm text-text-muted">/</span>
            <span className="text-sm text-text-secondary">
              {problem.subtopic_name}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            {problem.title}
          </h1>
          <div className="flex flex-wrap gap-2">
            {problem.tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/problems?tag=${encodeURIComponent(tag.slug)}`}
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
              >
                <span className="inline-flex rounded-full border border-border bg-bg-overlay px-2.5 py-1 text-xs text-text-secondary hover:text-text-primary">
                  {tag.name}
                </span>
              </Link>
            ))}
          </div>
        </header>

        <div className="grid items-start gap-6 xl:grid-cols-2">
          <div className="space-y-5">
        <Card className="p-5 md:p-7">
          <h2 className="mb-5 text-xl font-semibold text-text-primary">
            Problem
          </h2>
          <div className="space-y-7">
            <LessonContent content={problem.description} />

            <section className="space-y-2">
              <h3 className="font-semibold text-text-primary">Input format</h3>
              <LessonContent content={problem.input_format} />
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-text-primary">Output format</h3>
              <LessonContent content={problem.output_format} />
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold text-text-primary">Examples</h3>
              {problem.examples.map((example, index) => (
                <div
                  key={`${problem.id}-example-${index}`}
                  className="rounded-lg border border-border bg-bg-secondary p-4"
                >
                  <h4 className="text-sm font-medium text-text-secondary">
                    Example {index + 1}
                  </h4>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="mb-1 text-xs font-medium text-text-muted">
                        Input
                      </p>
                      <pre className="overflow-x-auto rounded-md bg-bg-base p-3 text-sm text-text-primary">
                        <code>{example.input}</code>
                      </pre>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-medium text-text-muted">
                        Output
                      </p>
                      <pre className="overflow-x-auto rounded-md bg-bg-base p-3 text-sm text-text-primary">
                        <code>{example.output}</code>
                      </pre>
                    </div>
                  </div>
                  {example.explanation && (
                    <div className="mt-3">
                      <p className="mb-1 text-xs font-medium text-text-muted">
                        Explanation
                      </p>
                      <LessonContent content={example.explanation} />
                    </div>
                  )}
                </div>
              ))}
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-text-primary">Constraints</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-text-secondary">
                {problem.constraints.map((constraint) => (
                  <li key={constraint}>{constraint}</li>
                ))}
              </ul>
            </section>
          </div>
        </Card>

        <section className="rounded-xl border border-border bg-bg-card p-5 md:p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
            <Lightbulb size={18} className="text-warning" aria-hidden />
            Hints
          </h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-text-secondary">
            {problem.hints.map((hint, index) => (
              <li key={`${problem.id}-hint-${index}`}>{hint.text}</li>
            ))}
          </ol>
        </section>

        <section className="rounded-xl border border-border bg-bg-card p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-text-primary">
                Supported languages
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {problem.supported_languages
                  .filter((language) => language === "cpp" || language === "python")
                  .map((language) => {
                    if (language === "cpp") return "C++";
                    return language[0].toUpperCase() + language.slice(1);
                  })
                  .join(", ")}
              </p>
            </div>
            {problem.acceptance_rate !== null && (
              <div className="text-sm text-text-secondary">
                Acceptance rate: {problem.acceptance_rate}%
              </div>
            )}
          </div>
        </section>

          </div>
          <aside className="min-w-0 space-y-5 xl:sticky xl:top-4">
            <ProblemWorkspace
              slug={problem.slug}
              starterCode={problem.starter_code}
              history={history}
              historyError={historyError}
            />
          </aside>
        </div>

        {problem.related_problems.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-semibold text-text-primary">
              Related problems
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {problem.related_problems.map((related) => (
                <ProblemCard key={related.id} problem={related} />
              ))}
            </div>
          </section>
        )}

        <div className="flex justify-between border-t border-border pt-5">
          <Link
            href="/problems"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft size={16} aria-hidden />
            Back to problem bank
          </Link>
          <Link
            href={`/problems?topic=${encodeURIComponent(problem.topic_slug)}`}
            className="inline-flex items-center gap-2 text-sm text-accent-secondary hover:text-text-primary"
          >
            More in {problem.topic_name}
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </article>
  );
}

export default function ProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          aria-busy="true"
          className="rounded-xl border border-border bg-bg-card p-6 text-sm text-text-secondary"
        >
          Loading problem…
        </div>
      }
    >
      <ProblemDetails params={params} />
    </Suspense>
  );
}
