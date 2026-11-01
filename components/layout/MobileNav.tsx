"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { usePathname } from "next/navigation";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close drawer on any route change
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Focus close button when drawer opens
  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
    }
  }, [open]);

  // Trap scroll on body while open
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

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <>
      {/* ── Overlay ── */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={[
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden",
          "transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
      />

      {/* ── Drawer ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={[
          "fixed inset-y-0 left-0 z-50 md:hidden",
          "flex flex-col",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Close button floats above the sidebar top-right */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Close navigation menu"
          className={[
            "absolute top-4 right-[-44px] z-10",
            "flex h-9 w-9 items-center justify-center rounded-lg",
            "bg-bg-card border border-border",
            "text-text-muted hover:text-text-primary",
            "transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary",
          ].join(" ")}
        >
          <X size={18} aria-hidden />
        </button>

        {/* Full-height sidebar in mobile (always expanded) */}
        <Sidebar
          collapsed={false}
          onToggle={() => {}}
          isMobile
        />
      </div>
    </>
  );
}
