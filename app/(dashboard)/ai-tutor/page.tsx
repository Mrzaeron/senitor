import { TutorChat } from "@/components/ai-tutor/TutorChat";

export default function AiTutorPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="space-y-1">
        <p className="text-sm font-medium text-accent-secondary">Personalized learning</p>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
          AI Tutor
        </h1>
        <p className="text-sm text-text-secondary">
          Learn DSA concepts, debug code, and practice with guidance tailored to your progress.
        </p>
      </header>
      <TutorChat />
    </div>
  );
}
