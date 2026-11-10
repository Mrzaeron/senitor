import "server-only";

import { getAuthenticatedClient } from "@/lib/supabase/authenticated-client";
import { logSupabaseQueryError } from "@/lib/supabase/diagnostics";
import type { SubmissionStatus } from "@/types/problems";

const pageSize = 1000;
const judgedStatuses = new Set<SubmissionStatus>([
  "accepted",
  "wrong_answer",
  "compilation_error",
  "runtime_error",
  "time_limit_exceeded",
  "execution_error",
]);

type SubmissionRecord = {
  id: string;
  problem_id: string;
  status: string;
  language: string;
  created_at: string;
};

type ProblemRecord = {
  id: string;
  title: string;
  slug: string;
  difficulty: "easy" | "medium" | "hard";
  topic_id: string;
};

type TopicRecord = {
  id: string;
  name: string;
  slug: string;
};

type SubmissionSummary = {
  total: number;
  judged: number;
  accepted: number;
  acceptedProblemIds: Set<string>;
};

export type CodingProgress = {
  totals: {
    solved: number;
    easy: number;
    medium: number;
    hard: number;
    submissions: number;
    accepted: number;
    judged: number;
    acceptanceRate: number;
  };
  activity: string[];
  topics: Array<{ name: string; slug: string; solved: number }>;
  recent: Array<{
    id: string;
    problemTitle: string;
    problemSlug: string | null;
    difficulty: "easy" | "medium" | "hard" | null;
    status: string;
    language: string;
    createdAt: string;
  }>;
};

export class CodingProgressError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CodingProgressError";
  }
}

function throwQueryError(
  operation: string,
  error: { code?: string; message: string }
): never {
  logSupabaseQueryError("dashboard", operation, error);
  throw new CodingProgressError(
    "Coding progress could not be loaded. Please try again."
  );
}

async function loadAllSubmissions(
  supabase: Awaited<ReturnType<typeof getAuthenticatedClient>>["supabase"]
): Promise<SubmissionSummary> {
  const summary: SubmissionSummary = {
    total: 0,
    judged: 0,
    accepted: 0,
    acceptedProblemIds: new Set(),
  };
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("code_submissions")
      .select("problem_id, status")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throwQueryError("loading submission totals", error);
    for (const submission of data ?? []) {
      summary.total += 1;
      if (!judgedStatuses.has(submission.status as SubmissionStatus)) continue;
      summary.judged += 1;
      if (submission.status === "accepted") {
        summary.accepted += 1;
        summary.acceptedProblemIds.add(submission.problem_id);
      }
    }
    if (!data || data.length < pageSize) return summary;
  }
}

async function loadActivity(
  supabase: Awaited<ReturnType<typeof getAuthenticatedClient>>["supabase"]
): Promise<string[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 370);
  const timestamps: string[] = [];

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("code_submissions")
      .select("created_at")
      .gte("created_at", cutoff.toISOString())
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throwQueryError("loading coding activity", error);
    timestamps.push(...(data ?? []).map((row) => row.created_at));
    if (!data || data.length < pageSize) return timestamps;
  }
}

export async function getCodingProgress(): Promise<CodingProgress> {
  const { supabase } = await getAuthenticatedClient();
  const [submissions, activity, recentResult] = await Promise.all([
    loadAllSubmissions(supabase),
    loadActivity(supabase),
    supabase
      .from("code_submissions")
      .select("id, problem_id, status, language, created_at")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(8),
  ]);
  if (recentResult.error) {
    throwQueryError("loading recent submissions", recentResult.error);
  }

  const acceptedProblemIds = submissions.acceptedProblemIds;
  const problemIds = [
    ...new Set([
      ...acceptedProblemIds,
      ...(recentResult.data ?? []).map((submission) => submission.problem_id),
    ]),
  ];

  let problems: ProblemRecord[] = [];
  if (problemIds.length > 0) {
    const { data, error } = await supabase
      .from("problems")
      .select("id, title, slug, difficulty, topic_id")
      .in("id", problemIds);
    if (error) throwQueryError("loading solved problem details", error);
    problems = (data ?? []) as ProblemRecord[];
  }

  const solvedByDifficulty = { easy: 0, medium: 0, hard: 0 };
  const topicCounts = new Map<string, { name: string; slug: string; solved: number }>();
  const problemById = new Map(problems.map((problem) => [problem.id, problem]));
  const solvedTopicIds = new Set<string>();

  if ([...acceptedProblemIds].some((problemId) => !problemById.has(problemId))) {
    throw new CodingProgressError(
      "Some solved problems are unavailable for statistics. Please retry after the problem bank is refreshed."
    );
  }

  for (const problemId of acceptedProblemIds) {
    const problem = problemById.get(problemId);
    if (!problem) continue;
    solvedByDifficulty[problem.difficulty] += 1;
    solvedTopicIds.add(problem.topic_id);
  }

  if (solvedTopicIds.size > 0) {
    const { data, error } = await supabase
      .from("topics")
      .select("id, name, slug")
      .in("id", [...solvedTopicIds])
      .eq("is_published", true);
    if (error) throwQueryError("loading solved problem topics", error);

    const topicById = new Map(
      ((data ?? []) as TopicRecord[]).map((topic) => [topic.id, topic])
    );
    for (const problemId of acceptedProblemIds) {
      const problem = problemById.get(problemId);
      if (!problem) continue;
      const topic = topicById.get(problem.topic_id);
      if (!topic) continue;
      const current = topicCounts.get(topic.id) ?? {
        name: topic.name,
        slug: topic.slug,
        solved: 0,
      };
      current.solved += 1;
      topicCounts.set(topic.id, current);
    }
  }

  const difficultyTotal = Object.values(solvedByDifficulty).reduce(
    (sum, count) => sum + count,
    0
  );
  if (difficultyTotal !== acceptedProblemIds.size) {
    throw new CodingProgressError(
      "Problem difficulty data is inconsistent. Please retry later."
    );
  }

  return {
    totals: {
      solved: acceptedProblemIds.size,
      ...solvedByDifficulty,
      submissions: submissions.total,
      accepted: submissions.accepted,
      judged: submissions.judged,
      acceptanceRate:
        submissions.judged === 0
          ? 0
          : (submissions.accepted / submissions.judged) * 100,
    },
    activity,
    topics: [...topicCounts.values()].sort(
      (left, right) => right.solved - left.solved || left.name.localeCompare(right.name)
    ),
    recent: ((recentResult.data ?? []) as SubmissionRecord[]).map((submission) => {
      const problem = problemById.get(submission.problem_id);
      return {
        id: submission.id,
        problemTitle: problem?.title ?? "Problem unavailable",
        problemSlug: problem?.slug ?? null,
        difficulty: problem?.difficulty ?? null,
        status: submission.status,
        language: submission.language,
        createdAt: submission.created_at,
      };
    }),
  };
}
