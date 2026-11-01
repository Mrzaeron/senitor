export type TopicDifficulty = "beginner" | "intermediate" | "advanced";

export interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  difficulty: TopicDifficulty;
  sort_order: number;
  is_published: boolean;
  created_at: string;
}

export interface TopicWithSubtopicCount extends Topic {
  subtopic_count: number;
}

export type TopicCatalogItem = Pick<
  Topic,
  "id" | "name" | "slug" | "description" | "icon" | "difficulty"
> & {
  subtopic_count: number;
};

export interface Subtopic {
  id: string;
  topic_id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  estimated_minutes: number | null;
  is_published: boolean;
  created_at: string;
}

export interface SubtopicWithLessonCount extends Subtopic {
  lesson_count: number;
}

export interface Lesson {
  id: string;
  subtopic_id: string;
  title: string;
  slug: string;
  content: string;
  estimated_minutes: number;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubtopicPrerequisite {
  subtopic_id: string;
  prerequisite_subtopic_id: string;
}

export interface SubtopicPrerequisiteDetails extends SubtopicPrerequisite {
  prerequisite: Subtopic;
  topic: Pick<Topic, "name" | "slug">;
}

export interface LessonContext {
  topic: Topic;
  subtopic: Subtopic;
  lesson: Lesson;
}
