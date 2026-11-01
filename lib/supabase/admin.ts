import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";

export function createAdminClient() {
  const config = getSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!config || !serviceRoleKey) {
    throw new Error(
      "Server-side Supabase administration is not configured."
    );
  }

  return createSupabaseClient(config.url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
