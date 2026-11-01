"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize    = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style of the button */
  variant?: ButtonVariant;
  /** Size preset */
  size?: ButtonSize;
  /** Replaces content with a spinner and disables the button */
  loading?: boolean;
  /** Icon rendered before the label */
  leftIcon?: React.ReactNode;
  /** Icon rendered after the label */
  rightIcon?: React.ReactNode;
  /** Stretch to fill the parent width */
  fullWidth?: boolean;
}

// ─── Variant & size maps ──────────────────────────────────────────────────────

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent-primary text-text-inverted hover:bg-accent-secondary " +
    "active:bg-accent-muted shadow-sm",
  secondary:
    "bg-bg-card text-text-primary border border-border " +
    "hover:bg-bg-overlay hover:border-border-accent active:bg-bg-secondary",
  outline:
    "bg-transparent text-accent-primary border border-accent-primary " +
    "hover:bg-accent-subtle active:bg-accent-muted/20",
  ghost:
    "bg-transparent text-text-secondary border border-transparent " +
    "hover:bg-bg-card hover:text-text-primary active:bg-bg-overlay",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8  px-3 text-xs gap-1.5 rounded-md",
  md: "h-10 px-4 text-sm gap-2   rounded-lg",
  lg: "h-12 px-6 text-base gap-2.5 rounded-lg",
};

// ─── Component ───────────────────────────────────────────────────────────────

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant   = "primary",
      size      = "md",
      loading   = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        className={[
          // base
          "inline-flex items-center justify-center font-medium",
          "transition-colors duration-150 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-accent-primary focus-visible:ring-offset-2",
          "focus-visible:ring-offset-bg-base",
          "select-none whitespace-nowrap",
          // variant & size
          variantClasses[variant],
          sizeClasses[size],
          // state
          isDisabled
            ? "opacity-50 cursor-not-allowed pointer-events-none"
            : "cursor-pointer",
          fullWidth ? "w-full" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {loading ? (
          <Loader2
            className="animate-spin shrink-0"
            size={size === "sm" ? 14 : size === "lg" ? 18 : 16}
            aria-hidden
          />
        ) : (
          leftIcon && (
            <span className="shrink-0" aria-hidden>
              {leftIcon}
            </span>
          )
        )}

        {children && <span>{children}</span>}

        {!loading && rightIcon && (
          <span className="shrink-0" aria-hidden>
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);
