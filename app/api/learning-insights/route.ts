import { NextResponse, type NextRequest } from "next/server";
import {
  getLearningInsights,
  LearningInsightsError,
} from "@/lib/learning/insights";
import {
  SupabaseAuthenticationError,
} from "@/lib/supabase/authenticated-client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET(request: NextRequest) {
  const problemId = request.nextUrl.searchParams.get("problemId");
  if (
    problemId &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      problemId
    )
  ) {
    return errorResponse("Choose a valid problem to get learning insights.", 400);
  }
  if (!isSupabaseConfigured()) {
    return errorResponse("Learning insights are not configured on this server.", 503);
  }

  try {
    const insights = await getLearningInsights(problemId ?? undefined);
    return NextResponse.json(
      {
        syntheticDemo: true,
        ...insights,
        probability: insights.prediction.probability,
        model: insights.prediction.model,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof SupabaseAuthenticationError) {
      return errorResponse("Sign in to view your learning insights.", 401);
    }
    if (error instanceof LearningInsightsError) {
      return errorResponse(error.message, 500);
    }
    throw error;
  }
}
