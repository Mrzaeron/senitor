import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { logSupabaseQueryError } from "@/lib/supabase/diagnostics";
import type {
  Problem,
  ProblemDetail,
  ProblemDifficulty,
  ProblemFilters,
  ProblemListItem,
  ProblemSearchFilters,
  ProblemTag,
  PublishedProblemPage,
} from "@/types/problems";

const problemColumns =
  "id, title, slug, description, difficulty, topic_id, subtopic_id, constraints, input_format, output_format, examples, hints, supported_languages, starter_code, acceptance_rate, is_published, created_at, updated_at";
const problemListColumns =
  "id, title, slug, description, difficulty, topic_id, subtopic_id";

const defaultPageSize = 20;
const maximumPageSize = 50;
const maximumPage = 10_000;

type ProblemSupabaseClient = Awaited<ReturnType<typeof createClient>>;
type ProblemListRecord = Pick<
  Problem,
  "id" | "title" | "slug" | "description" | "difficulty" | "topic_id" | "subtopic_id"
>;
type ProblemListAssociations = Pick<
  ProblemListItem,
  "topic_name" | "topic_slug" | "subtopic_name" | "tags"
>;

export const problemDifficulties: ProblemDifficulty[] = [
  "easy",
  "medium",
  "hard",
];

export class ProblemDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProblemDataError";
  }
}

async function getProblemClient() {
  if (!isSupabaseConfigured()) {
    throw new ProblemDataError(
      "The problem bank is not configured. Configure Supabase and apply the problem bank migration."
    );
  }
  return createClient();
}

function throwQueryError(
  operation: string,
  error: { code?: string; message: string }
): never {
  logSupabaseQueryError("problem-bank", operation, error);
  const isSchemaError = [
    "PGRST200",
    "PGRST204",
    "PGRST205",
    "42P01",
    "42703",
  ].includes(error.code ?? "");
  throw new ProblemDataError(
    isSchemaError
      ? "The problem bank database is not ready. Apply its migrations and seed data, or refresh the Supabase API schema cache, then retry."
      : "Problem data could not be loaded. Please try again later."
  );
}

function normalizeSearch(search?: string): string | undefined {
  const normalized = search?.trim().slice(0, 100);
  if (!normalized) return undefined;
  return normalized.replace(/[\\%_]/g, "\\$&");
}

function normalizePage(page?: number): number {
  return Number.isSafeInteger(page) && page && page > 0
    ? Math.min(page, maximumPage)
    : 1;
}

function normalizePageSize(pageSize?: number): number {
  return Number.isSafeInteger(pageSize) && pageSize && pageSize > 0
    ? Math.min(pageSize, maximumPageSize)
    : defaultPageSize;
}

function emptyPage(page: number, pageSize: number): PublishedProblemPage {
  return { problems: [], total: 0, page, pageSize, pageCount: 0 };
}

async function getTopicIdBySlug(
  supabase: ProblemSupabaseClient,
  slug: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("topics")
    .select("id")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) throwQueryError("loading the topic filter", error);
  return data?.id ?? null;
}

async function getProblemTags(
  supabase: ProblemSupabaseClient,
  problemIds: string[]
): Promise<Map<string, ProblemTag[]>> {
  if (problemIds.length === 0) return new Map();

  const { data: relations, error: relationError } = await supabase
    .from("problem_tag_relations")
    .select("problem_id, tag_id")
    .in("problem_id", problemIds);

  if (relationError) {
    throwQueryError("loading problem tag relationships", relationError);
  }

  const relationRows = (relations ?? []) as Array<{
    problem_id: string;
    tag_id: string;
  }>;
  const tagIds = [...new Set(relationRows.map(({ tag_id }) => tag_id))];
  if (tagIds.length === 0) return new Map();

  const { data: tags, error: tagsError } = await supabase
    .from("problem_tags")
    .select("id, name, slug")
    .in("id", tagIds)
    .order("name");

  if (tagsError) throwQueryError("loading problem tags", tagsError);

  const tagById = new Map(
    ((tags ?? []) as ProblemTag[]).map((tag) => [tag.id, tag])
  );
  const tagsByProblem = new Map<string, ProblemTag[]>();
  for (const relation of relationRows) {
    const tag = tagById.get(relation.tag_id);
    if (!tag) continue;

    const problemTags = tagsByProblem.get(relation.problem_id) ?? [];
    problemTags.push(tag);
    tagsByProblem.set(relation.problem_id, problemTags);
  }
  return tagsByProblem;
}

