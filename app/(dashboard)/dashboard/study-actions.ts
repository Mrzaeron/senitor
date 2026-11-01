"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthenticatedClient } from "@/lib/supabase/authenticated-client";
import { logSupabaseQueryError } from "@/lib/supabase/diagnostics";

const sessionIdSchema = z.string().uuid();

export type StudyActionResult =
  | { success: true }
  | { success: false; message: string };

function mapStudyActionError(
  operation: string,
  error: { code?: string; message: string }
): StudyActionResult {
  logSupabaseQueryError("study-sessions", operation, error);
  if (error.code === "23505") {
    return {
      success: false,
      message: "A study session is already active. Resume or finish it first.",
    };
  }
  return {
    success: false,
    message: "Study time could not be saved. Please try again.",
  };
}

async function updateStudySession(
  operation: string,
  sessionId: unknown,
  rpcName: "pause_study_session" | "resume_study_session" | "finish_study_session",
  parameterName: "p_session_id"
): Promise<StudyActionResult> {
  const parsedId = sessionIdSchema.safeParse(sessionId);
  if (!parsedId.success) {
    return { success: false, message: "Refresh the page and try again." };
  }

  const { supabase } = await getAuthenticatedClient();
  const { error } = await supabase.rpc(rpcName, {
    [parameterName]: parsedId.data,
  });
  if (error) return mapStudyActionError(operation, error);

  revalidatePath("/dashboard");
  return { success: true };
}

export async function startStudySessionAction(): Promise<StudyActionResult> {
  const { supabase } = await getAuthenticatedClient();
  const { error } = await supabase.rpc("start_study_session");
  if (error) return mapStudyActionError("starting a study session", error);

  revalidatePath("/dashboard");
  return { success: true };
}

export async function pauseStudySessionAction(
  sessionId: unknown
): Promise<StudyActionResult> {
  return updateStudySession(
    "pausing a study session",
    sessionId,
    "pause_study_session",
    "p_session_id"
  );
}

export async function resumeStudySessionAction(
  sessionId: unknown
): Promise<StudyActionResult> {
  return updateStudySession(
    "resuming a study session",
    sessionId,
    "resume_study_session",
    "p_session_id"
  );
}

export async function finishStudySessionAction(
  sessionId: unknown
): Promise<StudyActionResult> {
  return updateStudySession(
    "finishing a study session",
    sessionId,
    "finish_study_session",
    "p_session_id"
  );
}

export async function heartbeatStudySessionAction(
  sessionId: unknown
): Promise<StudyActionResult> {
  const parsedId = sessionIdSchema.safeParse(sessionId);
  if (!parsedId.success) {
    return { success: false, message: "Refresh the page and try again." };
  }

  const { supabase } = await getAuthenticatedClient();
  const { error: staleSessionError } = await supabase.rpc(
    "pause_stale_study_session"
  );
  if (staleSessionError) {
    return mapStudyActionError("checking the active session", staleSessionError);
  }
  const { error } = await supabase.rpc("heartbeat_study_session", {
    p_session_id: parsedId.data,
  });
  if (error) {
    if (error.code === "22023") {
      return {
        success: false,
        message: "The session was paused after inactivity. Resume when ready.",
      };
    }
    return mapStudyActionError("updating the active session", error);
  }
  return { success: true };
}
