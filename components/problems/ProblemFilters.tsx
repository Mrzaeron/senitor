"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { ProblemFilters as ProblemFilterOptions } from "@/types/problems";

type FilterFieldsProps = {
  filters: ProblemFilterOptions;
  topic?: string;
  difficulty?: string;
  tags: string[];
  onFilterChange: (name: "topic" | "difficulty", value: string) => void;
  onTagChange: (tag: string, checked: boolean) => void;
};

function FilterFields({
  filters,
  topic,
  difficulty,
  tags,
  onFilterChange,
  onTagChange,
}: FilterFieldsProps) {
  return (
    <>
      <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium text-text-secondary">
        Topic
        <select
          name="topic"
          value={topic ?? ""}
          onChange={(event) => onFilterChange("topic", event.target.value)}
          className="h-11 w-full rounded-lg border border-border bg-bg-base px-3 text-sm text-text-primary outline-none focus:border-accent-primary"
        >
          <option value="">All topics</option>
          {filters.topics.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium text-text-secondary">
        Difficulty
        <select
          name="difficulty"
          value={difficulty ?? ""}
          onChange={(event) => onFilterChange("difficulty", event.target.value)}
          className="h-11 w-full rounded-lg border border-border bg-bg-base px-3 text-sm text-text-primary outline-none focus:border-accent-primary"
        >
          <option value="">All levels</option>
          {filters.difficulties.map((level) => (
            <option key={level} value={level}>
              {level[0].toUpperCase() + level.slice(1)}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="min-w-0 md:col-span-2 xl:col-span-2">
        <legend className="mb-1.5 text-xs font-medium text-text-secondary">
          Tags (up to 10)
        </legend>
        <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-border bg-bg-base p-3 sm:grid-cols-3">
          {filters.tags.map((tag) => {
            const checked = tags.includes(tag.slug);
            return (
              <label
                key={tag.id}
                className="flex min-w-0 items-center gap-2 rounded-md p-1.5 text-sm text-text-secondary hover:bg-bg-overlay"
              >
                <input
                  type="checkbox"
                  name="tag"
                  value={tag.slug}
                  checked={checked}
                  disabled={!checked && tags.length >= 10}
                  onChange={(event) =>
                    onTagChange(tag.slug, event.currentTarget.checked)
                  }
                  className="h-4 w-4 shrink-0 accent-accent-primary"
                />
                <span className="truncate">{tag.name}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </>
  );
}

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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const wasOpen = useRef(false);

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

  useEffect(() => {
    if (filtersOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      closeButtonRef.current?.focus();
      wasOpen.current = true;
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }

    if (wasOpen.current) {
      filterButtonRef.current?.focus();
      wasOpen.current = false;
    }
  }, [filtersOpen]);

  useEffect(() => {
    if (!filtersOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFiltersOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filtersOpen]);

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

  function updateTag(tag: string, checked: boolean) {
    const params = new URLSearchParams(serializedParams);
    const nextTags = new Set(params.getAll("tag"));
    if (checked && nextTags.size < 10) nextTags.add(tag);
    else if (!checked) nextTags.delete(tag);
    params.delete("tag");
    for (const value of nextTags) params.append("tag", value);
    params.delete("page");
    const queryString = params.toString();
    router.replace(
      queryString ? `${pathname}?${queryString}` : pathname,
      { scroll: false }
    );
  }

  function trapFocus(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab") return;
    const focusable = sheetRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable?.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const fieldProps = {
    filters,
    topic,
    difficulty,
    tags,
    onFilterChange: updateFilter,
    onTagChange: updateTag,
  };

  return (
    <div className="space-y-3">
      <section
        aria-label="Filter problems"
        className="rounded-xl border border-border bg-bg-card p-4"
      >
        <div className="flex items-end gap-3">
          <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-xs font-medium text-text-secondary">
            Search title
            <input
              type="search"
              name="q"
              maxLength={100}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search problems"
              autoComplete="off"
              className="h-11 w-full rounded-lg border border-border bg-bg-base px-3 text-sm text-text-primary outline-none focus:border-accent-primary"
            />
          </label>
          <button
            ref={filterButtonRef}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen(true)}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-text-secondary hover:border-border-accent hover:text-text-primary md:hidden"
          >
            <SlidersHorizontal size={16} aria-hidden />
            Filters
            {tags.length + Number(Boolean(topic)) + Number(Boolean(difficulty)) > 0 && (
              <span className="rounded-full bg-accent-subtle px-1.5 text-xs text-accent-secondary">
                {tags.length + Number(Boolean(topic)) + Number(Boolean(difficulty))}
              </span>
            )}
          </button>
        </div>

        <div className="mt-4 hidden border-t border-border pt-4 md:block">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <FilterFields {...fieldProps} />
            <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2 xl:col-span-5">
              <span className="text-sm text-text-muted" aria-live="polite">
                Search updates automatically
              </span>
              <Link
                href="/problems"
                scroll={false}
                className="inline-flex h-11 items-center rounded-lg border border-border px-4 text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                Clear filters
              </Link>
            </div>
          </div>
        </div>
      </section>

      {filtersOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <section
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="problem-filter-title"
            onKeyDown={trapFocus}
            className="absolute inset-y-0 right-0 flex w-[min(24rem,100%)] flex-col border-l border-border bg-bg-secondary shadow-xl"
          >
            <header className="flex items-center justify-between border-b border-border px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
              <div>
                <h2
                  id="problem-filter-title"
                  className="font-semibold text-text-primary"
                >
                  Filter problems
                </h2>
                <p className="text-xs text-text-muted">
                  Search updates automatically
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close filters"
                onClick={() => setFiltersOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-overlay hover:text-text-primary"
              >
                <X size={18} aria-hidden />
              </button>
            </header>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
              <FilterFields {...fieldProps} />
            </div>
            <footer className="flex gap-3 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Link
                href="/problems"
                scroll={false}
                onClick={() => setFiltersOpen(false)}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-border text-sm text-text-secondary"
              >
                Clear filters
              </Link>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="h-11 flex-1 rounded-lg bg-accent-primary text-sm font-semibold text-white"
              >
                Show problems
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
