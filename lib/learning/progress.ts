import "server-only";

import {
  getAuthenticatedClient,
  SupabaseAuthenticationError,
} from "@/lib/supabase/authenticated-client";
import { logSupabaseQueryError } from "@/lib/supabase/diagnostics";
import {
  calculateOverallLearningProgress,
  countLessonProgress,
  type ProgressCalculationLesson,
  type ProgressCalculationRow,
  type ProgressCalculationSubtopic,
} from "@/lib/learning/progress-calculations";
import type {
  LastLearningPosition,
  LessonProgress,
  LessonProgressStatus,
  OverallLearningProgress,
  SubtopicProgressSummary,
  TopicProgressSummary,
} from "@/types/learning-progress";
import type { TopicCatalogItem, Topic } from "@/types/curriculum";

const progressColumns =
  "id, user_id, lesson_id, status, started_at, completed_at, updated_at";

type ProgressClient = Awaited<
  ReturnType<typeof getAuthenticatedClient>
>["supabase"];
type VerifiedClient = {
  supabase: ProgressClient;
  userId: string;
};

type PublishedLessonPosition = {
  id: string;
  subtopic_id: string;
  lesson_title: string;
  lesson_slug: string;
  subtopic_name: string;
  subtopic_slug: string;
  topic_id: string;
  topic_name: string;
  topic_slug: string;
};

type LessonRow = ProgressCalculationLesson;
type SubtopicRow = ProgressCalculationSubtopic;
type ProgressRow = ProgressCalculationRow;

export class LearningProgressError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LearningProgressError";
  }
}

function throwQueryError(
  operation: string,
  error: { code?: string; message: string }
): never {
  logSupabaseQueryError("learning-progress", operation, error);
  const isSchemaError = [
    "PGRST200",
    "PGRST204",
    "PGRST205",
    "42P01",
    "42703",
  ].includes(error.code ?? "");
  throw new LearningProgressError(
    isSchemaError
      ? "The learning database is not ready. Apply the curriculum and learning-progress migrations, or refresh the Supabase API schema cache, then retry."
      : "Learning progress could not be loaded or saved. Please try again."
  );
}

async function getVerifiedClient(): Promise<VerifiedClient> {
  try {
    const { supabase, userId } = await getAuthenticatedClient();
    return { supabase, userId };
  } catch (error) {
    if (error instanceof SupabaseAuthenticationError) {
      throw new LearningProgressError(error.message);
    }
    throw error;
  }
}

async function getProgressRow(
  supabase: ProgressClient,
  userId: string,
  lessonId: string
): Promise<LessonProgress | null> {
  const { data, error } = await supabase
    .from("lesson_progress")
    .select(progressColumns)
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (error) throwQueryError("loading lesson progress", error);
  return data as LessonProgress | null;
}

async function getPublishedLessonPosition(
  supabase: ProgressClient,
  lessonId: string
): Promise<PublishedLessonPosition | null> {
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id, title, slug, subtopic_id")
    .eq("id", lessonId)
    .eq("is_published", true)
    .maybeSingle();

  if (lessonError) throwQueryError("checking the lesson", lessonError);
  if (!lesson) return null;

  const { data: subtopic, error: subtopicError } = await supabase
    .from("subtopics")
    .select("id, name, slug, topic_id")
    .eq("id", lesson.subtopic_id)
    .eq("is_published", true)
    .maybeSingle();

  if (subtopicError) throwQueryError("checking the lesson subtopic", subtopicError);
  if (!subtopic) return null;

  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select("id, name, slug")
    .eq("id", subtopic.topic_id)
    .eq("is_published", true)
    .maybeSingle();

  if (topicError) throwQueryError("checking the lesson topic", topicError);
  if (!topic) return null;

  return {
    id: lesson.id,
    subtopic_id: subtopic.id,
    lesson_title: lesson.title,
    lesson_slug: lesson.slug,
    subtopic_name: subtopic.name,
    subtopic_slug: subtopic.slug,
    topic_id: topic.id,
    topic_name: topic.name,
    topic_slug: topic.slug,
  };
}

