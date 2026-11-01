import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createTimedSupabaseFetch } from "@/lib/supabase/diagnostics";

export async function createClient() {
  const cookieStore = await cookies();
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and a Supabase publishable or anon key."
    );
  }

  return createServerClient(config.url, config.key, {
    global: {
      fetch: createTimedSupabaseFetch("server"),
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have a proxy/middleware refreshing
          // user sessions.
        }
      },
    },
  });
}
