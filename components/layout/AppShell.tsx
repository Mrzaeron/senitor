"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
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
  const menuButtonRef = useRef<HTMLButtonElement>(null);

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

  const openMobileNav = useCallback(() => setMobileNavOpen(true), []);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  return (
    <div className="flex min-h-dvh bg-bg-base">
      <div className="hidden md:flex md:flex-col md:shrink-0">
        <Suspense
          fallback={
            <div
              className="sticky top-0 h-dvh w-[240px] bg-bg-secondary"
              aria-hidden="true"
            />
          }
        >
          <div className="sticky top-0 h-dvh">
            <Sidebar
              collapsed={sidebarCollapsed}
              onToggle={toggleSidebar}
              userName={userName}
              userEmail={userEmail}
            />
          </div>
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <MobileNav
          open={mobileNavOpen}
          onClose={closeMobileNav}
          triggerRef={menuButtonRef}
          userName={userName}
          userEmail={userEmail}
        />
      </Suspense>

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <Suspense
          fallback={
            <div
              className="h-16 shrink-0 bg-bg-secondary"
              aria-hidden="true"
            />
          }
        >
          <Topbar
            onMenuOpen={openMobileNav}
            menuButtonRef={menuButtonRef}
            userName={userName}
          />
        </Suspense>

        <main
          id="main-content"
          className={[
            "min-w-0 flex-1 px-4 py-6 pb-[calc(5rem+env(safe-area-inset-bottom))]",
            "md:px-6 md:py-8 md:pb-8",
          ].join(" ")}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