async function assertSubtopicPrerequisitesComplete(
  supabase: ProgressClient,
  userId: string,
  subtopicId: string
): Promise<void> {
  const { data: prerequisites, error } = await supabase
    .from("subtopic_prerequisites")
    .select("prerequisite_subtopic_id")
    .eq("subtopic_id", subtopicId);

  if (error) throwQueryError("loading lesson prerequisites", error);
  const prerequisiteIds = (prerequisites ?? []).map(
    (prerequisite) => prerequisite.prerequisite_subtopic_id as string
  );
  if (prerequisiteIds.length === 0) return;

  const prerequisiteLessons = await getLessonRows(supabase, prerequisiteIds);
  const progressRows = await getProgressRows(
    supabase,
    userId,
    prerequisiteLessons
  );
  const progressByLesson = new Map(
    progressRows.map((progress) => [progress.lesson_id, progress])
  );
  const allComplete = prerequisiteIds.every((prerequisiteId) => {
    const lessons = prerequisiteLessons.filter(
      (lesson) => lesson.subtopic_id === prerequisiteId
    );
    return (
      lessons.length > 0 &&
      lessons.every(
        (lesson) => progressByLesson.get(lesson.id)?.status === "completed"
      )
    );
  });

  if (!allComplete) {
    throw new LearningProgressError(
      "Complete the prerequisite lessons before starting this lesson."
    );
  }
}

export async function areSubtopicPrerequisitesComplete(
  subtopicId: string
): Promise<boolean> {
  const { supabase, userId } = await getVerifiedClient();
  try {
    await assertSubtopicPrerequisitesComplete(supabase, userId, subtopicId);
    return true;
  } catch (error) {
    if (
      error instanceof LearningProgressError &&
      error.message.includes("prerequisite")
    ) {
      return false;
    }
    throw error;
  }
}

async function getLessonRows(
  supabase: ProgressClient,
  subtopicIds: string[]
): Promise<LessonRow[]> {
  if (subtopicIds.length === 0) return [];

  const { data, error } = await supabase
    .from("lessons")
    .select("id, subtopic_id")
    .eq("is_published", true)
    .in("subtopic_id", subtopicIds);
  if (error) throwQueryError("loading published lessons", error);
  return (data ?? []) as LessonRow[];
}

async function getProgressRows(
  supabase: ProgressClient,
  userId: string,
  lessons: LessonRow[]
): Promise<ProgressRow[]> {
  if (lessons.length === 0) return [];

  const { data, error } = await supabase
    .from("lesson_progress")
    .select("lesson_id, status")
    .eq("user_id", userId)
    .in(
      "lesson_id",
      lessons.map((lesson) => lesson.id)
    );

  if (error) throwQueryError("loading progress summaries", error);
  return (data ?? []) as ProgressRow[];
}

async function setLessonInProgress(
  supabase: ProgressClient,
  userId: string,
  lessonId: string
): Promise<LessonProgress> {
  const existing = await getProgressRow(supabase, userId, lessonId);
  if (existing?.status === "completed" || existing?.status === "in_progress") {
    return existing;
  }

  if (existing?.status === "not_started") {
    const { error } = await supabase
      .from("lesson_progress")
      .update({
        status: "in_progress",
        started_at: new Date().toISOString(),
        completed_at: null,
      })
      .eq("user_id", userId)
      .eq("lesson_id", lessonId)
      .eq("status", "not_started");

    if (error) throwQueryError("starting the lesson", error);
  } else {
    const { error } = await supabase.from("lesson_progress").upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        status: "in_progress",
        started_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id", ignoreDuplicates: true }
    );

    if (error) throwQueryError("starting the lesson", error);
  }

  const updated = await getProgressRow(supabase, userId, lessonId);
  if (!updated) {
    throw new LearningProgressError(
      "The lesson progress could not be saved. Please try again."
    );
  }
  return updated;
}

async function completeLessonForUser(
  supabase: ProgressClient,
  userId: string,
  lessonId: string
): Promise<LessonProgress> {
  const existing = await getProgressRow(supabase, userId, lessonId);
  if (existing?.status === "completed") return existing;

  const now = new Date().toISOString();
  if (!existing) {
    const { error } = await supabase.from("lesson_progress").upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        status: "completed",
        started_at: now,
        completed_at: now,
      },
      { onConflict: "user_id,lesson_id", ignoreDuplicates: true }
    );

    if (error) throwQueryError("completing the lesson", error);
  }

  const current = await getProgressRow(supabase, userId, lessonId);
  if (!current) {
    throw new LearningProgressError(
      "The lesson completion could not be saved. Please try again."
    );
  }
  if (current.status === "completed") return current;

  const { error } = await supabase
    .from("lesson_progress")
    .update({
      status: "completed",
      started_at: current.started_at ?? now,
      completed_at: now,
    })
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .neq("status", "completed");

  if (error) throwQueryError("completing the lesson", error);

  const completed = await getProgressRow(supabase, userId, lessonId);
  if (!completed) {
    throw new LearningProgressError(
      "The lesson completion could not be confirmed. Please try again."
    );
  }
  return completed;
}

