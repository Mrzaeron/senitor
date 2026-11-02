import Link from "next/link";
import { ArrowRight, BookOpen, Code2, Zap } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col bg-bg-base px-5 text-text-primary sm:px-8">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-primary shadow-glow">
            <Zap size={18} className="text-white" aria-hidden />
          </span>
          <span className="text-lg font-bold tracking-tight">SENITOR</span>
        </Link>
        <nav aria-label="Account" className="flex items-center gap-2">
          <Link
            href="/login"
            className="inline-flex h-11 items-center rounded-lg px-3 text-sm font-medium text-text-secondary hover:text-text-primary"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-11 items-center rounded-lg bg-accent-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-primary/90"
          >
            Get started
          </Link>
        </nav>
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center py-16 sm:py-24">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-card px-3 py-1.5 text-xs font-medium text-accent-secondary">
            <Zap size={14} aria-hidden />
            A focused workspace for learning DSA
          </p>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-text-primary sm:text-5xl md:text-6xl">
            Build your problem-solving skills, one step at a time.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg">
            Learn data structures and algorithms through a guided curriculum,
            practice problems, and progress you can track.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-accent-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-primary/90"
            >
              Start learning
              <ArrowRight size={16} aria-hidden />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-border px-5 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-card"
            >
              I already have an account
            </Link>
          </div>
        </div>

        <div className="mt-14 grid gap-4 sm:mt-20 sm:grid-cols-2">
          <article className="rounded-xl border border-border bg-bg-card p-5 sm:p-6">
            <BookOpen size={20} className="text-accent-secondary" aria-hidden />
            <h2 className="mt-4 font-semibold">Follow a learning path</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Move from core concepts to advanced techniques, and pick up where
              you left off.
            </p>
          </article>
          <article className="rounded-xl border border-border bg-bg-card p-5 sm:p-6">
            <Code2 size={20} className="text-accent-secondary" aria-hidden />
            <h2 className="mt-4 font-semibold">Practice with purpose</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Explore challenges by topic and difficulty, then review your
              submissions in your workspace.
            </p>
          </article>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-6xl border-t border-border py-5 text-xs text-text-muted">
        Senitor · Your DSA learning workspace
      </footer>
    </main>
  );
}
