import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  getAuthenticatedClient as getRequestAuthenticatedClient,
  SupabaseAuthenticationError,
} from "@/lib/supabase/authenticated-client";
import { executeWithJudge0, Judge0UnavailableError, outputsMatch } from "@/lib/problems/judge0";
import type {
  ProblemExample,
  ProblemLanguage,
  ProblemSubmissionHistoryItem,
  SampleExecutionResult,
  SubmissionStatus,
} from "@/types/problems";

const maximumSourceLength = 50_000;

export class ProblemSubmissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProblemSubmissionError";
  }
}

export type RunSamplesResult =
  | {
      success: true;
      passed: number;
      total: number;
      results: SampleExecutionResult[];
    }
  | { success: false; message: string };

export type SubmitProblemResult =
  | {
      success: true;
      submission: ProblemSubmissionHistoryItem;
    }
  | { success: false; message: string };

type AuthenticatedClient = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
};

async function getAuthenticatedClient(): Promise<AuthenticatedClient> {
  try {
    const { supabase, userId } = await getRequestAuthenticatedClient();
    return { supabase, userId };
  } catch (error) {
    if (error instanceof SupabaseAuthenticationError) {
      throw new ProblemSubmissionError(error.message);
    }
    throw error;
  }
}

function isValidCodeSubmission(
  slug: string,
  language: ProblemLanguage,
  sourceCode: string
): boolean {
  return (
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) &&
    (language === "cpp" || language === "python") &&
    sourceCode.trim().length > 0 &&
    Buffer.byteLength(sourceCode, "utf8") <= maximumSourceLength
  );
}

async function getPublishedProblem(
  supabase: AuthenticatedClient["supabase"],
  slug: string
): Promise<{
  id: string;
  examples: ProblemExample[];
  supportedLanguages: string[];
} | null> {
  const { data, error } = await supabase
    .from("problems")
    .select("id, examples, supported_languages")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error("[problem-submissions] problem lookup failed");
    throw new ProblemSubmissionError(
      "Problem data could not be loaded. Please try again."
    );
  }
  if (!data) return null;

  return {
    id: data.id as string,
    examples: data.examples as ProblemExample[],
    supportedLanguages: data.supported_languages as string[],
  };
}

function formatExecutionError(error: unknown): string {
  if (error instanceof Judge0UnavailableError) return error.message;
  return "Code execution failed. Please try again later.";
}

function executionStatus(
  status: SubmissionStatus,
  stdout: string,
  expectedOutput: string
): SubmissionStatus {
  return status === "accepted" && !outputsMatch(stdout, expectedOutput)
    ? "wrong_answer"
    : status;
}

export async function runProblemSamples(
  slug: string,
  language: ProblemLanguage,
  sourceCode: string
): Promise<RunSamplesResult> {
  if (!isValidCodeSubmission(slug, language, sourceCode)) {
    return {
      success: false,
      message: "Choose a supported language and provide code under 50 KB.",
    };
  }

  try {
    const { supabase } = await getAuthenticatedClient();
    const problem = await getPublishedProblem(supabase, slug);
    if (!problem) {
      return { success: false, message: "This published problem was not found." };
    }
    if (!problem.supportedLanguages.includes(language)) {
      return {
        success: false,
        message: "This language is not enabled for the selected problem.",
      };
    }
    if (problem.examples.length === 0) {
      return { success: false, message: "This problem has no sample cases." };
    }

    const results: SampleExecutionResult[] = [];
    for (const [index, example] of problem.examples.entries()) {
      const execution = await executeWithJudge0(
        sourceCode,
        language,
        example.input
      );
      const status = executionStatus(
        execution.status,
        execution.stdout,
        example.output
      );
      results.push({
        index: index + 1,
        status,
        passed: status === "accepted",
        expected_output: example.output,
        stdout: execution.stdout,
        stderr: execution.stderr,
        execution_time: execution.executionTime,
        memory_used: execution.memoryUsed,
      });
      if (status === "compilation_error" || status === "execution_error") break;
    }

    return {
      success: true,
      passed: results.filter((result) => result.passed).length,
      total: results.length,
      results,
    };
  } catch (error) {
    if (error instanceof ProblemSubmissionError || error instanceof Judge0UnavailableError) {
      return { success: false, message: error.message };
    }
    console.error("[problem-submissions] sample execution failed");
    return {
      success: false,
      message: formatExecutionError(error),
    };
  }
}

