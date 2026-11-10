export type ProgrammingLanguage = "cpp" | "python" | "java";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export type LearningGoal =
  | "interview_prep"
  | "competitive_programming"
  | "academic_exams"
  | "core_mastery";

export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_path: string | null;
  programming_language: ProgrammingLanguage | null;
  programming_experience: ExperienceLevel | null;
  dsa_experience: ExperienceLevel | null;
  learning_goal: LearningGoal | null;
  daily_study_target: number | null; // in minutes per day (e.g., 15, 30, 45, 60)
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountProfileData {
  id: string;
  full_name: string | null;
  avatar_path: string | null;
  created_at: string;
  email: string;
  username: string;
}

export interface OnboardingFormValues {
  fullName: string;
  programmingLanguage: ProgrammingLanguage;
  programmingExperience: ExperienceLevel;
  dsaExperience: ExperienceLevel;
  learningGoal: LearningGoal;
  dailyStudyTarget: number;
}
