import { forwardRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Completion percentage — 0 to 100 */
  value: number;
  /** Colour variant */
  variant?: "primary" | "success" | "warning" | "error";
  /** Height preset */
  size?: "xs" | "sm" | "md";
  /** Show the percentage label to the right */
  showLabel?: boolean;
  /** Accessible label for screen readers */
  label?: string;
  /** Animate the fill on mount */
  animated?: boolean;
}

// ─── Maps ─────────────────────────────────────────────────────────────────────

const variantClasses: Record<NonNullable<ProgressProps["variant"]>, string> = {
  primary: "bg-accent-primary",
  success: "bg-success",
  warning: "bg-warning",
  error:   "bg-error",
};

const sizeClasses: Record<NonNullable<ProgressProps["size"]>, string> = {
  xs: "h-1",
  sm: "h-1.5",
  md: "h-2.5",
};

// ─── Component ───────────────────────────────────────────────────────────────

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  function Progress(
    {
      value,
      variant   = "primary",
      size      = "sm",
      showLabel = false,
      label     = "Progress",
      animated  = true,
      className = "",
      ...props
    },
    ref
  ) {
    // Clamp value to [0, 100]
    const pct = Math.min(100, Math.max(0, value));

    return (
      <div
        ref={ref}
        className={["flex items-center gap-3 w-full", className].join(" ")}
        {...props}
      >
        {/* Track */}
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
          className={[
            "flex-1 overflow-hidden rounded-full bg-bg-overlay",
            sizeClasses[size],
          ].join(" ")}
        >
          {/* Fill */}
          <div
            className={[
              "h-full rounded-full",
              variantClasses[variant],
              animated ? "transition-all duration-500 ease-out" : "",
            ].join(" ")}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Optional label */}
        {showLabel && (
          <span
            className="shrink-0 text-xs font-medium text-text-secondary tabular-nums w-8 text-right"
            aria-hidden
          >
            {pct}%
          </span>
        )}
      </div>
    );
  }
);
