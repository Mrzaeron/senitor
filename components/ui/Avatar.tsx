import { forwardRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** URL of the image to display */
  src?: string;
  /** Alt text for the image */
  alt?: string;
  /** Displayed as initials when src is absent or fails to load */
  fallback?: string;
  size?: AvatarSize;
  /** Online / offline status indicator */
  status?: "online" | "offline" | "away";
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const sizeClasses: Record<AvatarSize, string> = {
  xs: "w-6  h-6  text-[10px]",
  sm: "w-8  h-8  text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

const statusClasses: Record<
  NonNullable<AvatarProps["status"]>,
  string
> = {
  online:  "bg-success",
  offline: "bg-text-muted",
  away:    "bg-warning",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ─── Component ───────────────────────────────────────────────────────────────

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  function Avatar(
    {
      src,
      alt = "",
      fallback,
      size = "md",
      status,
      className = "",
      ...props
    },
    ref
  ) {
    return (
      <span
        ref={ref}
        className={[
          "relative inline-flex shrink-0 items-center justify-center",
          "rounded-full bg-accent-subtle border border-border overflow-hidden",
          sizeClasses[size],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={alt || fallback || "avatar"}
        {...props}
      >
        {src ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={src}
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <span
            className="font-semibold text-accent-secondary select-none"
            aria-hidden={!!alt}
          >
            {fallback ? toInitials(fallback) : "?"}
          </span>
        )}

        {status && (
          <span
            className={[
              "absolute bottom-0 right-0 block rounded-full",
              "border-2 border-bg-base w-2.5 h-2.5",
              statusClasses[status],
            ].join(" ")}
            aria-label={status}
          />
        )}
      </span>
    );
  }
);
