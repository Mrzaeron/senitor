export type ProblemDifficulty = "easy" | "medium" | "hard";
export type ProblemLanguage = "cpp" | "python";
export type SubmissionStatus =
  | "accepted"
  | "wrong_answer"
  | "compilation_error"
  | "runtime_error"
  | "time_limit_exceeded"
  | "execution_error";

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface ProblemHint {
  text: string;
}

export interface ProblemTag {
  id: string;
  name: string;
  slug: string;
}

export interface ProblemTestCase {
  id: string;
  problem_id: string;
  input: string;
  expected_output: string;
  is_sample: boolean;
  sort_order: number;
}

export interface Problem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: ProblemDifficulty;
  topic_id: string;
  subtopic_id: string;
  constraints: string[];
  input_format: string;
  output_format: string;
  examples: ProblemExample[];
  hints: ProblemHint[];
  supported_languages: string[];
  starter_code: Record<ProblemLanguage, string>;
  acceptance_rate: number | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export type ProblemListItem = Pick<
  Problem,
  | "id"
  | "title"
  | "slug"
  | "description"
  | "difficulty"
  | "topic_id"
  | "subtopic_id"
> & {
  topic_name: string;
  topic_slug: string;
  subtopic_name: string;
  tags: ProblemTag[];
};

export interface ProblemDetail extends Problem {
  topic_name: string;
  topic_slug: string;
  subtopic_name: string;
  tags: ProblemTag[];
  related_problems: ProblemListItem[];
}

export interface ProblemFilters {
  topics: Array<{ id: string; name: string; slug: string }>;
  tags: ProblemTag[];
  difficulties: ProblemDifficulty[];
}

export interface ProblemSearchFilters {
  search?: string;
  topicSlug?: string;
  difficulty?: ProblemDifficulty;
  tagSlugs?: string[];
  page?: number;
  pageSize?: number;
}

export interface PublishedProblemPage {
  problems: ProblemListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface ProblemSubmissionHistoryItem {
  id: string;
  language: ProblemLanguage;
  status: SubmissionStatus;
  execution_time: number | null;
  memory_used: number | null;
  passed_test_cases: number;
  total_test_cases: number;
  created_at: string;
}

export interface SampleExecutionResult {
  index: number;
  status: SubmissionStatus;
  passed: boolean;
  expected_output: string;
  stdout: string;
  stderr: string;
  execution_time: number | null;
  memory_used: number | null;
}
