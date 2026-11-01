export type StudySessionStatus = "running" | "paused";

export interface ActiveStudySession {
  id: string;
  status: StudySessionStatus;
  elapsedSeconds: number;
}

export interface DailyStudySummary {
  todaySeconds: number;
  activeSession: ActiveStudySession | null;
}
