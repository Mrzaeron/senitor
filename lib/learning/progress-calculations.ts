import type {
  LearningProgressCounts,
  LessonProgressStatus,
  OverallLearningProgress,
} from "@/types/learning-progress";

export type ProgressCalculationLesson = {
  id: string;
  subtopic_id: string;
};

export type ProgressCalculationSubtopic = {
  id: string;
  topic_id: string;
};

export type ProgressCalculationRow = {
  lesson_id: string;
  status: LessonProgressStatus;
};

export function countLessonProgress(
  lessons: ProgressCalculationLesson[],
  progressRows: ProgressCalculationRow[]
): LearningProgressCounts {
  const progressByLesson = new Map(
    progressRows.map((progress) => [progress.lesson_id, progress.status])
  );
  const completedLessons = lessons.reduce(
    (total, lesson) =>
      total + (progressByLesson.get(lesson.id) === "completed" ? 1 : 0),
    0
  );
  const started = lessons.some((lesson) => {
    const status = progressByLesson.get(lesson.id);
    return status === "in_progress" || status === "completed";
  });

  return {
    total_lessons: lessons.length,
    completed_lessons: completedLessons,
    completion_percentage:
      lessons.length === 0
        ? 0
        : Math.round((completedLessons / lessons.length) * 100),
    started,
    completed: lessons.length > 0 && completedLessons === lessons.length,
  };
}

export function calculateOverallLearningProgress(
  topics: { id: string }[],
  subtopics: ProgressCalculationSubtopic[],
  lessons: ProgressCalculationLesson[],
  progressRows: ProgressCalculationRow[]
): OverallLearningProgress {
  const subtopicById = new Map(
    subtopics.map((subtopic) => [subtopic.id, subtopic])
  );
  const lessonsByTopic = new Map<string, ProgressCalculationLesson[]>();
  for (const lesson of lessons) {
    const subtopic = subtopicById.get(lesson.subtopic_id);
    if (!subtopic) continue;

    const rows = lessonsByTopic.get(subtopic.topic_id) ?? [];
    rows.push(lesson);
    lessonsByTopic.set(subtopic.topic_id, rows);
  }

  const progressByLesson = new Map(
    progressRows.map((progress) => [progress.lesson_id, progress])
  );
  let startedTopics = 0;
  let completedTopics = 0;
  for (const topic of topics) {
    const topicLessons = lessonsByTopic.get(topic.id) ?? [];
    const counts = countLessonProgress(
      topicLessons,
      topicLessons.flatMap((lesson) => {
        const progress = progressByLesson.get(lesson.id);
        return progress ? [progress] : [];
      })
    );
    if (counts.started) startedTopics += 1;
    if (counts.completed) completedTopics += 1;
  }

  return {
    ...countLessonProgress(lessons, progressRows),
    total_topics: topics.length,
    started_topics: startedTopics,
    in_progress_topics: startedTopics - completedTopics,
    completed_topics: completedTopics,
  };
}
