"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, Eraser, Send, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Mode = "learn" | "hint" | "debug" | "practice" | "explain";
type Message = { role: "user" | "assistant"; content: string };

const modeDescriptions: Record<Mode, string> = {
  learn: "Learn a DSA concept clearly.",
  hint: "Get incremental hints without the solution.",
  debug: "Analyse code and an error message.",
  practice: "Generate a targeted practice question.",
  explain: "Walk through a solution step by step.",
};

const initialMessage: Message = {
  role: "assistant",
  content:
    "Hi! I’m your DSA tutor. Ask me about a concept, algorithm, complexity, bug, or practice problem.",
};

export function TutorChat() {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [mode, setMode] = useState<Mode>("learn");
  const [input, setInput] = useState("");
  const [currentTopic, setCurrentTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const content = input.trim();
    if (!content || loading) return;
    const userMessage: Message = { role: "user", content };
    const history = messages.filter((message) => message !== initialMessage).slice(-12);
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, message: content, history, currentTopic }),
      });
      const result = (await response.json()) as { reply?: string; error?: string };
      if (!response.ok) throw new Error(result.error || "The tutor could not respond.");
      if (!result.reply) throw new Error("The tutor returned an empty response.");
      setMessages((current) => [...current, { role: "assistant", content: result.reply! }]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The tutor could not respond.");
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([initialMessage]);
    setError(null);
    setInput("");
  }

  return (
    <Card className="flex min-h-[calc(100dvh-12rem)] flex-col overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 sm:p-5">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-text-primary">
            <Bot size={19} className="text-accent-secondary" aria-hidden />
            DSA Tutor
          </h2>
          <p className="mt-1 text-xs text-text-muted">{modeDescriptions[mode]}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={clearChat} leftIcon={<Eraser size={14} />}>
          Clear chat
        </Button>
      </header>

      <div className="grid gap-3 border-b border-border bg-bg-secondary p-4 sm:grid-cols-[180px_1fr]">
        <label className="text-xs text-text-muted">
          Teaching mode
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value as Mode)}
            className="mt-1.5 h-10 w-full rounded-lg border border-border bg-bg-card px-2 text-sm text-text-primary focus:border-border-accent focus:outline-none"
          >
            {Object.keys(modeDescriptions).map((value) => (
              <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-text-muted">
          Current topic <span className="text-text-muted">(optional)</span>
          <input
            value={currentTopic}
            onChange={(event) => setCurrentTopic(event.target.value)}
            placeholder="e.g. arrays or recursion"
            className="mt-1.5 h-10 w-full rounded-lg border border-border bg-bg-card px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-border-accent focus:outline-none"
          />
        </label>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6" aria-live="polite">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}>
            {message.role === "assistant" && <Bot size={18} className="mt-1 shrink-0 text-accent-secondary" aria-hidden />}
            <div className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-accent-primary text-text-inverted" : "bg-bg-secondary text-text-secondary"}`}>
              {message.content}
            </div>
            {message.role === "user" && <User size={18} className="mt-1 shrink-0 text-text-muted" aria-hidden />}
          </div>
        ))}
        {loading && <p role="status" className="text-sm text-text-muted">Tutor is thinking…</p>}
        {error && <p role="alert" className="rounded-lg border border-error/40 bg-error/10 p-3 text-sm text-error">{error}</p>}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="border-t border-border p-4 sm:p-5">
        <label htmlFor="tutor-message" className="sr-only">Message the DSA tutor</label>
        <div className="flex items-end gap-2">
          <textarea
            id="tutor-message"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask a DSA question…"
            rows={2}
            maxLength={4000}
            className="min-h-12 flex-1 resize-y rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-border-accent focus:outline-none"
          />
          <Button type="submit" loading={loading} aria-label="Send message" leftIcon={<Send size={15} />}>
            Send
          </Button>
        </div>
      </form>
    </Card>
  );
}
