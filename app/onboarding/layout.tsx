import Link from "next/link";
import { Zap } from "lucide-react";
import { connection } from "next/server";
import { Suspense } from "react";

async function CurrentYear() {
  await connection();
  return <>© {new Date().getFullYear()}</>;
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start p-4 md:p-8 bg-bg-base text-text-primary overflow-x-hidden">
      {/* Background ambient glow effect */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent-primary/10 rounded-full blur-[140px] -z-10"
      />

      {/* Brand Header */}
      <header className="w-full max-w-2xl py-4 flex items-center justify-between border-b border-border/60 mb-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-transform hover:scale-105"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-primary shadow-glow">
            <Zap size={16} className="text-white" aria-hidden />
          </div>
          <span className="text-lg font-bold tracking-tight text-text-primary">
            SENITOR
          </span>
        </Link>
        <span className="text-xs font-mono text-text-muted uppercase tracking-wider">
          Personalized Onboarding
        </span>
      </header>

      {/* Content */}
      <main className="w-full max-w-2xl flex-1 flex flex-col items-center">
        {children}
      </main>

      <footer className="mt-12 text-center text-xs text-text-muted pb-6">
        <p>
          <Suspense fallback="©">
            <CurrentYear />
          </Suspense>{" "}
          Senitor. Customizing your intelligent DSA curriculum.
        </p>
      </footer>
    </div>
  );
}