export async function getLessonProgress(
  lessonId: string
): Promise<LessonProgress | null> {
  const { supabase, userId } = await getVerifiedClient();
  return getProgressRow(supabase, userId, lessonId);
}

export async function markLessonInProgress(
  lessonId: string
): Promise<LessonProgress> {
  const { supabase, userId } = await getVerifiedClient();
  const position = await getPublishedLessonPosition(supabase, lessonId);
  if (!position) {
    throw new LearningProgressError("This lesson is unavailable.");
  }

  return setLessonInProgress(supabase, userId, lessonId);
}

export async function completeLesson(
  lessonId: string
): Promise<LessonProgress> {
  const { supabase, userId } = await getVerifiedClient();
  const position = await getPublishedLessonPosition(supabase, lessonId);
  if (!position) {
    throw new LearningProgressError("This lesson is unavailable.");
  }

  await assertSubtopicPrerequisitesComplete(
    supabase,
    userId,
    position.subtopic_id
  );
  return completeLessonForUser(supabase, userId, lessonId);
}

export async function recordLessonVisit(
  lessonId: string
): Promise<LessonProgress> {
  const { supabase, userId } = await getVerifiedClient();
  const position = await getPublishedLessonPosition(supabase, lessonId);
  if (!position) {
    throw new LearningProgressError("This lesson is unavailable.");
  }

  await assertSubtopicPrerequisitesComplete(
    supabase,
    userId,
    position.subtopic_id
  );
  const progress = await setLessonInProgress(supabase, userId, lessonId);
  const { error } = await supabase.from("user_learning_state").upsert(
    {
      user_id: userId,
      last_lesson_id: position.id,
      last_subtopic_id: position.subtopic_id,
      last_topic_id: position.topic_id,
    },
    { onConflict: "user_id" }
  );

  if (error) throwQueryError("updating the last learning position", error);
  return progress;
}

export async function getSubtopicProgress(
  subtopicId: string
): Promise<SubtopicProgressSummary | null> {
  const { supabase, userId } = await getVerifiedClient();
  const { data: subtopic, error: subtopicError } = await supabase
    .from("subtopics")
    .select("id")
    .eq("id", subtopicId)
    .eq("is_published", true)
    .maybeSingle();

  if (subtopicError) {
    throwQueryError("checking the subtopic", subtopicError);
  }
  if (!subtopic) return null;

  const lessons = await getLessonRows(supabase, [subtopicId]);
  const progressRows = await getProgressRows(supabase, userId, lessons);
  return {
    subtopic_id: subtopicId,
    ...countLessonProgress(lessons, progressRows),
  };
}

export async function getSubtopicLessonStatuses(
  subtopicId: string
): Promise<Record<string, LessonProgressStatus>> {
  const { supabase, userId } = await getVerifiedClient();
  const lessons = await getLessonRows(supabase, [subtopicId]);
  const progressRows = await getProgressRows(supabase, userId, lessons);

  return Object.fromEntries(
    progressRows.map((progress) => [progress.lesson_id, progress.status])
  );
}

