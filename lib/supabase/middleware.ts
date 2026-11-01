import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import {
  createTimedSupabaseFetch,
  logSupabaseQueryError,
} from "@/lib/supabase/diagnostics";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const config = getSupabaseConfig();
  const pathname = request.nextUrl.pathname;
  const protectedRoutes = [
    "/dashboard",
    "/learn",
    "/practice",
    "/ai-tutor",
    "/problems",
    "/progress",
    "/profile",
    "/onboarding",
  ];
  const isWithinRoute = (route: string) =>
    pathname === route || pathname.startsWith(`${route}/`);
  const isProtectedRoute = protectedRoutes.some(isWithinRoute);
  const isAuthRoute = ["/login", "/signup", "/forgot-password"].some(
    isWithinRoute
  );

  if (!config) {
    if (!isProtectedRoute) {
      return supabaseResponse;
    }

    return new NextResponse(
      "Authentication is not configured. Set NEXT_PUBLIC_SUPABASE_URL and a Supabase publishable or anon key.",
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "text/plain; charset=utf-8",
        },
      }
    );
  }

  const supabase = createServerClient(config.url, config.key, {
    global: {
      fetch: createTimedSupabaseFetch("proxy"),
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Keep the user lookup immediately after client creation so Supabase can refresh the session.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    logSupabaseQueryError("auth-proxy", "verifying the current user", userError);
  }

  const withSessionCookies = (response: NextResponse) => {
    for (const cookie of supabaseResponse.cookies.getAll()) {
      response.cookies.set(cookie);
    }
    return response;
  };

  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    url.hash = "";
    return withSessionCookies(NextResponse.redirect(url));
  };

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("redirect", pathname);
    return withSessionCookies(NextResponse.redirect(url));
  }

  if (!user || (!isProtectedRoute && !isAuthRoute)) {
    return supabaseResponse;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    logSupabaseQueryError("auth-proxy", "checking onboarding status", error);
    return withSessionCookies(
      new NextResponse(
        "Unable to verify your onboarding status. Please try again later.",
        {
          status: 503,
          headers: {
            "Cache-Control": "no-store",
            "Content-Type": "text/plain; charset=utf-8",
          },
        }
      )
    );
  }

  const onboardingComplete = profile?.onboarding_completed === true;

  if (isAuthRoute) {
    return redirectTo(onboardingComplete ? "/dashboard" : "/onboarding");
  }

  if (pathname === "/onboarding" || pathname.startsWith("/onboarding/")) {
    if (onboardingComplete) {
      return redirectTo("/dashboard");
    }
  } else if (!onboardingComplete) {
    return redirectTo("/onboarding");
  }

  return supabaseResponse;
}
