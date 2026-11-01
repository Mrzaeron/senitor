"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  completeLesson,
  LearningProgressError,
  recordLessonVisit,
} from "@/lib/learning/progress";
import type { LessonProgressStatus } from "@/types/learning-progress";

const lessonIdSchema = z.string().uuid();

export type LessonProgressActionResult =
  | { success: true; status: LessonProgressStatus }
  | { success: false; error: string };

export async function recordLessonVisitAction(
  lessonId: string
): Promise<LessonProgressActionResult> {
  const parsed = lessonIdSchema.safeParse(lessonId);
  if (!parsed.success) {
    return { success: false, error: "This lesson is unavailable." };
  }

  try {
    const progress = await recordLessonVisit(parsed.data);
    revalidatePath("/dashboard");
    return { success: true, status: progress.status };
  } catch (error) {
    if (error instanceof LearningProgressError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}

export async function completeLessonAction(
  lessonId: string
): Promise<LessonProgressActionResult> {
  const parsed = lessonIdSchema.safeParse(lessonId);
  if (!parsed.success) {
    return { success: false, error: "This lesson is unavailable." };
  }

  try {
    const progress = await completeLesson(parsed.data);
    revalidatePath("/dashboard");
    revalidatePath("/learn");
    revalidatePath("/learn/[topicSlug]", "page");
    revalidatePath("/learn/[topicSlug]/[subtopicSlug]", "page");
    return { success: true, status: progress.status };
  } catch (error) {
    if (error instanceof LearningProgressError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}
