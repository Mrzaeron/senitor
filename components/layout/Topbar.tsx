"use client";

import { Search, Bell, Menu } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { NAV_ITEMS } from "@/components/layout/Sidebar";
import { usePathname } from "next/navigation";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TopbarProps {
  /** Callback to open the mobile drawer */
  onMenuOpen: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Topbar({ onMenuOpen }: TopbarProps) {
  const pathname = usePathname();

  // Derive page title from current route
  const currentNav = NAV_ITEMS.find((item) =>
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href)
  );
  const pageTitle = currentNav?.label ?? "Senitor";

  return (
    <header
      className={[
        "flex h-16 shrink-0 items-center gap-4 px-4 md:px-6",
        "bg-bg-secondary border-b border-border",
      ].join(" ")}
    >
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuOpen}
        aria-label="Open navigation menu"
        className={[
          "flex md:hidden items-center justify-center h-9 w-9 rounded-lg",
          "text-text-muted hover:text-text-primary hover:bg-bg-overlay",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary",
        ].join(" ")}
      >
        <Menu size={20} aria-hidden />
      </button>

      {/* Page title */}
      <h1 className="text-base font-semibold text-text-primary leading-none truncate flex-1 md:flex-none">
        {pageTitle}
      </h1>

      {/* ── Right cluster ── */}
      <div className="ml-auto flex items-center gap-2">
        {/* Search — UI only */}
        <div className="hidden sm:flex items-center gap-2 h-9 w-56 lg:w-72 rounded-lg bg-bg-base border border-border px-3 transition-colors focus-within:border-border-accent focus-within:ring-1 focus-within:ring-accent-primary/30">
          <Search
            size={14}
            className="shrink-0 text-text-muted"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search problems, topics…"
            aria-label="Search"
            className={[
              "flex-1 bg-transparent text-sm text-text-primary",
              "placeholder:text-text-muted",
              "focus:outline-none",
            ].join(" ")}
          />
          <kbd className="hidden lg:inline-flex items-center gap-1 text-[10px] font-mono text-text-muted border border-border rounded px-1 py-0.5">
            ⌘K
          </kbd>
        </div>

        {/* Notification bell */}
        <button
          aria-label="Notifications"
          className={[
            "relative flex items-center justify-center h-9 w-9 rounded-lg",
            "text-text-muted hover:text-text-primary hover:bg-bg-overlay",
            "transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary",
          ].join(" ")}
        >
          <Bell size={18} aria-hidden />
          {/* Unread badge */}
          <span
            aria-label="3 unread notifications"
            className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent-primary ring-2 ring-bg-secondary"
          />
        </button>

        {/* User avatar */}
        <button
          aria-label="Open user menu"
          className={[
            "rounded-full focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-accent-primary focus-visible:ring-offset-2",
            "focus-visible:ring-offset-bg-secondary",
          ].join(" ")}
        >
          <Avatar fallback="Daksh Sharma" size="sm" status="online" />
        </button>
      </div>
    </header>
  );
}
