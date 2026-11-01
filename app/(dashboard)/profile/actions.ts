"use server";

import { revalidatePath } from "next/cache";
import {
  getAuthenticatedClient,
  SupabaseAuthenticationError,
} from "@/lib/supabase/authenticated-client";
import { logSupabaseQueryError } from "@/lib/supabase/diagnostics";
import { profileSettingsSchema } from "@/lib/validations/auth";

export type ProfileActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function saveProfileSettingsAction(
  _previousState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const parsed = profileSettingsSchema.safeParse({
    programmingLanguage: formData.get("programmingLanguage"),
    experienceLevel: formData.get("experienceLevel"),
    learningGoal: formData.get("learningGoal"),
    dailyStudyTarget: formData.get("dailyStudyTarget"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the submitted settings.",
    };
  }

  let supabase: Awaited<
    ReturnType<typeof getAuthenticatedClient>
  >["supabase"];
  let userId: string;
  try {
    const authenticated = await getAuthenticatedClient();
    supabase = authenticated.supabase;
    userId = authenticated.userId;
  } catch (error) {
    if (error instanceof SupabaseAuthenticationError) {
      return { status: "error", message: "Sign in again to update your profile." };
    }
    throw error;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      programming_language: parsed.data.programmingLanguage,
      programming_experience: parsed.data.experienceLevel,
      dsa_experience: parsed.data.experienceLevel,
      learning_goal: parsed.data.learningGoal,
      daily_study_target: parsed.data.dailyStudyTarget,
    })
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    logSupabaseQueryError("profile", "saving profile settings", error);
    return {
      status: "error",
      message: "Your settings could not be saved. Please try again.",
    };
  }

  if (!data) {
    return {
      status: "error",
      message: "Your profile could not be found. Refresh and try again.",
    };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { status: "success", message: "Your learning settings were saved." };
}
