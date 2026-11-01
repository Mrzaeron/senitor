"use client";

import { Suspense, useCallback, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileNav } from "@/components/layout/MobileNav";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AppShellProps {
  children: React.ReactNode;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const toggleSidebar = useCallback(
    () => setSidebarCollapsed((prev) => !prev),
    []
  );

  const openMobileNav  = useCallback(() => setMobileNavOpen(true),  []);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  return (
    /*
     * Full-viewport flex container.
     * On desktop: sidebar (fixed-width) + main column (flex-1) side by side.
     * On mobile:  main column fills full width; sidebar becomes a drawer.
     */
    <div className="flex h-full min-h-screen overflow-hidden bg-bg-base">

      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <div className="hidden md:flex md:flex-col md:shrink-0">
        <Suspense
          fallback={
            <div
              className="h-full w-[240px] bg-bg-secondary"
              aria-hidden="true"
            />
          }
        >
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={toggleSidebar}
          />
        </Suspense>
      </div>

      {/* ── Mobile drawer ── */}
      <Suspense fallback={null}>
        <MobileNav open={mobileNavOpen} onClose={closeMobileNav} />
      </Suspense>

      {/* ── Right column: Topbar + page content ── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Suspense
          fallback={
            <div
              className="h-16 shrink-0 bg-bg-secondary"
              aria-hidden="true"
            />
          }
        >
          <Topbar onMenuOpen={openMobileNav} />
        </Suspense>

        {/* ── Main content area ── */}
        <main
          id="main-content"
          className={[
            "flex-1 overflow-y-auto",
            "px-4 py-6 md:px-6 md:py-8",
          ].join(" ")}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
