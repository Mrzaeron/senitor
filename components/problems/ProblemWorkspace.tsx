"use client";

import dynamic from "next/dynamic";
import { useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, CircleAlert, LoaderCircle, RotateCcw, Trash2 } from "lucide-react";
import type { BeforeMount } from "@monaco-editor/react";
import {
  runProblemSamplesAction,
  submitProblemAction,
  type RunProblemActionResult,
  type SubmitProblemActionResult,
} from "@/app/(dashboard)/problems/[slug]/actions";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type {
  ProblemLanguage,
  ProblemSubmissionHistoryItem,
  SubmissionStatus,
} from "@/types/problems";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((module) => module.default),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        aria-busy="true"
        className="flex h-[clamp(320px,55dvh,420px)] items-center justify-center bg-bg-base text-sm text-text-muted"
      >
        Loading code editor…
      </div>
    ),
  }
);

const languages: Array<{ value: ProblemLanguage; label: string }> = [
  { value: "cpp", label: "C++" },
  { value: "python", label: "Python" },
];

const draftSubscribers = new Map<string, Set<() => void>>();

const statusLabels: Record<SubmissionStatus, string> = {
  accepted: "Accepted",
  wrong_answer: "Wrong answer",
  compilation_error: "Compilation error",
  runtime_error: "Runtime error",
  time_limit_exceeded: "Time limit exceeded",
  execution_error: "Execution error",
};

const statusVariants: Record<
  SubmissionStatus,
  "success" | "error" | "warning" | "info"
> = {
  accepted: "success",
  wrong_answer: "error",
  compilation_error: "error",
  runtime_error: "error",
  time_limit_exceeded: "warning",
  execution_error: "info",
};

type OutputPanelState =
  | { kind: "run"; result: Extract<RunProblemActionResult, { success: true }> }
  | {
      kind: "submit";
      result: Extract<SubmitProblemActionResult, { success: true }>;
    }
  | { kind: "error"; message: string };

function getDraftKey(slug: string, language: ProblemLanguage): string {
  return `senitor:problem-draft:${slug}:${language}`;
}

function loadDraft(
  slug: string,
  language: ProblemLanguage,
  starterCode: string
): { code: string; error: boolean } {
  try {
    return {
      code: window.localStorage.getItem(getDraftKey(slug, language)) ?? starterCode,
      error: false,
    };
  } catch {
    return { code: starterCode, error: true };
  }
}

function subscribeToDraft(
  slug: string,
  language: ProblemLanguage,
  listener: () => void
): () => void {
  const key = getDraftKey(slug, language);
  const subscribers = draftSubscribers.get(key) ?? new Set<() => void>();
  subscribers.add(listener);
  draftSubscribers.set(key, subscribers);

  const handleStorage = (event: StorageEvent) => {
    if (event.key === key || event.key === null) listener();
  };
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener("storage", handleStorage);
    subscribers.delete(listener);
    if (subscribers.size === 0) draftSubscribers.delete(key);
  };
}

function getDraftSnapshot(
  slug: string,
  language: ProblemLanguage,
  starterCode: string
): string {
  try {
    return window.localStorage.getItem(getDraftKey(slug, language)) ?? starterCode;
  } catch {
    return starterCode;
  }
}

function saveDraft(
  slug: string,
  language: ProblemLanguage,
  sourceCode: string
): boolean {
  try {
    window.localStorage.setItem(getDraftKey(slug, language), sourceCode);
    draftSubscribers.get(getDraftKey(slug, language))?.forEach((listener) =>
      listener()
    );
    return true;
  } catch {
    return false;
  }
}

function formatLanguage(language: ProblemLanguage): string {
  return language === "cpp" ? "C++" : "Python";
}

function StatusBadge({ status }: { status: SubmissionStatus }) {
  return <Badge variant={statusVariants[status]}>{statusLabels[status]}</Badge>;
}

