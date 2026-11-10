import { NextResponse, type NextRequest } from "next/server";
import {
  getAuthenticatedClient,
  SupabaseAuthenticationError,
} from "@/lib/supabase/authenticated-client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { logSupabaseQueryError } from "@/lib/supabase/diagnostics";
import {
  predictProblemSuccess,
  predictionModelName,
} from "@/lib/learning/success-prediction";
import type { PredictionFeatures } from "@/lib/learning/success-prediction";

const completionTarget = 0.7;
const prerequisiteThreshold = 0.55;

type TopicRow = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

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

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

function difficultyValue(difficulty: ProblemRow["difficulty"]): number {
  if (difficulty === "easy") return 1;
  if (difficulty === "hard") return 5;
  return 3;
}

function clampRate(successes: number, attempts: number): number {
  return (successes + 1) / (attempts + 2);
}

export async function GET(request: NextRequest) {
  const problemId = request.nextUrl.searchParams.get("problemId");
  if (
    !problemId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      problemId
    )
  ) {
    return errorResponse("Choose a valid problem to get learning insights.", 400);
  }
  if (!isSupabaseConfigured()) {
    return errorResponse("Learning insights are not configured on this server.", 503);
  }

  let authenticated: Awaited<ReturnType<typeof getAuthenticatedClient>>;
  try {
    authenticated = await getAuthenticatedClient();
  } catch (error) {
    if (error instanceof SupabaseAuthenticationError) {
      return errorResponse("Sign in to view your learning insights.", 401);
    }
    throw error;
  }

  const { supabase, userId } = authenticated;
  const [
    targetResult,
    problemsResult,
    topicsResult,
    subtopicsResult,
    prerequisitesResult,
    submissionsResult,
  ] = await Promise.all([
    supabase
      .from("problems")
      .select("id, title, slug, difficulty, topic_id, subtopic_id")
      .eq("id", problemId)
      .eq("is_published", true)
      .maybeSingle(),
    supabase
      .from("problems")
      .select("id, title, slug, difficulty, topic_id, subtopic_id")
      .eq("is_published", true)
      .limit(200),
    supabase
      .from("topics")
      .select("id, name, slug, sort_order")
      .eq("is_published", true)
      .order("sort_order"),
    supabase
      .from("subtopics")
      .select("id, topic_id")
      .eq("is_published", true),
    supabase
      .from("subtopic_prerequisites")
      .select("subtopic_id, prerequisite_subtopic_id"),
    supabase
      .from("code_submissions")
      .select("problem_id, status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  if (targetResult.error) {
    logSupabaseQueryError("learning-insights", "loading the selected problem", targetResult.error);
    return errorResponse("The selected problem could not be loaded.", 500);
  }
  if (problemsResult.error) {
    logSupabaseQueryError("learning-insights", "loading published problems", problemsResult.error);
    return errorResponse("Recommended problems could not be loaded.", 500);
  }
  if (topicsResult.error) {
    logSupabaseQueryError("learning-insights", "loading published topics", topicsResult.error);
    return errorResponse("Topic mastery could not be loaded.", 500);
  }
  if (subtopicsResult.error) {
    logSupabaseQueryError("learning-insights", "loading published subtopics", subtopicsResult.error);
    return errorResponse("Topic prerequisites could not be loaded.", 500);
  }
  if (prerequisitesResult.error) {
    logSupabaseQueryError("learning-insights", "loading topic prerequisites", prerequisitesResult.error);
    return errorResponse("Topic prerequisites could not be loaded.", 500);
  }
  if (submissionsResult.error) {
    logSupabaseQueryError("learning-insights", "loading student submissions", submissionsResult.error);
    return errorResponse("Student learning data could not be loaded.", 500);
  }
  if (!targetResult.data) {
    return errorResponse("The selected published problem was not found.", 404);
  }

  const topics = (topicsResult.data ?? []) as TopicRow[];
  const problems = (problemsResult.data ?? []) as ProblemRow[];
  const target = targetResult.data as ProblemRow;
  const submissions = ((submissionsResult.data ?? []) as SubmissionRow[]).reverse();
  const topicById = new Map(topics.map((topic) => [topic.id, topic]));
  const problemById = new Map(problems.map((problem) => [problem.id, problem]));
  const subtopicById = new Map(
    (subtopicsResult.data ?? []).map((subtopic) => [subtopic.id, subtopic.topic_id])
  );
  const prerequisitesByTopic = new Map<string, Set<string>>();

  for (const prerequisite of prerequisitesResult.data ?? []) {
    const topicId = subtopicById.get(prerequisite.subtopic_id);
    const prerequisiteTopicId = subtopicById.get(
      prerequisite.prerequisite_subtopic_id
    );
    if (!topicId || !prerequisiteTopicId || topicId === prerequisiteTopicId) continue;
    const prerequisites = prerequisitesByTopic.get(topicId) ?? new Set<string>();
    prerequisites.add(prerequisiteTopicId);
    prerequisitesByTopic.set(topicId, prerequisites);
  }

  const topicOutcomes = new Map<string, boolean[]>();
  const solvedProblemsByTopic = new Map<string, Set<string>>();
  for (const submission of submissions) {
    const submittedProblem = problemById.get(submission.problem_id);
    const topic = submittedProblem && topicById.get(submittedProblem.topic_id);
    if (!topic) continue;
    const outcomes = topicOutcomes.get(topic.slug) ?? [];
    outcomes.push(submission.status === "accepted");
    topicOutcomes.set(topic.slug, outcomes);
    if (submission.status === "accepted") {
      const solvedProblems = solvedProblemsByTopic.get(topic.slug) ?? new Set<string>();
      solvedProblems.add(submission.problem_id);
      solvedProblemsByTopic.set(topic.slug, solvedProblems);
    }
  }

  const masteryByTopicId = new Map<string, number>();
  const topicMastery = topics.map((topic) => {
    const outcomes = topicOutcomes.get(topic.slug) ?? [];
    const recent = outcomes.slice(-10);
    const mastery = clampRate(
      recent.filter(Boolean).length,
      recent.length
    );
    masteryByTopicId.set(topic.id, mastery);
    return { slug: topic.slug, name: topic.name, mastery };
  });
  const weakTopics = topicMastery
    .filter((topic) => topic.mastery < completionTarget)
    .sort((left, right) => {
      const scoreDifference = left.mastery - right.mastery;
      if (scoreDifference !== 0) return scoreDifference;
      const leftOrder = topics.find((topic) => topic.slug === left.slug)?.sort_order ?? 0;
      const rightOrder = topics.find((topic) => topic.slug === right.slug)?.sort_order ?? 0;
      return leftOrder - rightOrder;
    });
  const eligibleTopics = weakTopics.filter((topic) => {
    const topicRow = topics.find((candidate) => candidate.slug === topic.slug);
    const requiredTopicIds = topicRow
      ? [...(prerequisitesByTopic.get(topicRow.id) ?? [])]
      : [];
    return requiredTopicIds.every(
      (requiredTopicId) =>
        (masteryByTopicId.get(requiredTopicId) ?? 0.5) >= prerequisiteThreshold
    );
  });
  const rootTopics = weakTopics.filter((topic) => {
    const topicRow = topics.find((candidate) => candidate.slug === topic.slug);
    return topicRow
      ? (prerequisitesByTopic.get(topicRow.id)?.size ?? 0) === 0
      : false;
  });
  const nextTopic = eligibleTopics[0] ?? rootTopics[0] ?? null;
  const nextTopicRow = nextTopic
    ? topics.find((topic) => topic.slug === nextTopic.slug)
    : undefined;
  const targetTopic = topicById.get(target.topic_id);
  const targetPrerequisiteIds = targetTopic
    ? [...(prerequisitesByTopic.get(targetTopic.id) ?? [])]
    : [];
  const relatedMasteryValues = targetPrerequisiteIds.map(
    (topicId) => masteryByTopicId.get(topicId) ?? 0.5
  );
  const relatedTopicPerformance =
    relatedMasteryValues.length > 0
      ? relatedMasteryValues.reduce((sum, value) => sum + value, 0) /
        relatedMasteryValues.length
      : 0.5;

  const allOutcomes = submissions.map(
    (submission) => submission.status === "accepted"
  );
  const recentOutcomes = allOutcomes.slice(-10);
  const problemSubmissions = submissions.filter(
    (submission) => submission.problem_id === target.id
  );
  const targetTopicProblems = problems.filter(
    (problem) => problem.topic_id === target.topic_id
  );
  const solvedTargetProblems = solvedProblemsByTopic.get(targetTopic?.slug ?? "")?.size ?? 0;
  const activeDays = new Set(
    submissions
      .filter(
        (submission) =>
          Date.now() - new Date(submission.created_at).getTime() <=
          30 * 24 * 60 * 60 * 1000
      )
      .map((submission) => submission.created_at.slice(0, 10))
  ).size;
  const features: PredictionFeatures = {
    previous_accuracy: clampRate(
      allOutcomes.filter(Boolean).length,
      allOutcomes.length
    ),
    attempts_per_problem: Math.min(problemSubmissions.length, 6),
    topic_familiarity: Math.min(
      1,
      (solvedTargetProblems + 1) / (targetTopicProblems.length + 2)
    ),
    problem_difficulty: difficultyValue(target.difficulty),
    recent_success_rate: clampRate(
      recentOutcomes.filter(Boolean).length,
      recentOutcomes.length
    ),
    related_topic_performance: relatedTopicPerformance,
    learning_activity_hours: Math.min(20, activeDays * 1.5),
  };

  const topicNameById = new Map(topics.map((topic) => [topic.id, topic.name]));
  const nextTopicPrerequisiteIds = nextTopicRow
    ? [...(prerequisitesByTopic.get(nextTopicRow.id) ?? [])]
    : [];
  const prerequisiteNames = nextTopicPrerequisiteIds
    .map((topicId) => topicNameById.get(topicId))
    .filter((name): name is string => Boolean(name));
  const nextTopicMastery = nextTopic?.mastery ?? null;
  const recommendedDifficulty =
    nextTopicMastery === null || nextTopicMastery < 0.4
      ? "easy"
      : nextTopicMastery < 0.7
        ? "medium"
        : "hard";
  const recommendedProblems = nextTopicRow
    ? problems
        .filter((problem) => problem.topic_id === nextTopicRow.id)
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
              ? `Prerequisites are at mastery: ${prerequisiteNames.join(", ")}.`
              : "",
            `${nextTopicRow.name} mastery is ${Math.round((nextTopicMastery ?? 0) * 100)}%, below the ${Math.round(completionTarget * 100)}% target.`,
            `This ${problem.difficulty} problem is suited to the current level.`,
          ]
            .filter(Boolean)
            .join(" "),
        }))
    : [];

  return NextResponse.json(
    {
      syntheticDemo: true,
      model: predictionModelName,
      probability: predictProblemSuccess(features),
      features,
      topicMastery,
      weakTopics,
      recommendedNextTopic: nextTopic,
      recommendedProblems,
      explanation: nextTopic
        ? `${nextTopic.name} is the weakest topic currently eligible under the curriculum prerequisites.`
        : "All available topics meet the current mastery target.",
      submissionCount: submissions.length,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
