export type LessonProgressStatus =
  | "not_started"
  | "in_progress"
  | "completed";

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  status: LessonProgressStatus;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

export interface LearningProgressCounts {
  total_lessons: number;
  completed_lessons: number;
  completion_percentage: number;
  started: boolean;
  completed: boolean;
}

export interface SubtopicProgressSummary extends LearningProgressCounts {
  subtopic_id: string;
}

export interface TopicProgressSummary extends LearningProgressCounts {
  topic_id: string;
  subtopics: SubtopicProgressSummary[];
}

export interface OverallLearningProgress extends LearningProgressCounts {
  total_topics: number;
  started_topics: number;
  in_progress_topics: number;
  completed_topics: number;
}

export interface LastLearningPosition {
  lesson_id: string;
  lesson_title: string;
  lesson_slug: string;
  subtopic_id: string;
  subtopic_name: string;
  subtopic_slug: string;
  topic_id: string;
  topic_name: string;
  topic_slug: string;
  updated_at: string;
  progress_status: LessonProgressStatus | null;
}
