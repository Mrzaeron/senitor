import "server-only";

import { getAuthenticatedClient } from "@/lib/supabase/authenticated-client";
import { logSupabaseQueryError } from "@/lib/supabase/diagnostics";
import type { DailyStudySummary } from "@/types/study";

type StudySegment = {
  session_id: string;
  started_at: string;
  ended_at: string | null;
};

const staleHeartbeatLimitMs = 90_000;

function throwStudyQueryError(
  operation: string,
  error: { code?: string; message: string }
): never {
  logSupabaseQueryError("study-sessions", operation, error);
  throw new Error("Study time could not be loaded. Please try again.");
}

function secondsBetweenSegments(
  segments: StudySegment[],
  startBoundary: number,
  endBoundary: number,
  now: number
): number {
  return segments.reduce((total, segment) => {
    const start = Math.max(Date.parse(segment.started_at), startBoundary);
    const rawEnd = segment.ended_at ? Date.parse(segment.ended_at) : now;
    const end = Math.min(rawEnd, endBoundary, now);
    return total + Math.max(0, Math.floor((end - start) / 1000));
  }, 0);
}

export async function getDailyStudySummary(): Promise<DailyStudySummary> {
  const { supabase, userId } = await getAuthenticatedClient();
  const now = new Date();
  const todayStart = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;
  const todayStartIso = new Date(todayStart).toISOString();
  const tomorrowStartIso = new Date(tomorrowStart).toISOString();

  const [activeResult, todaySegmentsResult] = await Promise.all([
    supabase
      .from("study_sessions")
      .select("id, status, last_heartbeat_at")
      .eq("user_id", userId)
      .in("status", ["running", "paused"])
      .maybeSingle(),
    supabase
      .from("study_session_segments")
      .select("session_id, started_at, ended_at")
      .eq("user_id", userId)
      .lt("started_at", tomorrowStartIso)
      .or(`ended_at.is.null,ended_at.gt.${todayStartIso}`),
  ]);

  if (activeResult.error) {
    throwStudyQueryError("loading the active study session", activeResult.error);
  }
  if (todaySegmentsResult.error) {
    throwStudyQueryError("loading today's study time", todaySegmentsResult.error);
  }

  const nowMillis = now.getTime();
  const activeSession = activeResult.data;
  const isStale =
    activeSession?.status === "running" &&
    activeSession.last_heartbeat_at !== null &&
    Date.parse(activeSession.last_heartbeat_at) + staleHeartbeatLimitMs <=
      nowMillis;

  if (isStale) {
    const { error } = await supabase.rpc("pause_stale_study_session");
    if (error) {
      throwStudyQueryError("pausing an abandoned session", error);
    }
  }

  const segmentsForToday = (todaySegmentsResult.data ?? []) as StudySegment[];
  if (isStale && activeSession) {
    const lastHeartbeat = activeSession.last_heartbeat_at;
    if (!lastHeartbeat) {
      throw new Error("The active study session could not be reconciled.");
    }
    const staleEnd = new Date(
      Date.parse(lastHeartbeat) + staleHeartbeatLimitMs
    ).toISOString();
    for (const segment of segmentsForToday) {
      if (segment.session_id === activeSession.id && segment.ended_at === null) {
        segment.ended_at = staleEnd;
      }
    }
  }

  const todaySeconds = secondsBetweenSegments(
    segmentsForToday,
    todayStart,
    tomorrowStart,
    nowMillis
  );
  if (!activeSession) return { todaySeconds, activeSession: null };

  const { data: segments, error: segmentsError } = await supabase
    .from("study_session_segments")
    .select("session_id, started_at, ended_at")
    .eq("user_id", userId)
    .eq("session_id", activeSession.id);

  if (segmentsError) {
    throwStudyQueryError("loading the active session duration", segmentsError);
  }

  return {
    todaySeconds,
    activeSession: {
      id: activeSession.id,
      status: isStale ? "paused" : (activeSession.status as "running" | "paused"),
      elapsedSeconds: secondsBetweenSegments(
        (segments ?? []) as StudySegment[],
        0,
        nowMillis,
        nowMillis
      ),
    },
  };
}