export async function getTopicProgress(
  topicId: string
): Promise<TopicProgressSummary | null> {
  const { supabase, userId } = await getVerifiedClient();
  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select("id")
    .eq("id", topicId)
    .eq("is_published", true)
    .maybeSingle();

  if (topicError) throwQueryError("checking the topic", topicError);
  if (!topic) return null;

  const { data: subtopics, error: subtopicError } = await supabase
    .from("subtopics")
    .select("id")
    .eq("topic_id", topicId)
    .eq("is_published", true);

  if (subtopicError) {
    throwQueryError("loading topic subtopics", subtopicError);
  }

  const subtopicIds = (subtopics ?? []).map(
    (subtopic) => subtopic.id as string
  );
  const lessons = await getLessonRows(supabase, subtopicIds);
  const progressRows = await getProgressRows(supabase, userId, lessons);
  const lessonsBySubtopic = new Map<string, LessonRow[]>();
  for (const lesson of lessons) {
    const rows = lessonsBySubtopic.get(lesson.subtopic_id) ?? [];
    rows.push(lesson);
    lessonsBySubtopic.set(lesson.subtopic_id, rows);
  }

  const progressByLesson = new Map(
    progressRows.map((progress) => [progress.lesson_id, progress])
  );
  const subtopicProgress = subtopicIds.map((subtopicId) => {
    const subtopicLessons = lessonsBySubtopic.get(subtopicId) ?? [];
    return {
      subtopic_id: subtopicId,
      ...countLessonProgress(subtopicLessons, subtopicLessons.flatMap((lesson) => {
        const progress = progressByLesson.get(lesson.id);
        return progress ? [progress] : [];
      })),
    };
  });

  return {
    topic_id: topicId,
    ...countLessonProgress(lessons, progressRows),
    subtopics: subtopicProgress,
  };
}

async function loadLearningOverview(
  supabase: ProgressClient,
  userId: string
): Promise<{ topics: TopicCatalogItem[]; progress: OverallLearningProgress }> {
  const [topicsResult, subtopicsResult, lessonsResult] = await Promise.all([
    supabase
      .from("topics")
      .select("id, name, slug, description, icon, difficulty")
      .eq("is_published", true)
      .order("sort_order"),
    supabase
      .from("subtopics")
      .select("id, topic_id")
      .eq("is_published", true),
    supabase
      .from("lessons")
      .select("id, subtopic_id")
      .eq("is_published", true),
  ]);

  if (topicsResult.error) {
    throwQueryError("loading published topics", topicsResult.error);
  }
  if (subtopicsResult.error) {
    throwQueryError("loading published subtopics", subtopicsResult.error);
  }
  if (lessonsResult.error) {
    throwQueryError("loading published lessons", lessonsResult.error);
  }

  const topics = (topicsResult.data ?? []) as Pick<
    Topic,
    "id" | "name" | "slug" | "description" | "icon" | "difficulty"
  >[];
  const subtopics = (subtopicsResult.data ?? []) as SubtopicRow[];
  const lessons = (lessonsResult.data ?? []) as LessonRow[];
  const progressRows = await getProgressRows(supabase, userId, lessons);
  const subtopicCounts = new Map<string, number>();

  for (const subtopic of subtopics) {
    subtopicCounts.set(
      subtopic.topic_id,
      (subtopicCounts.get(subtopic.topic_id) ?? 0) + 1
    );
  }

  return {
    topics: topics.map((topic) => ({
      ...topic,
      subtopic_count: subtopicCounts.get(topic.id) ?? 0,
    })),
    progress: calculateOverallLearningProgress(
      topics,
      subtopics,
      lessons,
      progressRows
    ),
  };
}

export async function getOverallLearningProgress(): Promise<OverallLearningProgress> {
  const { supabase, userId } = await getVerifiedClient();
  const overview = await loadLearningOverview(supabase, userId);
  return overview.progress;
}

export async function getLearningOverview(): Promise<{
  topics: TopicCatalogItem[];
  progress: OverallLearningProgress;
}> {
  const { supabase, userId } = await getVerifiedClient();
  return loadLearningOverview(supabase, userId);
}

export async function getLastLearningPosition(): Promise<LastLearningPosition | null> {
  const { supabase, userId } = await getVerifiedClient();
  const { data: state, error } = await supabase
    .from("user_learning_state")
    .select("last_lesson_id, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throwQueryError("loading the last learning position", error);
  if (!state?.last_lesson_id) return null;

  const [position, progress] = await Promise.all([
    getPublishedLessonPosition(supabase, state.last_lesson_id),
    getProgressRow(supabase, userId, state.last_lesson_id),
  ]);
  if (!position) return null;

  return {
    lesson_id: position.id,
    lesson_title: position.lesson_title,
    lesson_slug: position.lesson_slug,
    subtopic_id: position.subtopic_id,
    subtopic_name: position.subtopic_name,
    subtopic_slug: position.subtopic_slug,
    topic_id: position.topic_id,
    topic_name: position.topic_name,
    topic_slug: position.topic_slug,
    updated_at: state.updated_at,
    progress_status: progress?.status ?? null,
  };
}
