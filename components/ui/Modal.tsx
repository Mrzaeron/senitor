"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ModalProps {
  /** Controls open/close state */
  open: boolean;
  /** Called when the user closes the modal */
  onClose: () => void;
  /** Optional title rendered in the header */
  title?: string;
  /** Optional description rendered below the title */
  description?: string;
  /** Modal body content */
  children?: React.ReactNode;
  /** Footer actions (buttons, etc.) */
  footer?: React.ReactNode;
  /** 'sm' | 'md' | 'lg' | 'xl' — default is 'md' */
  size?: "sm" | "md" | "lg" | "xl";
  /** Prevent closing by clicking the overlay */
  preventClose?: boolean;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
} as const;

// ─── Component ───────────────────────────────────────────────────────────────

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  preventClose = false,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !preventClose) onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose, preventClose]);

  // Trap focus inside the modal
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => {
      previouslyFocused?.focus();
    };
  }, [open]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    /* Overlay */
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      aria-describedby={description ? "modal-description" : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
        onClick={preventClose ? undefined : onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={[
          "relative z-10 w-full",
          "bg-bg-card border border-border rounded-xl shadow-lg",
          "focus:outline-none",
          "animate-in fade-in zoom-in-95 duration-200",
          sizeClasses[size],
        ].join(" ")}
      >
        {/* Header */}
        {(title || !preventClose) && (
          <div className="flex items-start justify-between p-6 pb-4">
            <div>
              {title && (
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-text-primary"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id="modal-description"
                  className="mt-1 text-sm text-text-secondary"
                >
                  {description}
                </p>
              )}
            </div>

            {!preventClose && (
              <button
                onClick={onClose}
                aria-label="Close modal"
                className={[
                  "ml-4 shrink-0 rounded-md p-1.5",
                  "text-text-muted hover:text-text-primary",
                  "hover:bg-bg-overlay transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2",
                  "focus-visible:ring-accent-primary",
                ].join(" ")}
              >
                <X size={16} aria-hidden />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        {children && (
          <div className="px-6 pb-4 text-sm text-text-secondary">
            {children}
          </div>
        )}

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
