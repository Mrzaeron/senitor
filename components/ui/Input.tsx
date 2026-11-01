"use client";

import { forwardRef, useId } from "react";
import { AlertCircle } from "lucide-react";

// ─── Label ───────────────────────────────────────────────────────────────────

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  function Label({ required, className = "", children, ...props }, ref) {
    return (
      <label
        ref={ref}
        className={[
          "block text-sm font-medium text-text-primary mb-1.5",
          className,
        ].join(" ")}
        {...props}
      >
        {children}
        {required && (
          <span className="ml-1 text-error" aria-hidden>
            *
          </span>
        )}
      </label>
    );
  }
);

// ─── Input ────────────────────────────────────────────────────────────────────

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label displayed above the input */
  label?: string;
  /** Error message shown below — also turns border red */
  error?: string;
  /** Helper text shown below when no error */
  hint?: string;
  /** Icon rendered on the left inside the input */
  leftIcon?: React.ReactNode;
  /** Icon rendered on the right inside the input */
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      id: externalId,
      disabled,
      className = "",
      ...props
    },
    ref
  ) {
    const generatedId = useId();
    const id = externalId ?? generatedId;
    const errorId = `${id}-error`;
    const hintId  = `${id}-hint`;

    const describedBy = [
      error ? errorId : null,
      hint  ? hintId  : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    return (
      <div className="flex flex-col w-full">
        {label && (
          <Label htmlFor={id} required={props.required}>
            {label}
          </Label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span
              className="absolute left-3 text-text-muted pointer-events-none"
              aria-hidden
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={id}
            disabled={disabled}
            aria-describedby={describedBy}
            aria-invalid={!!error}
            className={[
              // base
              "w-full bg-bg-secondary text-text-primary text-sm",
              "border rounded-lg px-3 py-2.5",
              "placeholder:text-text-muted",
              "transition-colors duration-150",
              "focus:outline-none focus:ring-2 focus:ring-offset-1",
              "focus:ring-offset-bg-base",
              // state-based border / ring
              error
                ? "border-error focus:border-error focus:ring-error/40"
                : "border-border focus:border-border-accent focus:ring-accent-primary/30",
              // icon padding
              leftIcon  ? "pl-9"  : "",
              rightIcon ? "pr-9"  : "",
              // disabled
              disabled ? "opacity-50 cursor-not-allowed" : "",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...props}
          />

          {rightIcon && (
            <span
              className="absolute right-3 text-text-muted pointer-events-none"
              aria-hidden
            >
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p
            id={errorId}
            role="alert"
            className="mt-1.5 flex items-center gap-1 text-xs text-error"
          >
            <AlertCircle size={12} aria-hidden />
            {error}
          </p>
        )}

        {!error && hint && (
          <p id={hintId} className="mt-1.5 text-xs text-text-muted">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
