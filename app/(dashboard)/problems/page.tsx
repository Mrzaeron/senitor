import { Suspense } from "react";
import Link from "next/link";
import { z } from "zod";
import { ProblemCard, ProblemEmptyState, ProblemErrorState } from "@/components/problems/ProblemUI";
import { ProblemFilters } from "@/components/problems/ProblemFilters";
import {
  getProblemFilters,
  getPublishedProblems,
  ProblemDataError,
} from "@/lib/problems/data";
import { measureServerData } from "@/lib/supabase/diagnostics";

type SearchParams = Record<string, string | string[] | undefined>;

const filtersSchema = z.object({
  q: z.string().max(100).optional(),
  topic: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  tags: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)).max(10),
  page: z.string().regex(/^[1-9]\d{0,3}$/),
});

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function buildPageHref(
  filters: { q?: string; topic?: string; difficulty?: string; tags: string[] },
  page: number
): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.topic) params.set("topic", filters.topic);
  if (filters.difficulty) params.set("difficulty", filters.difficulty);
  for (const tag of filters.tags) params.append("tag", tag);
  params.set("page", String(page));
  return `/problems?${params.toString()}`;
}

async function loadProblemBank(filters: {
  q?: string;
  topic?: string;
  difficulty?: "easy" | "medium" | "hard";
  tags: string[];
  page: number;
}) {
  try {
    const data = await measureServerData(
      "/problems",
      "filters and result data",
      () =>
        Promise.all([
          getProblemFilters(),
          getPublishedProblems({
            search: filters.q,
            topicSlug: filters.topic,
            difficulty: filters.difficulty,
            tagSlugs: filters.tags,
            page: filters.page,
          }),
        ])
    );
    return { success: true as const, data };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[problem-bank] problem browser failed unexpectedly", {
        name: error instanceof Error ? error.name : "Unknown error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
    return {
      success: false as const,
      error:
        error instanceof ProblemDataError
          ? error.message
          : "The problem list could not be loaded. Please try again later.",
    };
  }
}

async function ProblemBrowser({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const raw = await searchParams;
  const parsed = filtersSchema.safeParse({
    q: firstValue(raw.q),
    topic: firstValue(raw.topic),
    difficulty: firstValue(raw.difficulty),
    tags: raw.tag === undefined
      ? []
      : Array.isArray(raw.tag)
        ? raw.tag
        : [raw.tag],
    page: firstValue(raw.page) ?? "1",
  });

  if (!parsed.success) {
    return (
      <ProblemErrorState message="Some filter values are invalid. Reset the filters and try again." />
    );
  }

  const { q, topic, difficulty, tags, page: pageText } = parsed.data;
  const page = Number(pageText);
  const loaded = await loadProblemBank({ q, topic, difficulty, tags, page });
  if (!loaded.success) {
    return (
      <ProblemErrorState message={loaded.error} />
    );
  }
  const [filters, results] = loaded.data;

  return (
      <div className="space-y-7">
        <header className="space-y-2">
          <p className="text-sm font-medium text-accent-secondary">Practice</p>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Problem Bank
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-text-secondary">
            Explore original DSA challenges by topic, pattern, and difficulty.
            Solutions and code execution are not part of this phase.
          </p>
        </header>

        <ProblemFilters
          key={q ?? ""}
          filters={filters}
          search={q}
          topic={topic}
          difficulty={difficulty}
          tags={tags}
        />

        <section aria-label="Problems">
          <p className="mb-4 text-sm text-text-secondary" aria-live="polite">
            {results.total} {results.total === 1 ? "problem" : "problems"}
            {q || topic || difficulty || tags.length > 0
              ? " match these filters"
              : " available"}
          </p>
          {results.problems.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {results.problems.map((problem) => (
                <ProblemCard key={problem.id} problem={problem} />
              ))}
            </div>
          ) : (
            <ProblemEmptyState
              title="No problems found"
              message="Try a different search or clear one or more filters."
            />
          )}
        </section>

        {results.pageCount > 1 && (
          <nav
            aria-label="Problem pages"
            className="flex items-center justify-between border-t border-border pt-5"
          >
            <Link
              aria-disabled={results.page <= 1}
              tabIndex={results.page <= 1 ? -1 : undefined}
              href={buildPageHref({ q, topic, difficulty, tags }, results.page - 1)}
              className={`rounded-lg border border-border px-4 py-2 text-sm ${
                results.page <= 1
                  ? "pointer-events-none opacity-40"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Previous
            </Link>
            <span className="text-sm text-text-muted">
              Page {results.page} of {results.pageCount}
            </span>
            <Link
              aria-disabled={results.page >= results.pageCount}
              tabIndex={results.page >= results.pageCount ? -1 : undefined}
              href={buildPageHref({ q, topic, difficulty, tags }, results.page + 1)}
              className={`rounded-lg border border-border px-4 py-2 text-sm ${
                results.page >= results.pageCount
                  ? "pointer-events-none opacity-40"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Next
            </Link>
          </nav>
        )}
      </div>
  );
}

export default function ProblemsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          aria-busy="true"
          className="rounded-xl border border-border bg-bg-card p-6 text-sm text-text-secondary"
        >
          Loading problem bank…
        </div>
      }
    >
      <ProblemBrowser searchParams={searchParams} />
    </Suspense>
  );
}
