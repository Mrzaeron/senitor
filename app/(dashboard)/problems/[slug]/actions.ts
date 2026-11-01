"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  runProblemSamples,
  submitProblem,
} from "@/lib/problems/submissions";
import type {
  ProblemLanguage,
  SampleExecutionResult,
  ProblemSubmissionHistoryItem,
} from "@/types/problems";

const requestSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  language: z.enum(["cpp", "python"]),
  sourceCode: z.string().min(1).max(50_000),
});

export type RunProblemActionResult =
  | {
      success: true;
      passed: number;
      total: number;
      results: SampleExecutionResult[];
    }
  | { success: false; message: string };

export type SubmitProblemActionResult =
  | { success: true; submission: ProblemSubmissionHistoryItem }
  | { success: false; message: string };

export async function runProblemSamplesAction(
  slug: string,
  language: ProblemLanguage,
  sourceCode: string
): Promise<RunProblemActionResult> {
  const parsed = requestSchema.safeParse({ slug, language, sourceCode });
  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid code submission. Check the language and code size.",
    };
  }

  return runProblemSamples(
    parsed.data.slug,
    parsed.data.language,
    parsed.data.sourceCode
  );
}

export async function submitProblemAction(
  slug: string,
  language: ProblemLanguage,
  sourceCode: string
): Promise<SubmitProblemActionResult> {
  const parsed = requestSchema.safeParse({ slug, language, sourceCode });
  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid code submission. Check the language and code size.",
    };
  }

  const result = await submitProblem(
    parsed.data.slug,
    parsed.data.language,
    parsed.data.sourceCode
  );
  if (result.success) {
    revalidatePath(`/problems/${parsed.data.slug}`);
  }
  return result;
}
