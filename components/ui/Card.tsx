import { forwardRef } from "react";

// ─── Card (root container) ────────────────────────────────────────────────────

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds a violet glow shadow */
  glow?: boolean;
  /** Makes the card interactive (hover lift) */
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  function Card({ glow = false, hoverable = false, className = "", ...props }, ref) {
    return (
      <div
        ref={ref}
        className={[
          "bg-bg-card border border-border rounded-lg",
          "transition-all duration-200",
          hoverable
            ? "hover:-translate-y-0.5 hover:border-border-accent hover:shadow-md cursor-pointer"
            : "",
          glow ? "shadow-glow" : "shadow-sm",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
    );
  }
);

// ─── CardHeader ──────────────────────────────────────────────────────────────

export const CardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function CardHeader({ className = "", ...props }, ref) {
  return (
    <div
      ref={ref}
      className={["flex flex-col gap-1 p-6 pb-0", className].join(" ")}
      {...props}
    />
  );
});

// ─── CardTitle ───────────────────────────────────────────────────────────────

export const CardTitle = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(function CardTitle({ className = "", ...props }, ref) {
  return (
    <h3
      ref={ref}
      className={[
        "text-lg font-semibold leading-tight tracking-tight text-text-primary",
        className,
      ].join(" ")}
      {...props}
    />
  );
});

// ─── CardDescription ─────────────────────────────────────────────────────────

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function CardDescription({ className = "", ...props }, ref) {
  return (
    <p
      ref={ref}
      className={["text-sm text-text-secondary leading-relaxed", className].join(
        " "
      )}
      {...props}
    />
  );
});

// ─── CardContent ─────────────────────────────────────────────────────────────

export const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function CardContent({ className = "", ...props }, ref) {
  return (
    <div
      ref={ref}
      className={["p-6", className].join(" ")}
      {...props}
    />
  );
});

// ─── CardFooter ──────────────────────────────────────────────────────────────

export const CardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function CardFooter({ className = "", ...props }, ref) {
  return (
    <div
      ref={ref}
      className={[
        "flex items-center p-6 pt-0 gap-3",
        className,
      ].join(" ")}
      {...props}
    />
  );
});
