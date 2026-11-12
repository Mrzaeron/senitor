import { NextResponse, type NextRequest } from "next/server";
import {
  AIProviderConfigurationError,
  AIProviderRequestError,
  generateTutorReply,
  type AIProviderErrorCategory,
  type TutorMessage,
  type TutorMode,
} from "@/lib/ai/provider";
import { SupabaseAuthenticationError } from "@/lib/supabase/authenticated-client";
import { getAuthenticatedClient } from "@/lib/supabase/authenticated-client";
import { getLearningInsights } from "@/lib/learning/insights";

const modes = new Set<TutorMode>(["learn", "hint", "debug", "practice", "explain"]);
const maxMessageLength = 4000;
const maxHistoryLength = 12;
const learningContextTimeoutMs = 3000;

type TutorRequest = {
  mode?: TutorMode;
  message?: string;
  history?: TutorMessage[];
  currentTopic?: string;
};

function responseError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

function validHistory(history: unknown): history is TutorMessage[] {
  return (
    Array.isArray(history) &&
    history.length <= maxHistoryLength &&
    history.every(
      (item) =>
        item &&
        typeof item === "object" &&
        ("role" in item && item.role === "user" || "role" in item && item.role === "assistant") &&
        "content" in item &&
        typeof item.content === "string" &&
        item.content.length <= maxMessageLength
    )
  );
}

async function loadLearningContext() {
  return Promise.race([
    getLearningInsights().catch(() => null),
    new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), learningContextTimeoutMs)
    ),
  ]);
}

export async function POST(request: NextRequest) {
  let body: TutorRequest;
  try {
    body = (await request.json()) as TutorRequest;
  } catch {
    return responseError("Send a valid tutor message.", 400);
  }

  const message = body.message?.trim();
  if (!message || message.length > maxMessageLength) {
    return responseError("Tutor messages must contain 1 to 4,000 characters.", 400);
  }
  if (!body.mode || !modes.has(body.mode)) {
    return responseError("Choose a valid teaching mode.", 400);
  }
  if (!validHistory(body.history ?? [])) {
    return responseError("Tutor message history is invalid.", 400);
  }

  let authenticated: Awaited<ReturnType<typeof getAuthenticatedClient>>;
  try {
    authenticated = await getAuthenticatedClient();
  } catch (error) {
    if (error instanceof SupabaseAuthenticationError) {
      return responseError("Sign in to use the AI Tutor.", 401);
    }
    throw error;
  }

  let context = `Teaching mode: ${body.mode}.`;
  if (body.currentTopic?.trim()) context += ` Current curriculum topic: ${body.currentTopic.trim()}.`;

  const [profileResult, insightsResult] = await Promise.all([
    authenticated.supabase
      .from("profiles")
      .select("programming_language")
      .eq("id", authenticated.userId)
      .maybeSingle(),
    loadLearningContext(),
  ]);
  if (profileResult.error) {
    return responseError("Your tutor context could not be loaded. Please try again.", 500);
  }

  const language = profileResult.data?.programming_language;
  if (language) context += ` Preferred programming language: ${language}.`;
  if (insightsResult) {
    const weakTopics = insightsResult.weakTopics.slice(0, 3).map((topic) => topic.name);
    if (weakTopics.length) context += ` Topics needing practice: ${weakTopics.join(", ")}.`;
    context += ` Recent judged submissions: ${insightsResult.analytics.judgedSubmissions}; overall accuracy: ${Math.round(insightsResult.analytics.accuracy * 100)}%.`;
  }

  try {
    const reply = await generateTutorReply(
      [...(body.history ?? []), { role: "user", content: message }],
      context
    );
    return NextResponse.json(
      { reply },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof AIProviderConfigurationError) return responseError(error.message, 503);
    if (error instanceof AIProviderRequestError) {
      const status =
        error.category === "timeout"
          ? 504
          : error.category === "authentication"
            ? 502
            : error.category === "quota"
              ? 429
              : error.category === "invalid_model" || error.category === "invalid_request"
                ? 502
                : 503;
      return NextResponse.json(
        { error: error.message, category: error.category satisfies AIProviderErrorCategory },
        { status, headers: { "Cache-Control": "no-store" } }
      );
    }
    throw error;
  }
}
