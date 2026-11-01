import { forwardRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "easy"
  | "medium"
  | "hard";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  /** Renders a small coloured dot before the label */
  dot?: boolean;
}

// ─── Variant map ─────────────────────────────────────────────────────────────

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-bg-overlay text-text-secondary border-border",
  success: "bg-success-muted text-success border-success/30",
  warning: "bg-warning-muted text-warning border-warning/30",
  error:   "bg-error-muted   text-error   border-error/30",
  info:    "bg-info-muted    text-info     border-info/30",
  // DSA difficulty
  easy:    "bg-success-muted text-success border-success/30",
  medium:  "bg-warning-muted text-warning border-warning/30",
  hard:    "bg-error-muted   text-error   border-error/30",
};

const dotClasses: Record<BadgeVariant, string> = {
  default: "bg-text-muted",
  success: "bg-success",
  warning: "bg-warning",
  error:   "bg-error",
  info:    "bg-info",
  easy:    "bg-success",
  medium:  "bg-warning",
  hard:    "bg-error",
};

// ─── Component ───────────────────────────────────────────────────────────────

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  function Badge(
    { variant = "default", dot = false, className = "", children, ...props },
    ref
  ) {
    return (
      <span
        ref={ref}
        className={[
          "inline-flex items-center gap-1.5",
          "text-xs font-medium px-2 py-0.5 rounded-full border",
          variantClasses[variant],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {dot && (
          <span
            className={["w-1.5 h-1.5 rounded-full shrink-0", dotClasses[variant]].join(" ")}
            aria-hidden
          />
        )}
        {children}
      </span>
    );
  }
);
