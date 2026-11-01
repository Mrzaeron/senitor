import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { logSupabaseQueryError } from "@/lib/supabase/diagnostics";
import type {
  Lesson,
  LessonContext,
  Subtopic,
  SubtopicPrerequisite,
  SubtopicPrerequisiteDetails,
  SubtopicWithLessonCount,
  Topic,
  TopicWithSubtopicCount,
} from "@/types/curriculum";

export class CurriculumDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CurriculumDataError";
  }
}

async function getCurriculumClient() {
  if (!isSupabaseConfigured()) {
    throw new CurriculumDataError(
      "Curriculum is not configured. Configure the Supabase project and apply the curriculum migration."
    );
  }
  return createClient();
}

function throwQueryError(
  operation: string,
  error: { code?: string; message: string }
): never {
  logSupabaseQueryError("curriculum", operation, error);
  const isSchemaError = [
    "PGRST200",
    "PGRST204",
    "PGRST205",
    "42P01",
    "42703",
  ].includes(error.code ?? "");
  throw new CurriculumDataError(
    isSchemaError
      ? "The curriculum database is not ready. Apply its migrations and seed data, or refresh the Supabase API schema cache, then retry."
      : "Curriculum data could not be loaded. Please try again later."
  );
}

export async function getPublishedTopics(): Promise<TopicWithSubtopicCount[]> {
  const supabase = await getCurriculumClient();
  const [topicsResult, subtopicsResult] = await Promise.all([
    supabase
      .from("topics")
      .select(
        "id, name, slug, description, icon, difficulty, sort_order, is_published, created_at"
      )
      .eq("is_published", true)
      .order("sort_order"),
    supabase
      .from("subtopics")
      .select("topic_id")
      .eq("is_published", true),
  ]);

  if (topicsResult.error) throwQueryError("loading topics", topicsResult.error);
  if (subtopicsResult.error) {
    throwQueryError("counting published subtopics", subtopicsResult.error);
  }

  const subtopicCounts = new Map<string, number>();
  for (const { topic_id: topicId } of subtopicsResult.data as Pick<
    Subtopic,
    "topic_id"
  >[]) {
    subtopicCounts.set(topicId, (subtopicCounts.get(topicId) ?? 0) + 1);
  }

  return (topicsResult.data as Topic[]).map((topic) => ({
    ...topic,
    subtopic_count: subtopicCounts.get(topic.id) ?? 0,
  }));
}

export async function getTopicBySlug(slug: string): Promise<Topic | null> {
  const supabase = await getCurriculumClient();
  const { data, error } = await supabase
    .from("topics")
    .select(
      "id, name, slug, description, icon, difficulty, sort_order, is_published, created_at"
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) throwQueryError("loading topic", error);
  return data as Topic | null;
}

export async function getSubtopicsByTopic(
  topicId: string
): Promise<SubtopicWithLessonCount[]> {
  const supabase = await getCurriculumClient();
  const { data, error } = await supabase
    .from("subtopics")
    .select(
      "id, topic_id, name, slug, description, sort_order, estimated_minutes, is_published, created_at"
    )
    .eq("topic_id", topicId)
    .eq("is_published", true)
    .order("sort_order");

  if (error) throwQueryError("loading subtopics", error);
  const subtopics = data as Subtopic[];
  if (subtopics.length === 0) return [];

  const { data: lessonRows, error: lessonError } = await supabase
    .from("lessons")
    .select("subtopic_id")
    .in(
      "subtopic_id",
      subtopics.map((subtopic) => subtopic.id)
    )
    .eq("is_published", true);

  if (lessonError) throwQueryError("counting published lessons", lessonError);

  const lessonCounts = new Map<string, number>();
  for (const { subtopic_id: subtopicId } of lessonRows as Pick<
    Lesson,
    "subtopic_id"
  >[]) {
    lessonCounts.set(subtopicId, (lessonCounts.get(subtopicId) ?? 0) + 1);
  }

  return subtopics.map((subtopic) => ({
    ...subtopic,
    lesson_count: lessonCounts.get(subtopic.id) ?? 0,
  }));
}