export async function submitProblem(
  slug: string,
  language: ProblemLanguage,
  sourceCode: string
): Promise<SubmitProblemResult> {
  if (!isValidCodeSubmission(slug, language, sourceCode)) {
    return {
      success: false,
      message: "Choose a supported language and provide code under 50 KB.",
    };
  }

  let supabase: AuthenticatedClient["supabase"];
  let userId: string;
  let problem: {
    id: string;
    examples: ProblemExample[];
    supportedLanguages: string[];
  } | null;
  try {
    const authenticated = await getAuthenticatedClient();
    supabase = authenticated.supabase;
    userId = authenticated.userId;
    problem = await getPublishedProblem(supabase, slug);
  } catch (error) {
    if (error instanceof ProblemSubmissionError) {
      return { success: false, message: error.message };
    }
    console.error("[problem-submissions] submission setup failed");
    return {
      success: false,
      message: "Submission could not be started. Please try again.",
    };
  }

  if (!problem) {
    return { success: false, message: "This published problem was not found." };
  }
  if (!problem.supportedLanguages.includes(language)) {
    return {
      success: false,
      message: "This language is not enabled for the selected problem.",
    };
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return {
      success: false,
      message: "Private test execution is not configured on the server.",
    };
  }

  const { data: privateCases, error: casesError } = await admin
    .from("problem_test_cases")
    .select("input, expected_output")
    .eq("problem_id", problem.id)
    .eq("is_sample", false)
    .order("sort_order");

  if (casesError) {
    console.error("[problem-submissions] private test lookup failed");
    return {
      success: false,
      message: "Private tests could not be loaded. Please try again later.",
    };
  }
  if (!privateCases?.length) {
    return {
      success: false,
      message: "Private tests are not available for this problem yet.",
    };
  }

  let status: SubmissionStatus = "accepted";
  let passedTestCases = 0;
  let executionTime = 0;
  let hasExecutionTime = true;
  let memoryUsed: number | null = null;

  try {
    for (const testCase of privateCases) {
      const execution = await executeWithJudge0(
        sourceCode,
        language,
        testCase.input as string
      );
      executionTime += execution.executionTime ?? 0;
      if (execution.executionTime === null) hasExecutionTime = false;
      if (execution.memoryUsed !== null) {
        memoryUsed =
          memoryUsed === null
            ? execution.memoryUsed
            : Math.max(memoryUsed, execution.memoryUsed);
      }

      status = executionStatus(
        execution.status,
        execution.stdout,
        testCase.expected_output as string
      );
      if (status !== "accepted") break;
      passedTestCases += 1;
    }
  } catch (error) {
    if (error instanceof Judge0UnavailableError) {
      return { success: false, message: error.message };
    }
    console.error("[problem-submissions] private test execution failed");
    return {
      success: false,
      message: "Private test execution failed. Please try again later.",
    };
  }

  const { data: inserted, error: insertError } = await admin
    .from("code_submissions")
    .insert({
      user_id: userId,
      problem_id: problem.id,
      language,
      source_code: sourceCode,
      status,
      execution_time: hasExecutionTime ? executionTime : null,
      memory_used: memoryUsed,
      passed_test_cases: passedTestCases,
      total_test_cases: privateCases.length,
    })
    .select(
      "id, language, status, execution_time, memory_used, passed_test_cases, total_test_cases, created_at"
    )
    .single();

  if (insertError || !inserted) {
    console.error("[problem-submissions] submission history insert failed");
    return {
      success: false,
      message: "The result could not be saved. Please try again.",
    };
  }

  return {
    success: true,
    submission: {
      id: inserted.id as string,
      language: inserted.language as ProblemLanguage,
      status: inserted.status as SubmissionStatus,
      execution_time:
        inserted.execution_time === null
          ? null
          : Number(inserted.execution_time),
      memory_used: inserted.memory_used as number | null,
      passed_test_cases: inserted.passed_test_cases as number,
      total_test_cases: inserted.total_test_cases as number,
      created_at: inserted.created_at as string,
    },
  };
}

export async function getProblemSubmissionHistory(
  problemId: string
): Promise<ProblemSubmissionHistoryItem[]> {
  const { supabase, userId } = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from("code_submissions")
    .select(
      "id, language, status, execution_time, memory_used, passed_test_cases, total_test_cases, created_at"
    )
    .eq("user_id", userId)
    .eq("problem_id", problemId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("[problem-submissions] history lookup failed");
    throw new ProblemSubmissionError(
      "Submission history could not be loaded."
    );
  }

  return (data ?? []).map((submission) => ({
    id: submission.id as string,
    language: submission.language as ProblemLanguage,
    status: submission.status as SubmissionStatus,
    execution_time:
      submission.execution_time === null
        ? null
        : Number(submission.execution_time),
    memory_used: submission.memory_used as number | null,
    passed_test_cases: submission.passed_test_cases as number,
    total_test_cases: submission.total_test_cases as number,
    created_at: submission.created_at as string,
  }));
}
