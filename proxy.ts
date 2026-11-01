import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const startedAt = performance.now();
  const response = await updateSession(request);

  if (process.env.NODE_ENV === "development") {
    console.info(
      `[navigation] proxy ${request.nextUrl.pathname} ${response.status} ${Math.round(
        performance.now() - startedAt
      )}ms`
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap, robots, etc.
     * - public folder files (.svg, .png, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
