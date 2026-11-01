"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { ProblemFilters as ProblemFilterOptions } from "@/types/problems";

export function ProblemFilters({
  filters,
  search,
  topic,
  difficulty,
  tags,
}: {
  filters: ProblemFilterOptions;
  search?: string;
  topic?: string;
  difficulty?: string;
  tags: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const serializedParams = searchParams.toString();
  const [query, setQuery] = useState(search ?? "");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(serializedParams);
      const nextSearch = query.trim();
      if ((params.get("q") ?? "") === nextSearch) return;

      if (nextSearch) params.set("q", nextSearch);
      else params.delete("q");
      params.delete("page");
      const queryString = params.toString();
      router.replace(
        queryString ? `${pathname}?${queryString}` : pathname,
        { scroll: false }
      );
    }, 350);

    return () => window.clearTimeout(timer);
  }, [pathname, query, router, serializedParams]);

  function updateFilter(name: "topic" | "difficulty", value: string) {
    const params = new URLSearchParams(serializedParams);
    if (value) params.set(name, value);
    else params.delete(name);
    params.delete("page");
    const queryString = params.toString();
    router.replace(
      queryString ? `${pathname}?${queryString}` : pathname,
      { scroll: false }
    );
  }

  function updateTags(select: HTMLSelectElement) {
    const params = new URLSearchParams(serializedParams);
    params.delete("tag");
    for (const option of Array.from(select.selectedOptions)) {
      params.append("tag", option.value);
    }
    params.delete("page");
    const queryString = params.toString();
    router.replace(
      queryString ? `${pathname}?${queryString}` : pathname,
      { scroll: false }
    );
  }

  return (
    <section
      aria-label="Filter problems"
      className="grid gap-3 rounded-xl border border-border bg-bg-card p-4 md:grid-cols-2 xl:grid-cols-5"
    >
      <label className="flex flex-col gap-1.5 text-xs font-medium text-text-secondary xl:col-span-2">
        Search title
        <input
          type="search"
          name="q"
          maxLength={100}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search problems"
          autoComplete="off"
          className="h-10 rounded-lg border border-border bg-bg-base px-3 text-sm text-text-primary outline-none focus:border-accent-primary"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-medium text-text-secondary">
        Topic
        <select
          name="topic"
          value={topic ?? ""}
          onChange={(event) => updateFilter("topic", event.target.value)}
          className="h-10 rounded-lg border border-border bg-bg-base px-3 text-sm text-text-primary outline-none focus:border-accent-primary"
        >
          <option value="">All topics</option>
          {filters.topics.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-medium text-text-secondary">
        Difficulty
        <select
          name="difficulty"
          value={difficulty ?? ""}
          onChange={(event) => updateFilter("difficulty", event.target.value)}
          className="h-10 rounded-lg border border-border bg-bg-base px-3 text-sm text-text-primary outline-none focus:border-accent-primary"
        >
          <option value="">All levels</option>
          {filters.difficulties.map((level) => (
            <option key={level} value={level}>
              {level[0].toUpperCase() + level.slice(1)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-medium text-text-secondary xl:col-span-2">
        Tags (select multiple with Ctrl or Command)
        <select
          name="tag"
          multiple
          value={tags}
          onChange={(event) => updateTags(event.currentTarget)}
          className="min-h-24 rounded-lg border border-border bg-bg-base px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-primary"
        >
          {filters.tags.map((tag) => (
            <option key={tag.id} value={tag.slug}>
              {tag.name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-end gap-2 xl:col-span-3">
        <span className="text-sm text-text-muted" aria-live="polite">
          Search updates automatically
        </span>
        <Link
          href="/problems"
          scroll={false}
          className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          Clear filters
        </Link>
      </div>
    </section>
  );
}
