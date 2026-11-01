import Link from "next/link";
import { Zap } from "lucide-react";
import { connection } from "next/server";
import { Suspense } from "react";

async function CurrentYear() {
  await connection();
  return <>© {new Date().getFullYear()}</>;
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 bg-bg-base text-text-primary overflow-x-hidden">
      {/* Background ambient glow effect */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-accent-primary/10 rounded-full blur-[120px] -z-10"
      />

      {/* Brand Header */}
      <div className="mb-8 flex items-center gap-2.5">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-transform hover:scale-105"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-primary shadow-glow">
            <Zap size={18} className="text-white" aria-hidden />
          </div>
          <span className="text-xl font-bold tracking-tight text-text-primary">
            SENITOR
          </span>
        </Link>
      </div>

      {/* Auth Card Container */}
      <main className="w-full max-w-md">{children}</main>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-text-muted">
        <p>
          <Suspense fallback="©">
            <CurrentYear />
          </Suspense>{" "}
          Senitor. AI-powered Personalized DSA Assistant.
        </p>
        <div className="mt-2 flex justify-center gap-4">
          <Link href="/" className="hover:text-text-secondary transition-colors">
            Home
          </Link>
          <Link href="/privacy" className="hover:text-text-secondary transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-text-secondary transition-colors">
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