export async function getSubtopicBySlug(
  topicSlug: string,
  subtopicSlug: string
): Promise<{ topic: Topic; subtopic: Subtopic } | null> {
  const topic = await getTopicBySlug(topicSlug);
  if (!topic) return null;

  const supabase = await getCurriculumClient();
  const { data, error } = await supabase
    .from("subtopics")
    .select(
      "id, topic_id, name, slug, description, sort_order, estimated_minutes, is_published, created_at"
    )
    .eq("topic_id", topic.id)
    .eq("slug", subtopicSlug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) throwQueryError("loading subtopic", error);
  if (!data) return null;

  return { topic, subtopic: data as Subtopic };
}

export async function getSubtopicPrerequisites(
  subtopicId: string
): Promise<SubtopicPrerequisiteDetails[]> {
  const supabase = await getCurriculumClient();
  const { data: prerequisiteRows, error } = await supabase
    .from("subtopic_prerequisites")
    .select("subtopic_id, prerequisite_subtopic_id")
    .eq("subtopic_id", subtopicId);

  if (error) throwQueryError("loading prerequisites", error);
  const prerequisites = prerequisiteRows as SubtopicPrerequisite[];
  if (prerequisites.length === 0) return [];

  const prerequisiteIds = [
    ...new Set(
      prerequisites.map(
        (prerequisite) => prerequisite.prerequisite_subtopic_id
      )
    ),
  ];
  const { data: subtopicRows, error: subtopicError } = await supabase
    .from("subtopics")
    .select(
      "id, topic_id, name, slug, description, sort_order, estimated_minutes, is_published, created_at"
    )
    .in("id", prerequisiteIds)
    .eq("is_published", true);

  if (subtopicError) {
    throwQueryError("loading prerequisite subtopics", subtopicError);
  }

  const prerequisiteSubtopics = subtopicRows as Subtopic[];
  const topicIds = [...new Set(prerequisiteSubtopics.map(({ topic_id }) => topic_id))];
  if (topicIds.length === 0) return [];

  const { data: topicRows, error: topicError } = await supabase
    .from("topics")
    .select("id, name, slug")
    .in("id", topicIds)
    .eq("is_published", true);

  if (topicError) throwQueryError("loading prerequisite topics", topicError);

  const subtopicById = new Map(
    prerequisiteSubtopics.map((subtopic) => [subtopic.id, subtopic])
  );
  const topicById = new Map(
    (topicRows as Pick<Topic, "id" | "name" | "slug">[]).map((topic) => [
      topic.id,
      topic,
    ])
  );

  return prerequisites.flatMap((prerequisite) => {
    const subtopic = subtopicById.get(prerequisite.prerequisite_subtopic_id);
    const topic = subtopic ? topicById.get(subtopic.topic_id) : undefined;
    return subtopic && topic ? [{ ...prerequisite, prerequisite: subtopic, topic }] : [];
  });
}

export async function getLessonBySlug(
  topicSlug: string,
  subtopicSlug: string,
  lessonSlug: string
): Promise<LessonContext | null> {
  const context = await getSubtopicBySlug(topicSlug, subtopicSlug);
  if (!context) return null;

  const supabase = await getCurriculumClient();
  const { data, error } = await supabase
    .from("lessons")
    .select(
      "id, subtopic_id, title, slug, content, estimated_minutes, sort_order, is_published, created_at, updated_at"
    )
    .eq("subtopic_id", context.subtopic.id)
    .eq("slug", lessonSlug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) throwQueryError("loading lesson", error);
  if (!data) return null;

  return { ...context, lesson: data as Lesson };
}

export async function getSubtopicLessons(
  subtopicId: string
): Promise<Lesson[]> {
  const supabase = await getCurriculumClient();
  const { data, error } = await supabase
    .from("lessons")
    .select(
      "id, subtopic_id, title, slug, content, estimated_minutes, sort_order, is_published, created_at, updated_at"
    )
    .eq("subtopic_id", subtopicId)
    .eq("is_published", true)
    .order("sort_order");

  if (error) throwQueryError("loading lessons", error);
  return data as Lesson[];
}