async function hydrateProblemList<T extends ProblemListRecord>(
  supabase: ProblemSupabaseClient,
  problems: T[]
): Promise<Array<T & ProblemListAssociations>> {
  if (problems.length === 0) return [];

  const topicIds = [...new Set(problems.map(({ topic_id }) => topic_id))];
  const subtopicIds = [...new Set(problems.map(({ subtopic_id }) => subtopic_id))];
  const [topicsResult, subtopicsResult, tagsByProblem] = await Promise.all([
    supabase
      .from("topics")
      .select("id, name, slug")
      .in("id", topicIds)
      .eq("is_published", true),
    supabase
      .from("subtopics")
      .select("id, name, slug")
      .in("id", subtopicIds)
      .eq("is_published", true),
    getProblemTags(
      supabase,
      problems.map(({ id }) => id)
    ),
  ]);

  if (topicsResult.error) {
    throwQueryError("loading problem topics", topicsResult.error);
  }
  if (subtopicsResult.error) {
    throwQueryError("loading problem subtopics", subtopicsResult.error);
  }

  const topicById = new Map(
    (topicsResult.data ?? []).map((topic) => [topic.id, topic])
  );
  const subtopicById = new Map(
    (subtopicsResult.data ?? []).map((subtopic) => [subtopic.id, subtopic])
  );

  return problems.flatMap((problem) => {
    const topic = topicById.get(problem.topic_id);
    const subtopic = subtopicById.get(problem.subtopic_id);
    if (!topic || !subtopic) return [];

    return [{
      ...problem,
      topic_name: topic.name,
      topic_slug: topic.slug,
      subtopic_name: subtopic.name,
      tags: tagsByProblem.get(problem.id) ?? [],
    }];
  });
}

export async function getPublishedProblems(
  filters: ProblemSearchFilters = {}
): Promise<PublishedProblemPage> {
  const supabase = await getProblemClient();
  const page = normalizePage(filters.page);
  const pageSize = normalizePageSize(filters.pageSize);
  const search = normalizeSearch(filters.search);
  const tagSlugs = [...new Set(filters.tagSlugs ?? [])].slice(0, 10);

  let topicId: string | null = null;
  if (filters.topicSlug) {
    topicId = await getTopicIdBySlug(supabase, filters.topicSlug);
    if (!topicId) return emptyPage(page, pageSize);
  }

  let problemIdsForTags: string[] | undefined;
  if (tagSlugs.length > 0) {
    const { data: tagRows, error: tagError } = await supabase
      .from("problem_tags")
      .select("id, slug")
      .in("slug", tagSlugs);

    if (tagError) throwQueryError("loading selected tags", tagError);
    const tagIds = (tagRows ?? []).map((tag) => tag.id as string);
    if (tagIds.length !== tagSlugs.length) {
      return emptyPage(page, pageSize);
    }

    const { data: relations, error: relationError } = await supabase
      .from("problem_tag_relations")
      .select("problem_id, tag_id")
      .in("tag_id", tagIds);

    if (relationError) {
      throwQueryError("filtering problems by tag", relationError);
    }

    const tagCounts = new Map<string, Set<string>>();
    for (const relation of (relations ?? []) as Array<{
      problem_id: string;
      tag_id: string;
    }>) {
      const tags = tagCounts.get(relation.problem_id) ?? new Set<string>();
      tags.add(relation.tag_id);
      tagCounts.set(relation.problem_id, tags);
    }
    problemIdsForTags = [...tagCounts]
      .filter(([, tags]) => tagIds.every((tagId) => tags.has(tagId)))
      .map(([problemId]) => problemId);

    if (problemIdsForTags.length === 0) {
      return emptyPage(page, pageSize);
    }
  }

  let query = supabase
    .from("problems")
    .select(problemListColumns, { count: "exact" })
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true });

  if (topicId) query = query.eq("topic_id", topicId);
  if (filters.difficulty) query = query.eq("difficulty", filters.difficulty);
  if (search) query = query.ilike("title", `%${search}%`);
  if (problemIdsForTags) query = query.in("id", problemIdsForTags);

  const start = (page - 1) * pageSize;
  const { data, count, error } = await query.range(start, start + pageSize - 1);
  if (error) throwQueryError("loading published problems", error);

  const problems = await hydrateProblemList(
    supabase,
    (data ?? []) as ProblemListRecord[]
  );
  const total = count ?? 0;
  return {
    problems,
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
  };
}

