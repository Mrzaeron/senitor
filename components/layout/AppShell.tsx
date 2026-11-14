"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { createClient } from "@/lib/supabase/client";
import { getAvatarUrl } from "@/lib/profile/avatar";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AppShellProps {
  children: React.ReactNode;
}

type ProfileIdentity = {
  full_name: string | null;
  avatar_path?: string | null;
};

// ─── Component ───────────────────────────────────────────────────────────────

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userName, setUserName] = useState("Student");
  const [userEmail, setUserEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    const loadUserIdentity = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!active || !data.user) return;
      const { user } = data;
      const profileResult = await supabase
        .from("profiles")
        .select("full_name, avatar_path")
        .eq("id", user.id)
        .maybeSingle();
      let profile: ProfileIdentity | null = profileResult.data as ProfileIdentity | null;
      let profileError = profileResult.error;
      if (profileError?.code === "42703") {
        const fallback = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();
        profile = fallback.data;
        profileError = fallback.error;
        if (!fallback.error && process.env.NODE_ENV === "development") {
          console.warn(
            "[navigation] avatar_path is unavailable; using profile identity without an avatar"
          );
        }
      }
      if (profileError) {
        console.error("[navigation] profile identity lookup failed", {
          code: profileError.code,
        });
      }
      const metadataName = user.user_metadata?.full_name;
      setUserName(
        profile?.full_name?.trim() ||
          (typeof metadataName === "string" && metadataName.trim()
            ? metadataName.trim()
            : user.email?.split("@")[0] || "Student")
      );
      setUserEmail(user.email ?? "");
      setAvatarUrl(getAvatarUrl(profile?.avatar_path ?? null));
    };
    void loadUserIdentity().catch((error: unknown) => {
      if (process.env.NODE_ENV === "development") {
        console.error("[navigation] identity lookup failed", {
          name: error instanceof Error ? error.name : "Unknown error",
        });
      }
    });

    const handleProfileUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{
        userName?: string;
        avatarUrl?: string;
      }>).detail;
      if (detail.userName) setUserName(detail.userName);
      setAvatarUrl(detail.avatarUrl);
    };
    window.addEventListener("senitor:profile-updated", handleProfileUpdate);

    return () => {
      active = false;
      window.removeEventListener("senitor:profile-updated", handleProfileUpdate);
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
              avatarUrl={avatarUrl}
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
          avatarUrl={avatarUrl}
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
