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
import {
  getAuthenticatedClient,
  SupabaseAuthenticationError,
} from "@/lib/supabase/authenticated-client";

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
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.onboarding_completed) {
      return {
        success: true,
        data: { redirectTo: "/onboarding" },
      };
    }
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

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: "You must be logged in to complete onboarding.",
    };
  }

  // Upsert profile for the authenticated user ID (never trust client-supplied ID!)
  const { error: upsertError } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: parsed.data.fullName,
    programming_language: parsed.data.programmingLanguage,
    programming_experience: parsed.data.programmingExperience,
    dsa_experience: parsed.data.dsaExperience,
    learning_goal: parsed.data.learningGoal,
    daily_study_target: parsed.data.dailyStudyTarget,
    onboarding_completed: true,
    updated_at: new Date().toISOString(),
  });

  if (upsertError) {
    return {
      success: false,
      error: `Failed to save onboarding profile: ${upsertError.message}`,
    };
  }

  revalidatePath("/", "layout");
  return {
    success: true,
    message: "Personalized roadmap created! Redirecting to dashboard...",
    data: { redirectTo: "/dashboard" },
  };
}

/**
 * Get current user profile
 */
export async function getUserProfile() {
  let supabase: Awaited<ReturnType<typeof createClient>>;
  let userId: string;
  try {
    const authenticated = await getAuthenticatedClient();
    supabase = authenticated.supabase;
    userId = authenticated.userId;
  } catch (error) {
    if (error instanceof SupabaseAuthenticationError) return null;
    throw error;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, full_name, programming_language, dsa_experience, learning_goal, daily_study_target, onboarding_completed"
    )
    .eq("id", userId)
    .single();

  return profile;
}