export async function getProblemsByTopic(
  topicSlug: string,
  options: Omit<ProblemSearchFilters, "topicSlug"> = {}
): Promise<PublishedProblemPage> {
  return getPublishedProblems({ ...options, topicSlug });
}

export async function getProblemsByDifficulty(
  difficulty: ProblemDifficulty,
  options: Omit<ProblemSearchFilters, "difficulty"> = {}
): Promise<PublishedProblemPage> {
  return getPublishedProblems({ ...options, difficulty });
}

export async function getProblemFilters(): Promise<ProblemFilters> {
  const supabase = await getProblemClient();
  const [topicsResult, tagsResult] = await Promise.all([
    supabase
      .from("topics")
      .select("id, name, slug")
      .eq("is_published", true)
      .order("sort_order"),
    supabase
      .from("problem_tags")
      .select("id, name, slug")
      .order("name"),
  ]);

  if (topicsResult.error) {
    throwQueryError("loading problem topic filters", topicsResult.error);
  }
  if (tagsResult.error) {
    throwQueryError("loading problem tag filters", tagsResult.error);
  }

  return {
    topics: topicsResult.data ?? [],
    tags: (tagsResult.data ?? []) as ProblemTag[],
    difficulties: problemDifficulties,
  };
}

async function getRelatedProblemsWithClient(
  supabase: ProblemSupabaseClient,
  problem: Pick<Problem, "id" | "topic_id">,
  limit = 4
): Promise<ProblemListItem[]> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit) || 4, 1), 8);

  const [topicResult, relationResult] = await Promise.all([
    supabase
      .from("problems")
      .select("id")
      .eq("topic_id", problem.topic_id)
      .eq("is_published", true)
      .neq("id", problem.id)
      .limit(safeLimit * 2),
    supabase
      .from("problem_tag_relations")
      .select("tag_id")
      .eq("problem_id", problem.id),
  ]);

  if (topicResult.error) {
    throwQueryError("loading related topic problems", topicResult.error);
  }
  if (relationResult.error) {
    throwQueryError("loading related problem tags", relationResult.error);
  }

  const relatedIds = new Set(
    (topicResult.data ?? []).map((row) => row.id as string)
  );
  const tagIds = [
    ...new Set((relationResult.data ?? []).map((row) => row.tag_id as string)),
  ];

  if (tagIds.length > 0) {
    const { data, error } = await supabase
      .from("problem_tag_relations")
      .select("problem_id")
      .in("tag_id", tagIds)
      .neq("problem_id", problem.id)
      .limit(safeLimit * 4);

    if (error) throwQueryError("loading related tagged problems", error);
    for (const row of data ?? []) relatedIds.add(row.problem_id as string);
  }

  if (relatedIds.size === 0) return [];

  const { data, error } = await supabase
    .from("problems")
    .select(problemListColumns)
    .in("id", [...relatedIds])
    .eq("is_published", true)
    .neq("id", problem.id)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) throwQueryError("loading related problems", error);
  return hydrateProblemList(supabase, (data ?? []) as ProblemListRecord[]);
}

export async function getRelatedProblems(
  problem: Pick<Problem, "id" | "topic_id">,
  limit = 4
): Promise<ProblemListItem[]> {
  const supabase = await getProblemClient();
  return getRelatedProblemsWithClient(supabase, problem, limit);
}

export async function getProblemBySlug(
  slug: string
): Promise<ProblemDetail | null> {
  const supabase = await getProblemClient();
  const { data, error } = await supabase
    .from("problems")
    .select(problemColumns)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) throwQueryError("loading the problem", error);
  if (!data) return null;

  const [problem] = await hydrateProblemList(supabase, [data as Problem]);
  if (!problem) return null;

  const relatedProblems = await getRelatedProblemsWithClient(
    supabase,
    problem,
    4
  );
  return { ...problem, related_problems: relatedProblems };
}
