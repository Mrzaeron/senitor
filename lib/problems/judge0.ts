import "server-only";

import type { ProblemLanguage, SubmissionStatus } from "@/types/problems";

const judge0Host = "judge0-ce.p.rapidapi.com";

export const judge0LanguageIds: Record<ProblemLanguage, number> = {
  cpp: 54,
  python: 71,
};

const executionLimits = {
  cpu_time_limit: 3,
  cpu_extra_time: 1,
  wall_time_limit: 8,
  memory_limit: 262144,
  stack_limit: 65536,
  max_processes_and_or_threads: 30,
  max_file_size: 1024,
} as const;

interface Judge0Response {
  status?: { id?: number; description?: string };
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  time?: string | null;
  memory?: number | null;
}

export interface Judge0Result {
  status: SubmissionStatus;
  stdout: string;
  stderr: string;
  executionTime: number | null;
  memoryUsed: number | null;
}

export class Judge0UnavailableError extends Error {
  constructor(message = "The code execution service is unavailable.") {
    super(message);
    this.name = "Judge0UnavailableError";
  }
}

function getApiKey(): string {
  const apiKey = process.env.JUDGE0_API_KEY?.trim();
  const configuredHost = process.env.JUDGE0_API_HOST?.trim();
  if (!apiKey || configuredHost !== judge0Host) {
    throw new Judge0UnavailableError(
      "Code execution is not configured. Add the Judge0 server credentials."
    );
  }
  return apiKey;
}

function decodeOutput(value: string | null | undefined): string {
  if (!value) return "";
  return Buffer.from(value, "base64").toString("utf8").slice(0, 12_000);
}

function mapStatus(statusId?: number): SubmissionStatus {
  if (statusId === 3) return "accepted";
  if (statusId === 4) return "wrong_answer";
  if (statusId === 5) return "time_limit_exceeded";
  if (statusId === 6) return "compilation_error";
  if ([7, 8, 9, 10, 11, 12].includes(statusId ?? -1)) {
    return "runtime_error";
  }
  return "execution_error";
}

export async function executeWithJudge0(
  sourceCode: string,
  language: ProblemLanguage,
  stdin: string
): Promise<Judge0Result> {
  const apiKey = getApiKey();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(
      `https://${judge0Host}/submissions?base64_encoded=true&wait=true`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": judge0Host,
        },
        body: JSON.stringify({
          source_code: Buffer.from(sourceCode, "utf8").toString("base64"),
          language_id: judge0LanguageIds[language],
          stdin: Buffer.from(stdin, "utf8").toString("base64"),
          ...executionLimits,
        }),
        cache: "no-store",
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      throw new Judge0UnavailableError();
    }

    const result = (await response.json()) as Judge0Response;
    const stderr = decodeOutput(result.stderr);
    const compileOutput = decodeOutput(result.compile_output);
    return {
      status: mapStatus(result.status?.id),
      stdout: decodeOutput(result.stdout),
      stderr: stderr || compileOutput,
      executionTime:
        result.time && Number.isFinite(Number(result.time))
          ? Number(result.time) * 1000
          : null,
      memoryUsed:
        typeof result.memory === "number" && Number.isFinite(result.memory)
          ? result.memory
          : null,
    };
  } catch (error) {
    if (error instanceof Judge0UnavailableError) throw error;
    throw new Judge0UnavailableError();
  } finally {
    clearTimeout(timeout);
  }
}

export function outputsMatch(actual: string, expected: string): boolean {
  return actual.trim().replace(/\s+/g, " ") ===
    expected.trim().replace(/\s+/g, " ");
}
