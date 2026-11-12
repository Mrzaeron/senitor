import "server-only";

export type TutorMode = "learn" | "hint" | "debug" | "practice" | "explain";

export type TutorMessage = {
  role: "user" | "assistant";
  content: string;
};

export class AIProviderConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIProviderConfigurationError";
  }
}

export class AIProviderRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIProviderRequestError";
  }
}

type ProviderResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

function providerConfig() {
  const apiKey = process.env.AI_PROVIDER_API_KEY?.trim();
  const model = process.env.AI_MODEL_NAME?.trim();
  const baseUrl = (
    process.env.AI_PROVIDER_BASE_URL?.trim() || "https://api.openai.com/v1"
  ).replace(/\/+$/, "");

  if (!apiKey || !model) {
    throw new AIProviderConfigurationError(
      "AI Tutor is not configured. Set AI_PROVIDER_API_KEY and AI_MODEL_NAME on the server."
    );
  }

  return { apiKey, model, baseUrl };
}

export async function generateTutorReply(
  messages: TutorMessage[],
  context: string
): Promise<string> {
  const { apiKey, model, baseUrl } = providerConfig();
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens: 900,
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
    signal: AbortSignal.timeout(30_000),
  });

  const payload = (await response.json()) as ProviderResponse;
  if (!response.ok) {
    throw new AIProviderRequestError(
      payload.error?.message || "The AI provider could not answer right now."
    );
  }

  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new AIProviderRequestError("The AI provider returned an empty response.");
  }
  return content;
}
