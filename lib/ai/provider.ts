import "server-only";

export type TutorMode = "learn" | "hint" | "debug" | "practice" | "explain";

export type TutorMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AIProviderErrorCategory =
  | "authentication"
  | "quota"
  | "invalid_model"
  | "invalid_request"
  | "timeout"
  | "provider_failure";

export class AIProviderConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIProviderConfigurationError";
  }
}

export class AIProviderRequestError extends Error {
  readonly category: AIProviderErrorCategory;
  readonly status: number | null;

  constructor(
    message: string,
    category: AIProviderErrorCategory,
    status: number | null = null
  ) {
    super(message);
    this.name = "AIProviderRequestError";
    this.category = category;
    this.status = status;
  }
}

type ProviderResponse = {
  choices?: Array<{
    message?: { content?: string | Array<{ type?: string; text?: string }> };
  }>;
  error?: { message?: string };
};

function redactProviderBody(value: string): string {
  return value
    .replace(
      /(["']?(?:api[_-]?key|authorization|access[_-]?token|refresh[_-]?token)["']?\s*:\s*["'])[^"']+(["'])/gi,
      "$1[REDACTED]$2"
    )
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]")
    .replace(
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
      "[REDACTED_EMAIL]"
    )
    .slice(0, 2000);
}

function providerCategory(
  status: number | null,
  message: string
): AIProviderErrorCategory {
  if (status === 401 || status === 403) return "authentication";
  if (status === 429) return "quota";
  if (status === 404 || /model/i.test(message) && /not found|unknown|invalid/i.test(message)) {
    return "invalid_model";
  }
  if (status === 400 || status === 422) return "invalid_request";
  return "provider_failure";
}

function publicProviderMessage(
  category: AIProviderErrorCategory
): string {
  switch (category) {
    case "authentication":
      return "The Gemini API key was rejected. Check the server-side AI_PROVIDER_API_KEY.";
    case "quota":
      return "The Gemini API quota or rate limit was reached. Try again later.";
    case "invalid_model":
      return "The configured Gemini model is unavailable. Check AI_MODEL_NAME.";
    case "invalid_request":
      return "Gemini rejected the tutor request. Check the model and request configuration.";
    case "timeout":
      return "Gemini did not respond before the timeout. Please try again.";
    default:
      return "Gemini could not answer the tutor request. Check the server logs for details.";
  }
}

function providerConfig() {
  const values = {
    AI_PROVIDER_API_KEY: process.env.AI_PROVIDER_API_KEY?.trim(),
    AI_MODEL_NAME: process.env.AI_MODEL_NAME?.trim(),
    AI_PROVIDER_BASE_URL: process.env.AI_PROVIDER_BASE_URL?.trim(),
  };
  const missing = Object.entries(values)
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length > 0) {
    throw new AIProviderConfigurationError(
      `AI Tutor is not configured. Missing server environment variable${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}. Configure the Gemini OpenAI-compatible endpoint at https://generativelanguage.googleapis.com/v1beta/openai/.`
    );
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(values.AI_PROVIDER_BASE_URL!);
  } catch {
    throw new AIProviderConfigurationError(
      "AI_PROVIDER_BASE_URL must be a valid HTTPS URL for the provider's OpenAI-compatible API."
    );
  }
  if (baseUrl.protocol !== "https:" || baseUrl.username || baseUrl.password) {
    throw new AIProviderConfigurationError(
      "AI_PROVIDER_BASE_URL must be a valid HTTPS URL without embedded credentials."
    );
  }

  return {
    apiKey: values.AI_PROVIDER_API_KEY!,
    model: values.AI_MODEL_NAME!,
    baseUrl: baseUrl.toString().replace(/\/+$/, ""),
  };
}

export async function generateTutorReply(
  messages: TutorMessage[],
  context: string
): Promise<string> {
  const { apiKey, model, baseUrl } = providerConfig();
  const startedAt = Date.now();
  const endpoint = `${baseUrl}/chat/completions`;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 900,
        reasoning_effort: "low",
        messages: [
          {
            role: "system",
            content: [
              "You are SENITOR's DSA tutor. Teach accurately and encourage understanding.",
              "Stay focused on data structures, algorithms, complexity, code debugging, and practice.",
              "Never claim to have executed code or accessed data you were not given.",
              "For hints, give incremental hints and do not reveal the complete solution.",
              "For debugging, identify the likely issue, explain why, and suggest a focused fix.",
              "When code is requested, provide both C++ and Python when practical.",
              "Use concise Markdown with clear steps.",
              context,
            ].join("\n\n"),
          },
          ...messages,
        ],
      }),
      signal: AbortSignal.timeout(60_000),
    });
    const responseBody = await response.text();
    const redactedBody = redactProviderBody(responseBody);
    if (!response.ok) {
      console.error("[ai-provider] Gemini response", {
        status: response.status,
        durationMs: Date.now() - startedAt,
        errorType: "HTTPError",
        body: redactedBody,
        endpoint,
        model,
      });
    }

    let payload: ProviderResponse = {};
    try {
      payload = JSON.parse(responseBody) as ProviderResponse;
    } catch {
      if (!response.ok) {
        const category = providerCategory(response.status, responseBody);
        throw new AIProviderRequestError(
          publicProviderMessage(category),
          category,
          response.status
        );
      }
    }

    if (!response.ok) {
      const providerMessage = payload.error?.message || responseBody;
      const category = providerCategory(response.status, providerMessage);
      throw new AIProviderRequestError(
        publicProviderMessage(category),
        category,
        response.status
      );
    }

    const rawContent = payload.choices?.[0]?.message?.content;
    const content =
      typeof rawContent === "string"
        ? rawContent.trim()
        : rawContent
            ?.filter((part) => part.type === "text" && part.text)
            .map((part) => part.text ?? "")
            .join("")
            .trim();
    if (!content) {
      throw new AIProviderRequestError(
        "Gemini returned no tutor content.",
        "provider_failure",
        response.status
      );
    }
    return content;
  } catch (error) {
    if (error instanceof AIProviderRequestError) throw error;
    const isTimeout =
      error instanceof DOMException && error.name === "TimeoutError" ||
      error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");
    const category = isTimeout ? "timeout" : "provider_failure";
    console.error("[ai-provider] Gemini request failed", {
      status: null,
      durationMs: Date.now() - startedAt,
      errorType: error instanceof Error ? error.name : "UnknownError",
      body: error instanceof Error ? redactProviderBody(error.message) : "[REDACTED]",
      endpoint,
      model,
    });
    throw new AIProviderRequestError(
      publicProviderMessage(category),
      category
    );
  }
}
