import "server-only";

import {
  getAuthenticatedClient,
} from "@/lib/supabase/authenticated-client";
import { logSupabaseQueryError } from "@/lib/supabase/diagnostics";
import {
  predictProblemSuccess,
  predictionModelName,
  type PredictionFeatures,
} from "@/lib/learning/success-prediction";
import type { SubmissionStatus } from "@/types/problems";

const completionTarget = 0.7;
const prerequisiteThreshold = 0.55;
const pageSize = 1000;
const judgedStatuses = new Set<SubmissionStatus>([
  "accepted",
  "wrong_answer",
  "compilation_error",
  "runtime_error",
  "time_limit_exceeded",
  "execution_error",
]);

type TopicRow = { id: string; name: string; slug: string; sort_order: number };
type ProblemRow = {
  id: string;
  title: string;
  slug: string;
  difficulty: "easy" | "medium" | "hard";
  topic_id: string;
  subtopic_id: string;
};
type SubmissionRow = {
  problem_id: string;
  status: string;
  created_at: string;
};
type LessonProgressRow = {
  status: "not_started" | "in_progress" | "completed";
  updated_at: string;
};

export type InsightTopic = {
  slug: string;
  name: string;
  mastery: number | null;
  attempts: number;
  successful: number;
  accuracy: number;
};

type MeasuredInsightTopic = InsightTopic & { mastery: number };

export type InsightPerformance = {
  label: string;
  attempts: number;
  successful: number;
  accuracy: number;
};

export type LearningInsights = {
  prediction: {
    probability: number | null;
    model: string;
    sufficientActivity: boolean;
    explanation: string;
    problemTitle: string | null;
  };
  analytics: {
    attemptedProblems: number;
    totalSubmissions: number;
    judgedSubmissions: number;
    successfulSubmissions: number;
    accuracy: number;
    topicPerformance: InsightTopic[];
    difficultyPerformance: InsightPerformance[];
    recentTrend: InsightPerformance[];
    lessonActivity: {
      startedLessons: number;
      completedLessons: number;
    };
  };
  topicMastery: InsightTopic[];
  weakTopics: InsightTopic[];
  recommendedNextTopic: (InsightTopic & { slug: string }) | null;
  recommendedProblems: Array<{
    id: string;
    slug: string;
    title: string;
    difficulty: ProblemRow["difficulty"];
    topic: string;
    reason: string;
  }>;
  explanation: string;
  submissionCount: number;
  features: PredictionFeatures | null;
};

export class LearningInsightsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LearningInsightsError";
  }
}

function clampRate(successes: number, attempts: number): number {
  return attempts === 0 ? 0 : successes / attempts;
}

function smoothedRate(successes: number, attempts: number): number {
  return (successes + 1) / (attempts + 2);
}

function difficultyValue(difficulty: ProblemRow["difficulty"]): number {
  if (difficulty === "easy") return 1;
  if (difficulty === "hard") return 5;
  return 3;
}

function logAndThrow(operation: string, error: { message: string; code?: string }): never {
  logSupabaseQueryError("learning-insights", operation, error);
  throw new LearningInsightsError(
    "Learning insights could not be loaded. Please try again."
  );
}

