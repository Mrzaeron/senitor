import { forwardRef } from "react";

// ─── Base shimmer ─────────────────────────────────────────────────────────────
// A single reusable animated shimmer bar.

interface SkeletonBaseProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Explicit width (Tailwind class or inline style) */
  width?: string;
  /** Explicit height (Tailwind class) */
  height?: string;
  /** Fully round (pill / avatar shape) */
  rounded?: boolean;
}

const SkeletonBase = forwardRef<HTMLDivElement, SkeletonBaseProps>(
  function SkeletonBase(
    { width, height, rounded = false, className = "", style, ...props },
    ref
  ) {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={[
          "animate-pulse bg-bg-overlay",
          rounded ? "rounded-full" : "rounded-md",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ width, height, ...style }}
        {...props}
      />
    );
  }
);

// ─── Skeleton (generic, alias of SkeletonBase) ────────────────────────────────

export const Skeleton = SkeletonBase;

// ─── SkeletonText ─────────────────────────────────────────────────────────────

export interface SkeletonTextProps {
  /** Number of lines to render */
  lines?: number;
  /** Last line is shorter for a natural paragraph look */
  lastLineShort?: boolean;
  className?: string;
}

export function SkeletonText({
  lines = 3,
  lastLineShort = true,
  className = "",
}: SkeletonTextProps) {
  return (
    <div className={["flex flex-col gap-2", className].join(" ")} aria-hidden>
      {Array.from({ length: lines }, (_, i) => {
        const isLast  = i === lines - 1;
        const isShort = isLast && lastLineShort;
        return (
          <SkeletonBase
            key={i}
            className="h-3"
            style={{ width: isShort ? "60%" : "100%" }}
          />
        );
      })}
    </div>
  );
}

// ─── SkeletonCard ─────────────────────────────────────────────────────────────

export interface SkeletonCardProps {
  /** Show a header row with icon + title */
  showHeader?: boolean;
  /** Number of text lines in the body */
  lines?: number;
  className?: string;
}

export function SkeletonCard({
  showHeader = true,
  lines = 3,
  className = "",
}: SkeletonCardProps) {
  return (
    <div
      className={[
        "bg-bg-card border border-border rounded-lg p-6 flex flex-col gap-4",
        className,
      ].join(" ")}
      aria-hidden
    >
      {showHeader && (
        <div className="flex items-center gap-3">
          <SkeletonBase className="h-10 w-10" rounded />
          <div className="flex flex-col gap-2 flex-1">
            <SkeletonBase className="h-3.5 w-1/2" />
            <SkeletonBase className="h-3 w-1/3" />
          </div>
        </div>
      )}
      <SkeletonText lines={lines} />
    </div>
  );
}

// ─── SkeletonAvatar ───────────────────────────────────────────────────────────

export interface SkeletonAvatarProps {
  size?: number;
  className?: string;
}

export function SkeletonAvatar({ size = 40, className = "" }: SkeletonAvatarProps) {
  return (
    <SkeletonBase
      rounded
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
