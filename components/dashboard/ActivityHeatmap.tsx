"use client";

import { useMemo } from "react";

const weekdayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];
const intensityClasses = [
  "bg-bg-overlay",
  "bg-purple-900/70",
  "bg-purple-700",
  "bg-purple-500",
  "bg-purple-300",
];

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function intensity(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

export function ActivityHeatmap({
  timestamps,
  hasSubmissions,
}: {
  timestamps: string[];
  hasSubmissions: boolean;
}) {
  const { weeks, total } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const timestamp of timestamps) {
      const key = localDateKey(new Date(timestamp));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - 363);
    start.setDate(start.getDate() - start.getDay());
    const result: Array<Array<{ date: Date; count: number }>> = [];
    let activeDays = 0;

    for (let week = 0; week < 53; week += 1) {
      const days = [];
      for (let weekday = 0; weekday < 7; weekday += 1) {
        const date = new Date(start);
        date.setDate(start.getDate() + week * 7 + weekday);
        const count = counts.get(localDateKey(date)) ?? 0;
        if (count > 0) activeDays += 1;
        days.push({ date, count });
      }
      result.push(days);
    }
    return { weeks: result, total: activeDays };
  }, [timestamps]);

  return (
    <section className="rounded-xl border border-border bg-bg-card p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Coding activity</h2>
          <p className="text-xs text-text-muted">
            {total} active {total === 1 ? "day" : "days"} in the last year
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-muted" aria-label="Submission activity intensity">
          <span>Less</span>
          {intensityClasses.map((className, index) => (
            <span
              key={className}
              aria-hidden="true"
              className={`h-3 w-3 rounded-sm ${className} ${index === 0 ? "border border-border" : ""}`}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      {timestamps.length === 0 && !hasSubmissions ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-text-muted">
          Submit a solution to start building your activity history.
        </p>
      ) : (
        <div>
          {timestamps.length === 0 && (
            <p className="mb-3 text-center text-sm text-text-muted">
              No coding activity in the last year.
            </p>
          )}
          <div className="overflow-x-auto pb-2">
            <div className="grid min-w-[700px] grid-cols-[24px_1fr] gap-2">
              <div className="grid grid-rows-7 gap-1 text-[10px] text-text-muted">
                {weekdayLabels.map((label, index) => (
                  <span key={index} className="flex h-3 items-center">{label}</span>
                ))}
              </div>
              <div className="grid grid-flow-col grid-cols-[repeat(53,minmax(0,1fr))] grid-rows-7 gap-1">
                {weeks.flatMap((week, weekIndex) =>
                  week.map(({ date, count }) => {
                    const key = localDateKey(date);
                    const label = date.toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    });
                    const inFuture = date > new Date();
                    return (
                      <span
                        key={`${weekIndex}-${key}`}
                        title={`${label}: ${count} ${count === 1 ? "submission" : "submissions"}`}
                        aria-label={`${label}: ${count} ${count === 1 ? "submission" : "submissions"}`}
                        className={`h-3 w-full rounded-sm ${inFuture ? "bg-transparent" : intensityClasses[intensity(count)]}`}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
