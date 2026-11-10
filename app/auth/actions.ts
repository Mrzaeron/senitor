"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  onboardingSchema,
  type LoginInput,
  type SignupInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type OnboardingInput,
} from "@/lib/validations/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { cache } from "react";
import {
  getAuthenticatedClient,
  SupabaseAuthenticationError,
} from "@/lib/supabase/authenticated-client";
import { logSupabaseQueryError } from "@/lib/supabase/diagnostics";
import type { AccountProfileData } from "@/types/user";

export interface ActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
  message?: string;
}

/**
 * Log in with email and password
 */
export async function loginAction(data: LoginInput): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error:
        "Supabase credentials are not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.",
    };
  }

  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input data",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  // Check onboarding status
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    logSupabaseQueryError("authentication", "loading the signed-in user", userError);
    return {
      success: false,
      error: "Your session could not be verified. Please try signing in again.",
    };
  }
  if (!user) {
    return {
      success: false,
      error: "Your session could not be verified. Please try signing in again.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    logSupabaseQueryError("authentication", "checking onboarding status", profileError);
    return {
      success: false,
      error: "Your account setup could not be verified. Please try again.",
    };
  }

  if (!profile?.onboarding_completed) {
    return {
      success: true,
      data: { redirectTo: "/onboarding" },
    };
  }

  revalidatePath("/", "layout");
  return {
    success: true,
    data: { redirectTo: "/dashboard" },
  };
}

/**
 * Sign up with email, password, and full name
 */
export async function signupAction(data: SignupInput): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error:
        "Supabase credentials are not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.",
    };
  }

  const parsed = signupSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input data",
    };
  }

  const headerList = await headers();
  const origin = headerList.get("origin") || "http://localhost:3000";

  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
      },
      emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
    },
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  // If Supabase has email confirmation disabled, user session is active immediately
  if (authData.session) {
    revalidatePath("/", "layout");
    return {
      success: true,
      message: "Account created successfully!",
      data: { redirectTo: "/onboarding" },
    };
  }

  // If email verification is enabled:
  return {
    success: true,
    message:
      "Please check your email to verify your account and activate your Senitor access.",
    data: { requiresVerification: true },
  };
}

/**
 * Send password reset email
 */
export async function forgotPasswordAction(
  data: ForgotPasswordInput
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error:
        "Supabase credentials are not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.",
    };
  }

  const parsed = forgotPasswordSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid email address",
    };
  }

  const headerList = await headers();
  const origin = headerList.get("origin") || "http://localhost:3000";

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message:
      "A password reset link has been dispatched to your email address if an account exists.",
  };
}

/**
 * Reset password with new password
 */
export async function resetPasswordAction(
  data: ResetPasswordInput
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error:
        "Supabase credentials are not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.",
    };
  }

  const parsed = resetPasswordSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid password",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  revalidatePath("/", "layout");
  return {
    success: true,
    message: "Your password has been successfully updated. Redirecting to dashboard...",
    data: { redirectTo: "/dashboard" },
  };
}

/**
 * Log out user
 */
export async function logoutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/login");
}

/**
 * Complete onboarding and save to profile
 */
export async function submitOnboardingAction(
  data: OnboardingInput
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error:
        "Supabase credentials are not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.",
    };
  }

  const parsed = onboardingSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid onboarding answers",
    };
  }

  let authenticated: Awaited<ReturnType<typeof getAuthenticatedClient>>;
  try {
    authenticated = await getAuthenticatedClient();
  } catch (error) {
    if (error instanceof SupabaseAuthenticationError) {
      return {
        success: false,
        error: "You must be signed in to complete account setup.",
      };
    }
    throw error;
  }

  const { error: upsertError } = await authenticated.supabase
    .from("profiles")
    .upsert({
      id: authenticated.userId,
      full_name: parsed.data.fullName,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    });

  if (upsertError) {
    logSupabaseQueryError("profile", "completing onboarding", upsertError);
    return {
      success: false,
      error: "Your account setup could not be saved. Please try again.",
    };
  }

  revalidatePath("/", "layout");
  return {
    success: true,
    message: "Profile ready! Redirecting to dashboard...",
    data: { redirectTo: "/dashboard" },
  };
}

/**
 * Get current user profile
 */
const readUserProfile = cache(async (): Promise<AccountProfileData | null> => {
  let authenticated: Awaited<ReturnType<typeof getAuthenticatedClient>>;
  try {
    authenticated = await getAuthenticatedClient();
  } catch (error) {
    if (error instanceof SupabaseAuthenticationError) return null;
    throw error;
  }

  const { data: profile, error } = await authenticated.supabase
    .from("profiles")
    .select("id, full_name, avatar_path, created_at")
    .eq("id", authenticated.userId)
    .maybeSingle();

  if (error) {
    logSupabaseQueryError("profile", "loading the current profile", error);
    throw new Error("Profile settings could not be loaded. Please try again.");
  }

  if (!profile) return null;

  const email = authenticated.user.email ?? "";
  const metadataUsername = authenticated.user.user_metadata?.username;
  return {
    ...profile,
    email,
    username:
      typeof metadataUsername === "string" && metadataUsername.trim()
        ? metadataUsername.trim()
        : email.split("@")[0] || "Student",
  } as AccountProfileData;
});

export async function getUserProfile(): Promise<AccountProfileData | null> {
  return readUserProfile();
}
