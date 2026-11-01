"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { createClient } from "@/lib/supabase/client";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AppShellProps {
  children: React.ReactNode;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userName, setUserName] = useState("Student");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active || !session?.user) return;
      const { user } = session;
      const metadataName = user.user_metadata?.full_name;
      setUserName(
        typeof metadataName === "string" && metadataName.trim()
          ? metadataName.trim()
          : user.email?.split("@")[0] || "Student"
      );
      setUserEmail(user.email ?? "");
    }).catch((error: unknown) => {
      if (process.env.NODE_ENV === "development") {
        console.error("[navigation] local session display lookup failed", {
          name: error instanceof Error ? error.name : "Unknown error",
        });
      }
    });

    return () => {
      active = false;
    };
  }, []);

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
            userName={userName}
            userEmail={userEmail}
          />
        </Suspense>
      </div>

      {/* ── Mobile drawer ── */}
      <Suspense fallback={null}>
        <MobileNav
          open={mobileNavOpen}
          onClose={closeMobileNav}
          userName={userName}
          userEmail={userEmail}
        />
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
          <Topbar onMenuOpen={openMobileNav} userName={userName} />
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
