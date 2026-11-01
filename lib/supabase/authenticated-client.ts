import "server-only";

import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { logSupabaseQueryError } from "@/lib/supabase/diagnostics";

type AuthenticatedClient = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  user: User;
};

export class SupabaseAuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseAuthenticationError";
  }
}

export const getAuthenticatedClient = cache(
  async (): Promise<AuthenticatedClient> => {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      logSupabaseQueryError("authentication", "verifying the current user", error);
      throw new SupabaseAuthenticationError(
        "Your session could not be verified. Sign in again and retry."
      );
    }

    if (!data.user) {
      throw new SupabaseAuthenticationError(
        "Sign in to access your SENITOR account."
      );
    }

    return { supabase, userId: data.user.id, user: data.user };
  }
);
