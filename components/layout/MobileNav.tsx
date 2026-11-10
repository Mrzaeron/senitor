"use client";

import { memo } from "react";
import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  BookOpen,
  Code2,
  LayoutDashboard,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { usePathname } from "next/navigation";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  userName: string;
  userEmail: string;
  avatarUrl?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const MobileNav = memo(function MobileNav({
  open,
  onClose,
  triggerRef,
  userName,
  userEmail,
  avatarUrl,
}: MobileNavProps) {
  const pathname = usePathname();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  // Close drawer on any route change
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Focus close button when drawer opens
  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
      wasOpen.current = true;
    } else if (wasOpen.current) {
      triggerRef.current?.focus();
      wasOpen.current = false;
    }
  }, [open, triggerRef]);

  // Trap scroll on body while open
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
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

  function trapFocus(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable?.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const primaryItems = [
    { label: "Home", href: "/dashboard", icon: <LayoutDashboard size={18} aria-hidden /> },
    { label: "Learn", href: "/learn", icon: <BookOpen size={18} aria-hidden /> },
    { label: "Problems", href: "/problems", icon: <Code2 size={18} aria-hidden /> },
    { label: "Progress", href: "/progress", icon: <TrendingUp size={18} aria-hidden /> },
    { label: "Profile", href: "/profile", icon: <User size={18} aria-hidden /> },
  ];

  return (
    <>
      <nav
        aria-label="Primary navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg-secondary/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="grid h-16 grid-cols-5">
          {primaryItems.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <li key={item.href} className="min-w-0">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex h-full flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-primary",
                    active
                      ? "text-accent-secondary"
                      : "text-text-muted hover:text-text-primary",
                  ].join(" ")}
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

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
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!open}
        inert={!open}
        onKeyDown={trapFocus}
        className={[
          "fixed inset-y-0 left-0 z-50 w-[min(17rem,85vw)] md:hidden",
          "flex flex-col",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Close button floats above the sidebar top-right */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close navigation menu"
          className={[
            "absolute right-[-48px] top-[max(1rem,env(safe-area-inset-top))] z-10",
            "flex h-11 w-11 items-center justify-center rounded-lg",
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
          userName={userName}
          userEmail={userEmail}
          avatarUrl={avatarUrl}
          isMobile
        />
      </div>
    </>
  );
});
