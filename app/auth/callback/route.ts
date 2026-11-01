import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next");
  const next =
    requestedNext &&
    requestedNext.startsWith("/") &&
    !requestedNext.startsWith("//") &&
    !requestedNext.includes("\\")
      ? new URL(requestedNext, requestUrl)
      : new URL("/dashboard", requestUrl);

  if (next.origin !== requestUrl.origin) {
    next.pathname = "/dashboard";
    next.search = "";
    next.hash = "";
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(
      new URL(
        "/login?error=Supabase%20authentication%20is%20not%20configured",
        requestUrl
      )
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user has completed onboarding
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
          return NextResponse.redirect(new URL("/onboarding", request.url));
        }
      }

      return NextResponse.redirect(next);
    }
  }

  // Return the user to an error page or login with notification
  return NextResponse.redirect(
    new URL("/login?error=Could%20not%20verify%20authentication%20code", request.url)
  );
}