export function ProblemWorkspace({
  slug,
  starterCode,
  history,
  historyError,
}: {
  slug: string;
  starterCode: Record<ProblemLanguage, string>;
  history: ProblemSubmissionHistoryItem[];
  historyError?: string;
}) {
  const router = useRouter();
  const [language, setLanguage] = useState<ProblemLanguage>("cpp");
  const sourceCode = useSyncExternalStore(
    (listener) => subscribeToDraft(slug, language, listener),
    () => getDraftSnapshot(slug, language, starterCode[language]),
    () => starterCode[language]
  );
  const [draftError, setDraftError] = useState<string | null>(null);
  const [output, setOutput] = useState<OutputPanelState | null>(null);
  const [mobilePanel, setMobilePanel] = useState<"editor" | "output">("editor");
  const [isPending, startTransition] = useTransition();
  const [editorVersion, setEditorVersion] = useState(0);

  const changeLanguage = (nextLanguage: ProblemLanguage) => {
    if (nextLanguage === language) return;
    setLanguage(nextLanguage);
    const draft = loadDraft(slug, nextLanguage, starterCode[nextLanguage]);
    saveDraft(slug, nextLanguage, draft.code);
    setDraftError(
      draft.error ? "Draft storage is unavailable in this browser." : null
    );
  };

  const handleCodeChange = (nextCode: string | undefined) => {
    const updatedCode = nextCode ?? "";
    setDraftError(
      saveDraft(slug, language, updatedCode)
        ? null
        : "Draft storage is unavailable in this browser."
    );
  };

  const handleReset = () => {
    const resetCode = starterCode[language];
    setDraftError(
      saveDraft(slug, language, resetCode)
        ? null
        : "Draft storage is unavailable in this browser."
    );
    setEditorVersion((version) => version + 1);
  };

  const handleClear = () => {
    setDraftError(
      saveDraft(slug, language, "")
        ? null
        : "Draft storage is unavailable in this browser."
    );
    setEditorVersion((version) => version + 1);
  };

  const handleRun = () => {
    startTransition(async () => {
      const result = await runProblemSamplesAction(slug, language, sourceCode);
      setOutput(
        result.success ? { kind: "run", result } : { kind: "error", message: result.message }
      );
      setMobilePanel("output");
    });
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await submitProblemAction(slug, language, sourceCode);
      if (result.success) {
        setOutput({ kind: "submit", result });
        router.refresh();
      } else {
        setOutput({ kind: "error", message: result.message });
      }
      setMobilePanel("output");
    });
  };

  const defineTheme: BeforeMount = (monaco) => {
    monaco.editor.defineTheme("senitor-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#09090B",
        "editorLineNumber.foreground": "#71717A",
        "editorLineNumber.activeForeground": "#C4B5FD",
        "editorCursor.foreground": "#A78BFA",
        "editor.selectionBackground": "#5B21B680",
        "editorLineHighlightBackground": "#18181B",
      },
    });
  };

  return (
    <div id="coding-workspace" className="space-y-5">
      <div
        role="tablist"
        aria-label="Coding workspace panels"
        className="grid grid-cols-2 rounded-lg border border-border bg-bg-secondary p-1 md:hidden"
      >
        {(["editor", "output"] as const).map((panel) => (
          <button
            key={panel}
            id={`workspace-tab-${panel}`}
            type="button"
            role="tab"
            aria-selected={mobilePanel === panel}
            aria-controls={`workspace-panel-${panel}`}
            onClick={() => setMobilePanel(panel)}
            className={[
              "h-11 rounded-md text-sm font-medium capitalize transition-colors",
              mobilePanel === panel
                ? "bg-bg-card text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-primary",
            ].join(" ")}
          >
            {panel}
          </button>
        ))}
      </div>

      <div
        id="workspace-panel-editor"
        role="tabpanel"
        aria-labelledby="workspace-tab-editor"
        className={mobilePanel === "editor" ? "block" : "hidden md:block"}
      >
        <Card className="min-w-0 overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              Language
              <select
                value={language}
                onChange={(event) =>
                  changeLanguage(event.target.value as ProblemLanguage)
                }
                disabled={isPending}
                className="h-11 rounded-lg border border-border bg-bg-base px-3 text-sm text-text-primary outline-none focus:border-accent-primary"
              >
                {languages.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReset}
                disabled={isPending}
                className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 text-xs text-text-secondary hover:text-text-primary disabled:opacity-50 sm:flex-none"
              >
                <RotateCcw size={14} aria-hidden />
                Reset
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={isPending}
                className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 text-xs text-text-secondary hover:text-text-primary disabled:opacity-50 sm:flex-none"
              >
                <Trash2 size={14} aria-hidden />
                Clear
              </button>
            </div>
          </div>

          <MonacoEditor
            key={`${slug}:${language}:${editorVersion}`}
            height="clamp(320px, 55dvh, 420px)"
            language={language === "cpp" ? "cpp" : "python"}
            theme="senitor-dark"
            value={sourceCode}
            beforeMount={defineTheme}
            onChange={handleCodeChange}
            options={{
              automaticLayout: true,
              minimap: { enabled: false },
              lineNumbers: "on",
              tabSize: 4,
              insertSpaces: true,
              scrollBeyondLastLine: false,
              fontSize: 14,
              wordWrap: "on",
              padding: { top: 14 },
              readOnly: isPending,
            }}
          />
          <div className="flex flex-col gap-3 border-t border-border p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-text-muted">
              Drafts are saved separately in this browser for each language.
            </p>
            <div className="flex w-full gap-2 sm:w-auto">
              <button
                type="button"
                onClick={handleRun}
                disabled={isPending}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-text-primary hover:border-border-accent disabled:opacity-50 sm:flex-none sm:px-4"
              >
                {isPending ? (
                  <LoaderCircle size={16} className="animate-spin" aria-hidden />
                ) : null}
                Run samples
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-accent-primary px-3 text-sm font-semibold text-white hover:bg-accent-primary/90 disabled:opacity-50 sm:flex-none sm:px-4"
              >
                Submit
              </button>
            </div>
          </div>
          {draftError && (
            <p
              role="status"
              className="break-words px-4 pb-3 text-xs text-warning"
            >
              {draftError}
            </p>
          )}
        </Card>
      </div>

      <div
        id="workspace-panel-output"
        role="tabpanel"
        aria-labelledby="workspace-tab-output"
        className={
          mobilePanel === "output"
            ? "space-y-5"
            : "hidden md:block md:space-y-5"
        }
      >
        <OutputPanel output={output} />
        <SubmissionHistory history={history} error={historyError} />
      </div>
    </div>
  );
}

