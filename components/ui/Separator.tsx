import { forwardRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SeparatorProps extends React.HTMLAttributes<HTMLElement> {
  /** Layout direction */
  orientation?: "horizontal" | "vertical";
  /** Use a label in the centre of the line */
  label?: string;
  /** Visual strength */
  variant?: "default" | "subtle";
}

// ─── Component ───────────────────────────────────────────────────────────────

export const Separator = forwardRef<HTMLElement, SeparatorProps>(
  function Separator(
    {
      orientation = "horizontal",
      label,
      variant     = "default",
      className   = "",
      ...props
    },
    ref
  ) {
    const isHorizontal = orientation === "horizontal";
    const borderColor  = variant === "subtle" ? "border-border-subtle" : "border-border";

    if (isHorizontal && label) {
      return (
        <div
          ref={ref as React.Ref<HTMLDivElement>}
          role="separator"
          aria-orientation="horizontal"
          className={["flex items-center gap-3 w-full", className].join(" ")}
          {...(props as React.HTMLAttributes<HTMLDivElement>)}
        >
          <span className={["flex-1 border-t", borderColor].join(" ")} />
          <span className="shrink-0 text-xs text-text-muted px-1">{label}</span>
          <span className={["flex-1 border-t", borderColor].join(" ")} />
        </div>
      );
    }

    if (isHorizontal) {
      return (
        <hr
          ref={ref as React.Ref<HTMLHRElement>}
          role="separator"
          aria-orientation="horizontal"
          className={["w-full border-t", borderColor, className].join(" ")}
          {...(props as React.HTMLAttributes<HTMLHRElement>)}
        />
      );
    }

    // Vertical
    return (
      <span
        ref={ref as React.Ref<HTMLSpanElement>}
        role="separator"
        aria-orientation="vertical"
        className={[
          "inline-block self-stretch border-l",
          borderColor,
          className,
        ].join(" ")}
        {...(props as React.HTMLAttributes<HTMLSpanElement>)}
      />
    );
  }
);
