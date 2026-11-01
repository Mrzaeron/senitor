"use client";

import { useState, useRef, useId, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TooltipSide = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  /** The tooltip label text */
  content: string;
  /** Where the tooltip appears relative to the trigger */
  side?: TooltipSide;
  /** Delay in ms before tooltip shows (default 400) */
  delayMs?: number;
  /** The element that triggers the tooltip */
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
}

// ─── Position styles ──────────────────────────────────────────────────────────

const positionClasses: Record<TooltipSide, string> = {
  top:    "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full    left-1/2 -translate-x-1/2 mt-2",
  left:   "right-full  top-1/2  -translate-y-1/2 mr-2",
  right:  "left-full   top-1/2  -translate-y-1/2 ml-2",
};

const arrowClasses: Record<TooltipSide, string> = {
  top:    "top-full   left-1/2 -translate-x-1/2 border-t-bg-overlay border-x-transparent border-b-transparent",
  bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-bg-overlay border-x-transparent border-t-transparent",
  left:   "left-full  top-1/2  -translate-y-1/2 border-l-bg-overlay border-y-transparent border-r-transparent",
  right:  "right-full top-1/2  -translate-y-1/2 border-r-bg-overlay border-y-transparent border-l-transparent",
};

// ─── Component ───────────────────────────────────────────────────────────────

export function Tooltip({
  content,
  side = "top",
  delayMs = 400,
  children,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId  = useId();

  const show = useCallback(() => {
    timeoutRef.current = setTimeout(() => setVisible(true), delayMs);
  }, [delayMs]);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  // Clone child to inject aria-describedby and event handlers cleanly
  const trigger = children;

  return (
    <span className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide} onFocusCapture={show} onBlurCapture={hide}>
      {/* Wrap child so we don't mutate it */}
      <span
        aria-describedby={visible ? tooltipId : undefined}
        className="inline-flex"
      >
        {trigger}
      </span>

      {visible && (
        <span
          id={tooltipId}
          role="tooltip"
          className={[
            "pointer-events-none absolute z-50 whitespace-nowrap",
            "rounded-md bg-bg-overlay border border-border",
            "px-2.5 py-1.5 text-xs font-medium text-text-primary shadow-md",
            "animate-in fade-in duration-150",
            positionClasses[side],
          ].join(" ")}
        >
          {content}
          {/* Arrow */}
          <span
            aria-hidden
            className={[
              "absolute w-0 h-0 border-4",
              arrowClasses[side],
            ].join(" ")}
          />
        </span>
      )}
    </span>
  );
}
