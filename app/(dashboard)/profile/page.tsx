import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { getUserProfile } from "@/app/auth/actions";
import { ProfileSettingsForm } from "@/components/profile/ProfileSettingsForm";
import { measureServerData } from "@/lib/supabase/diagnostics";

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <section
          role="status"
          aria-busy="true"
          className="max-w-2xl rounded-xl border border-border bg-bg-card p-6 text-sm text-text-secondary"
        >
          Loading profile settings…
        </section>
      }
    >
      <ProfileSettingsContent />
    </Suspense>
  );
}

async function ProfileSettingsContent() {
  await connection();
  let profile;
  try {
    profile = await measureServerData(
      "/profile",
      "profile data",
      getUserProfile
    );
  } catch {
    return (
      <section className="max-w-2xl space-y-3 rounded-xl border border-border bg-bg-card p-6">
        <h2 className="text-xl font-semibold text-text-primary">
          Profile settings unavailable
        </h2>
        <p className="text-sm text-text-secondary">
          Your settings could not be loaded. Please retry.
        </p>
        <Link
          href="/profile"
          className="inline-flex text-sm font-medium text-accent-secondary hover:text-text-primary"
        >
          Retry loading profile
        </Link>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="max-w-2xl space-y-3 rounded-xl border border-border bg-bg-card p-6">
        <h2 className="text-xl font-semibold text-text-primary">
          Profile not found
        </h2>
        <p className="text-sm text-text-secondary">
          Complete onboarding to configure your learning preferences.
        </p>
        <Link
          href="/onboarding"
          className="inline-flex text-sm font-medium text-accent-secondary hover:text-text-primary"
        >
          Continue onboarding
        </Link>
      </section>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-accent-secondary">Account</p>
        <h2 className="text-2xl font-bold text-text-primary">Profile settings</h2>
        <p className="text-sm text-text-secondary">
          Update the preferences used to personalize your learning dashboard.
        </p>
      </header>

      <section className="rounded-xl border border-border bg-bg-card p-5 md:p-7">
        <ProfileSettingsForm profile={profile} />
      </section>
    </div>
  );
}