async function loadSubmissions(
  supabase: Awaited<ReturnType<typeof getAuthenticatedClient>>["supabase"]
): Promise<SubmissionRow[]> {
  const rows: SubmissionRow[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const result = await supabase
      .from("code_submissions")
      .select("problem_id, status, created_at")
      .order("created_at", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (result.error) logAndThrow("loading student submissions", result.error);
    rows.push(...((result.data ?? []) as SubmissionRow[]));
    if (!result.data || result.data.length < pageSize) return rows;
  }
}

function trendLabel(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getLearningInsights(
  targetProblemId?: string
): Promise<LearningInsights> {
  const authenticated = await getAuthenticatedClient();
  const { supabase } = authenticated;
  const [
    problemsResult,
    topicsResult,
    subtopicsResult,
    prerequisitesResult,
    lessonProgressResult,
    submissions,
  ] = await Promise.all([
    supabase
      .from("problems")
      .select("id, title, slug, difficulty, topic_id, subtopic_id")
      .eq("is_published", true)
      .limit(1000),
    supabase
      .from("topics")
      .select("id, name, slug, sort_order")
      .eq("is_published", true)
      .order("sort_order"),
    supabase.from("subtopics").select("id, topic_id").eq("is_published", true),
    supabase
      .from("subtopic_prerequisites")
      .select("subtopic_id, prerequisite_subtopic_id"),
    supabase
      .from("lesson_progress")
      .select("status, updated_at")
      .order("updated_at", { ascending: true }),
    loadSubmissions(supabase),
  ]);

  if (problemsResult.error) logAndThrow("loading published problems", problemsResult.error);
  if (topicsResult.error) logAndThrow("loading published topics", topicsResult.error);
  if (subtopicsResult.error) logAndThrow("loading published subtopics", subtopicsResult.error);
  if (prerequisitesResult.error) {
    logAndThrow("loading topic prerequisites", prerequisitesResult.error);
  }
  if (lessonProgressResult.error) {
    logAndThrow("loading lesson activity", lessonProgressResult.error);
  }

  const problems = (problemsResult.data ?? []) as ProblemRow[];
  const topics = (topicsResult.data ?? []) as TopicRow[];
  const topicById = new Map(topics.map((topic) => [topic.id, topic]));
  const problemById = new Map(problems.map((problem) => [problem.id, problem]));
  const subtopicById = new Map(
    (subtopicsResult.data ?? []).map((subtopic) => [subtopic.id, subtopic.topic_id])
  );
  const prerequisitesByTopic = new Map<string, Set<string>>();

  for (const prerequisite of prerequisitesResult.data ?? []) {
    const topicId = subtopicById.get(prerequisite.subtopic_id);
    const prerequisiteTopicId = subtopicById.get(prerequisite.prerequisite_subtopic_id);
    if (!topicId || !prerequisiteTopicId || topicId === prerequisiteTopicId) continue;
    const values = prerequisitesByTopic.get(topicId) ?? new Set<string>();
    values.add(prerequisiteTopicId);
    prerequisitesByTopic.set(topicId, values);
  }

  const judged = submissions.filter((submission) =>
    judgedStatuses.has(submission.status as SubmissionStatus)
  );
  const outcomesByTopic = new Map<string, boolean[]>();
  const outcomesByDifficulty = new Map<string, boolean[]>();
  const solvedByTopic = new Map<string, Set<string>>();

  for (const submission of judged) {
    const problem = problemById.get(submission.problem_id);
    if (!problem) continue;
    const accepted = submission.status === "accepted";
    const topic = topicById.get(problem.topic_id);
    if (topic) {
      const outcomes = outcomesByTopic.get(topic.id) ?? [];
      outcomes.push(accepted);
      outcomesByTopic.set(topic.id, outcomes);
      if (accepted) {
        const solved = solvedByTopic.get(topic.id) ?? new Set<string>();
        solved.add(problem.id);
        solvedByTopic.set(topic.id, solved);
      }
    }
    const difficultyOutcomes = outcomesByDifficulty.get(problem.difficulty) ?? [];
    difficultyOutcomes.push(accepted);
    outcomesByDifficulty.set(problem.difficulty, difficultyOutcomes);
  }

  const topicPerformance: InsightTopic[] = topics.map((topic) => {
    const outcomes = outcomesByTopic.get(topic.id) ?? [];
    const successful = outcomes.filter(Boolean).length;
    return {
      slug: topic.slug,
      name: topic.name,
      mastery:
        outcomes.length === 0
          ? null
          : smoothedRate(successful, outcomes.length),
      attempts: outcomes.length,
      successful,
      accuracy: clampRate(successful, outcomes.length),
    };
  });
  const weakTopics = topicPerformance
    .filter(
      (topic): topic is MeasuredInsightTopic =>
        topic.attempts > 0 &&
        topic.mastery !== null &&
        topic.mastery < completionTarget
    )
    .sort(
      (left, right) =>
        left.mastery - right.mastery ||
        topics.find((topic) => topic.slug === left.slug)!.sort_order -
          topics.find((topic) => topic.slug === right.slug)!.sort_order
    );
  const masteryByTopicId = new Map(
    topicPerformance.map((topic) => [
      topics.find((candidate) => candidate.slug === topic.slug)!.id,
      topic.mastery,
    ])
  );
  const eligibleTopics = weakTopics.filter((topic) => {
    const row = topics.find((candidate) => candidate.slug === topic.slug)!;
    return [...(prerequisitesByTopic.get(row.id) ?? [])].every((id) => {
      const mastery = masteryByTopicId.get(id);
      return (
        mastery !== null &&
        mastery !== undefined &&
        mastery >= prerequisiteThreshold
      );
    });
  });
  const nextTopic = eligibleTopics[0] ?? null;
  const nextTopicRow = nextTopic
    ? topics.find((topic) => topic.slug === nextTopic.slug)
    : undefined;
  const solvedProblemIds = new Set(
    [...solvedByTopic.values()].flatMap((ids) => [...ids])
  );
  const prerequisiteNames = nextTopicRow
    ? [...(prerequisitesByTopic.get(nextTopicRow.id) ?? [])]
        .map((id) => topicById.get(id)?.name)
        .filter((name): name is string => Boolean(name))
    : [];
  const recommendedDifficulty =
    !nextTopic || nextTopic.mastery < 0.4
      ? "easy"
      : nextTopic.mastery < 0.7
        ? "medium"
        : "hard";
  const recommendedProblems = nextTopicRow
    ? problems
        .filter(
          (problem) =>
            problem.topic_id === nextTopicRow.id && !solvedProblemIds.has(problem.id)
        )
        .sort(
          (left, right) =>
            Number(left.difficulty !== recommendedDifficulty) -
              Number(right.difficulty !== recommendedDifficulty) ||
            left.title.localeCompare(right.title)
        )
        .slice(0, 3)
        .map((problem) => ({
          id: problem.id,
          slug: problem.slug,
          title: problem.title,
          difficulty: problem.difficulty,
          topic: nextTopicRow.name,
          reason: [
            prerequisiteNames.length
              ? `Prerequisites meet the mastery threshold: ${prerequisiteNames.join(", ")}.`
              : "",
            `${nextTopicRow.name} mastery is ${Math.round(nextTopic.mastery * 100)}%, below the ${completionTarget * 100}% target.`,
            `This ${problem.difficulty} problem is suited to the current level.`,
          ]
            .filter(Boolean)
            .join(" "),
        }))
    : [];

  const difficultyPerformance = (["easy", "medium", "hard"] as const).map((difficulty) => {
    const outcomes = outcomesByDifficulty.get(difficulty) ?? [];
    const successful = outcomes.filter(Boolean).length;
    return {
      label: difficulty[0].toUpperCase() + difficulty.slice(1),
      attempts: outcomes.length,
      successful,
      accuracy: clampRate(successful, outcomes.length),
    };
  });
  const recentTrend = [...new Set(
    judged.slice(-8).map((submission) => trendLabel(new Date(submission.created_at)))
  )].map((label) => {
    const outcomes = judged.filter(
      (submission) => trendLabel(new Date(submission.created_at)) === label
    );
    const successful = outcomes.filter((submission) => submission.status === "accepted").length;
    return { label, attempts: outcomes.length, successful, accuracy: clampRate(successful, outcomes.length) };
  });
  const startedLessons = ((lessonProgressResult.data ?? []) as LessonProgressRow[]).filter(
    (row) => row.status !== "not_started"
  ).length;
  const completedLessons = ((lessonProgressResult.data ?? []) as LessonProgressRow[]).filter(
    (row) => row.status === "completed"
  ).length;
  const activityDates = new Set([
    ...submissions.map((submission) => submission.created_at.slice(0, 10)),
    ...((lessonProgressResult.data ?? []) as LessonProgressRow[]).map((row) =>
      row.updated_at.slice(0, 10)
    ),
  ]);

  let features: PredictionFeatures | null = null;
  let predictionProblem: ProblemRow | undefined;
  if (targetProblemId) predictionProblem = problemById.get(targetProblemId);
  if (!predictionProblem && recommendedProblems[0]) {
    predictionProblem = problemById.get(recommendedProblems[0].id);
  }
  if (predictionProblem && judged.length >= 3) {
    const targetOutcomes = judged.filter(
      (submission) => submission.problem_id === predictionProblem!.id
    );
    const targetTopicProblems = problems.filter(
      (problem) => problem.topic_id === predictionProblem!.topic_id
    );
    const relatedTopicIds = [
      ...(prerequisitesByTopic.get(predictionProblem.topic_id) ?? []),
    ];
    const relatedValues = relatedTopicIds
      .map((id) => masteryByTopicId.get(id))
      .filter((value): value is number => value !== null && value !== undefined);
    features = {
      previous_accuracy: smoothedRate(
        judged.filter((submission) => submission.status === "accepted").length,
        judged.length
      ),
      attempts_per_problem: Math.min(targetOutcomes.length, 6),
      topic_familiarity: Math.min(
        1,
        ((solvedByTopic.get(predictionProblem.topic_id)?.size ?? 0) + 1) /
          (targetTopicProblems.length + 2)
      ),
      problem_difficulty: difficultyValue(predictionProblem.difficulty),
      recent_success_rate: smoothedRate(
        judged.slice(-10).filter((submission) => submission.status === "accepted").length,
        Math.min(judged.length, 10)
      ),
      related_topic_performance: relatedValues.length
        ? relatedValues.reduce((sum, value) => sum + value, 0) / relatedValues.length
        : 0.5,
      learning_activity_hours: Math.min(20, activityDates.size * 1.5),
    };
  }

  return {
    prediction: {
      probability: features ? predictProblemSuccess(features) : null,
      model: predictionModelName,
      sufficientActivity: judged.length >= 3,
      explanation: features
        ? `Estimated success on ${predictionProblem?.title ?? "the recommended problem"} using your recent judged submissions and learning activity.`
        : "Complete at least 3 judged submissions to unlock a personalized estimate.",
      problemTitle: predictionProblem?.title ?? null,
    },
    analytics: {
      attemptedProblems: new Set(judged.map((submission) => submission.problem_id)).size,
      totalSubmissions: submissions.length,
      judgedSubmissions: judged.length,
      successfulSubmissions: judged.filter((submission) => submission.status === "accepted").length,
      accuracy: clampRate(
        judged.filter((submission) => submission.status === "accepted").length,
        judged.length
      ),
      topicPerformance,
      difficultyPerformance,
      recentTrend,
      lessonActivity: { startedLessons, completedLessons },
    },
    topicMastery: topicPerformance,
    weakTopics,
    recommendedNextTopic: nextTopic,
    recommendedProblems,
    explanation: nextTopic
      ? `${nextTopic.name} is the weakest topic currently eligible under the curriculum prerequisites.`
      : weakTopics.length > 0
        ? "No weak topic is currently eligible. Complete the required prerequisite topics before continuing."
        : judged.length === 0
          ? "Submit a judged solution to start building topic mastery and recommendations."
        : "All available topics meet the current mastery target.",
    submissionCount: submissions.length,
    features,
  };
}
