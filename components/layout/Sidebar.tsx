"use client";

import Link from "next/link";
import { memo } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Code2,
  BrainCircuit,
  TrendingUp,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Separator } from "@/components/ui/Separator";
import { Tooltip } from "@/components/ui/Tooltip";
import { logoutAction } from "@/app/auth/actions";

// ─── Navigation config ────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",  href: "/dashboard", icon: <LayoutDashboard size={18} /> },
  { label: "Learn DSA",  href: "/learn",     icon: <BookOpen        size={18} /> },
  { label: "Problems",   href: "/problems",  icon: <Code2           size={18} /> },
  { label: "AI Tutor",   href: "/ai-tutor",  icon: <BrainCircuit    size={18} /> },
  { label: "Progress",   href: "/progress",  icon: <TrendingUp      size={18} /> },
  { label: "Profile",    href: "/profile",   icon: <User            size={18} /> },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  userName: string;
  userEmail: string;
  /** Mobile: always expanded; collapse toggle hidden */
  isMobile?: boolean;
}

// ─── NavLink ──────────────────────────────────────────────────────────────────

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const link = (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={[
        "group flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5",
        "text-sm font-medium transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary",
        active
          ? "bg-accent-subtle text-accent-secondary border border-accent-primary/30"
          : "text-text-secondary hover:bg-bg-overlay hover:text-text-primary border border-transparent",
        collapsed ? "justify-center px-2.5" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Icon — always visible */}
      <span
        className={[
          "shrink-0 transition-colors",
          active
            ? "text-accent-primary"
            : "text-text-muted group-hover:text-text-primary",
        ].join(" ")}
      >
        {item.icon}
      </span>

      {/* Label — hidden when collapsed */}
      {!collapsed && (
        <span className="truncate leading-none">{item.label}</span>
      )}

      {/* Active indicator dot (collapsed view) */}
      {collapsed && active && (
        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent-primary" />
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip content={item.label} side="right">
        <span className="relative block">{link}</span>
      </Tooltip>
    );
  }

  return link;
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

export const Sidebar = memo(function Sidebar({
  collapsed,
  onToggle,
  userName,
  userEmail,
  isMobile = false,
}: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <aside
      aria-label={isMobile ? "Secondary navigation" : "Main navigation"}
      className={[
        "relative flex flex-col h-full",
        "bg-bg-secondary border-r border-border",
        "transition-all duration-300 ease-in-out",
        isMobile ? "pt-[env(safe-area-inset-top)]" : "",
        collapsed && !isMobile ? "w-[60px]" : "w-[240px]",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* ── Brand ── */}
      <div
        className={[
          "flex items-center h-16 px-4 border-b border-border shrink-0",
          collapsed && !isMobile ? "justify-center px-2" : "gap-2.5",
        ].join(" ")}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-primary shadow-glow">
          <Zap size={16} className="text-white" aria-hidden />
        </div>
        {(!collapsed || isMobile) && (
          <span className="text-base font-bold tracking-tight text-text-primary">
            SENITOR
          </span>
        )}
      </div>

      {/* ── Nav items ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(item.href)}
            collapsed={collapsed && !isMobile}
          />
        ))}
      </nav>

      {/* ── User section ── */}
      <div className="shrink-0 border-t border-border">
        <Separator className="hidden" />

        {/* User profile row */}
        <div
          className={[
            "flex items-center gap-3 px-3 py-3",
            collapsed && !isMobile ? "justify-center px-2" : "",
          ].join(" ")}
        >
          <Avatar
            fallback={userName}
            size="sm"
            status="online"
            className="shrink-0"
          />
          {(!collapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate leading-tight">
                {userName}
              </p>
              <p className="text-xs text-text-muted truncate leading-tight">
                {userEmail}
              </p>
            </div>
          )}
        </div>

        {/* Logout */}
        {collapsed && !isMobile ? (
          <Tooltip content="Log out" side="right">
            <button
              onClick={() => logoutAction()}
              aria-label="Log out"
              className={[
                "flex min-h-11 w-full items-center justify-center px-2 py-2.5 mx-auto mb-2 cursor-pointer",
                "rounded-lg text-text-muted hover:text-error hover:bg-error-muted/30",
                "transition-colors duration-150 focus-visible:outline-none",
                "focus-visible:ring-2 focus-visible:ring-accent-primary",
              ].join(" ")}
            >
              <LogOut size={16} aria-hidden />
            </button>
          </Tooltip>
        ) : (
          <button
            onClick={() => logoutAction()}
            aria-label="Log out"
            className={[
              "flex min-h-11 w-full items-center gap-2.5 px-3 py-2.5 mb-2 mx-auto rounded-lg cursor-pointer",
              "text-sm text-text-muted hover:text-error hover:bg-error-muted/30",
              "transition-colors duration-150 focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-accent-primary",
              isMobile ? "w-[calc(100%-16px)]" : "w-[calc(100%-16px)]",
            ].join(" ")}
          >
            <LogOut size={16} aria-hidden />
            <span>Log out</span>
          </button>
        )}
      </div>

      {/* ── Collapse toggle (desktop only) ── */}
      {!isMobile && (
        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={[
            "absolute -right-5 top-[72px]",
            "flex h-11 w-11 items-center justify-center",
            "rounded-full bg-bg-card border border-border",
            "text-text-muted hover:text-text-primary hover:border-border-accent",
            "transition-all duration-150 shadow-sm z-10",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary",
          ].join(" ")}
        >
          {collapsed ? (
            <ChevronRight size={12} aria-hidden />
          ) : (
            <ChevronLeft size={12} aria-hidden />
          )}
        </button>
      )}
    </aside>
  );
});