function OutputPanel({ output }: { output: OutputPanelState | null }) {
  return (
    <Card className="p-4">
      <h2 className="font-semibold text-text-primary">
        {output?.kind === "submit" ? "Submission result" : "Run output"}
      </h2>
      {!output && (
        <p className="mt-2 text-sm text-text-muted">
          Run the sample tests or submit your solution to see results here.
        </p>
      )}
      {output?.kind === "error" && (
        <p role="alert" className="mt-3 flex items-start gap-2 text-sm text-error">
          <CircleAlert size={16} className="mt-0.5 shrink-0" aria-hidden />
          {output.message}
        </p>
      )}
      {output?.kind === "submit" && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={output.result.submission.status} />
            <span className="text-sm text-text-secondary">
              {output.result.submission.passed_test_cases}/
              {output.result.submission.total_test_cases} tests passed
            </span>
          </div>
          <ExecutionMetrics submission={output.result.submission} />
          <p className="text-xs text-text-muted">
            Private test inputs and expected outputs are not returned.
          </p>
        </div>
      )}
      {output?.kind === "run" && (
        <div className="mt-3 space-y-4">
          <p className="text-sm text-text-secondary">
            {output.result.passed}/{output.result.total} sample tests passed
          </p>
          {output.result.results.map((result) => (
            <div
              key={result.index}
              className="space-y-3 border-t border-border pt-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-text-primary">
                  Sample {result.index}
                </span>
                <StatusBadge status={result.status} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <OutputText label="Your output" value={result.stdout || "(no output)"} />
                <OutputText label="Expected output" value={result.expected_output} />
              </div>
              {result.stderr && (
                <OutputText label="Compiler / runtime output" value={result.stderr} error />
              )}
              <p className="text-xs text-text-muted">
                {result.execution_time === null
                  ? "Execution time unavailable"
                  : `${result.execution_time.toFixed(0)} ms`}
                {result.memory_used === null
                  ? ""
                  : ` · ${result.memory_used} KB`}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function OutputText({
  label,
  value,
  error = false,
}: {
  label: string;
  value: string;
  error?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs text-text-muted">{label}</p>
      <pre
        className={`max-h-48 overflow-auto rounded-lg bg-bg-base p-3 text-xs leading-5 ${
          error ? "text-error" : "text-text-secondary"
        }`}
      >
        <code>{value}</code>
      </pre>
    </div>
  );
}

function ExecutionMetrics({
  submission,
}: {
  submission: ProblemSubmissionHistoryItem;
}) {
  return (
    <p className="text-xs text-text-muted">
      {submission.execution_time === null
        ? "Execution time unavailable"
        : `${submission.execution_time.toFixed(0)} ms`}
      {submission.memory_used === null
        ? ""
        : ` · ${submission.memory_used} KB`}
    </p>
  );
}

function SubmissionHistory({
  history,
  error,
}: {
  history: ProblemSubmissionHistoryItem[];
  error?: string;
}) {
  return (
    <Card className="p-4">
      <h2 className="font-semibold text-text-primary">Your submissions</h2>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-error">
          {error}
        </p>
      ) : history.length === 0 ? (
        <p className="mt-2 text-sm text-text-muted">
          Your submissions for this problem will appear here.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {history.map((submission) => (
            <li
              key={submission.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={submission.status} />
                  <span className="text-xs text-text-secondary">
                    {formatLanguage(submission.language)}
                  </span>
                </div>
                <time
                  dateTime={submission.created_at}
                  className="block text-xs text-text-muted"
                >
                  {new Date(submission.created_at).toLocaleString()}
                </time>
              </div>
              <div className="text-right text-xs text-text-muted">
                <p>
                  {submission.passed_test_cases}/
                  {submission.total_test_cases} tests
                </p>
                {submission.execution_time !== null && (
                  <p>{submission.execution_time.toFixed(0)} ms</p>
                )}
              </div>
              {submission.status === "accepted" && (
                <Check
                  size={16}
                  className="text-success"
                  aria-label="Accepted"
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
