"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  getAuthenticatedClient,
  SupabaseAuthenticationError,
} from "@/lib/supabase/authenticated-client";
import { logSupabaseQueryError } from "@/lib/supabase/diagnostics";

export type ProfileActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Full name must be at least 2 characters.")
  .max(100, "Full name cannot exceed 100 characters.");

export async function saveAccountProfileAction(
  _previousState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const parsedName = fullNameSchema.safeParse(formData.get("fullName"));
  if (!parsedName.success) {
    return {
      status: "error",
      message: parsedName.error.issues[0]?.message ?? "Enter a valid full name.",
    };
  }

  let authenticated: Awaited<ReturnType<typeof getAuthenticatedClient>>;
  try {
    authenticated = await getAuthenticatedClient();
  } catch (error) {
    if (error instanceof SupabaseAuthenticationError) {
      return { status: "error", message: "Sign in again to update your profile." };
    }
    throw error;
  }

  const { data, error } = await authenticated.supabase
    .from("profiles")
    .update({ full_name: parsedName.data })
    .eq("id", authenticated.userId)
    .select("id")
    .maybeSingle();

  if (error) {
    logSupabaseQueryError("profile", "saving the account name", error);
    return { status: "error", message: "Your profile could not be saved." };
  }
  if (!data) {
    return { status: "error", message: "Your profile could not be found." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Profile updated." };
}

const avatarPathSchema = z
  .string()
  .regex(
    /^[0-9a-f-]{36}\/avatar-[0-9a-f-]{36}\.(jpg|png|webp)$/,
    "Choose a valid avatar image."
  );

export async function saveAvatarPathAction(
  avatarPath: string
): Promise<ProfileActionState> {
  const parsedPath = avatarPathSchema.safeParse(avatarPath);
  if (!parsedPath.success) {
    return { status: "error", message: "Choose a valid avatar image." };
  }

  let authenticated: Awaited<ReturnType<typeof getAuthenticatedClient>>;
  try {
    authenticated = await getAuthenticatedClient();
  } catch (error) {
    if (error instanceof SupabaseAuthenticationError) {
      return { status: "error", message: "Sign in again to update your photo." };
    }
    throw error;
  }

  if (!parsedPath.data.startsWith(`${authenticated.userId}/`)) {
    return { status: "error", message: "You can only update your own photo." };
  }

  const { data: current, error: readError } = await authenticated.supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", authenticated.userId)
    .maybeSingle();
  if (readError) {
    logSupabaseQueryError("profile", "loading the current avatar", readError);
    return { status: "error", message: "Your profile could not be updated." };
  }
  if (!current) {
    return { status: "error", message: "Your profile could not be found." };
  }

  const { error } = await authenticated.supabase
    .from("profiles")
    .update({ avatar_path: parsedPath.data })
    .eq("id", authenticated.userId);

  if (error) {
    logSupabaseQueryError("profile", "saving the profile photo", error);
    return { status: "error", message: "Your photo could not be saved." };
  }

  let message = "Profile photo updated.";
  if (current.avatar_path && current.avatar_path !== parsedPath.data) {
    const { error: removeError } = await authenticated.supabase.storage
      .from("avatars")
      .remove([current.avatar_path]);
    if (removeError) {
      logSupabaseQueryError("profile", "removing the previous avatar", removeError);
      message = "Photo updated. The previous image could not be removed.";
    }
  }

  revalidatePath("/", "layout");
  return { status: "success", message };
}
