export type SupabaseDiagnosticError = {
  code?: string;
  message: string;
};

export function logSupabaseQueryError(
  scope: string,
  operation: string,
  error: SupabaseDiagnosticError
) {
  if (process.env.NODE_ENV !== "development") return;

  console.error(`[${scope}] ${operation} failed`, {
    code: error.code ?? "unknown",
    message: error.message,
  });
}

export function createTimedSupabaseFetch(scope: string): typeof fetch {
  if (process.env.NODE_ENV !== "development") return fetch;

  return async (input, init) => {
    const startedAt = performance.now();
    const requestUrl = input instanceof Request ? input.url : input.toString();
    let pathname = "/unknown";

    try {
      pathname = new URL(requestUrl).pathname;
    } catch {
      // Keep diagnostic output free of malformed or unexpected request URLs.
    }

    const method = init?.method ?? (input instanceof Request ? input.method : "GET");

    try {
      const response = await fetch(input, init);
      console.info(
        `[supabase:${scope}] ${method} ${pathname} ${response.status} ${Math.round(
          performance.now() - startedAt
        )}ms`
      );
      return response;
    } catch (error) {
      console.error(
        `[supabase:${scope}] ${method} ${pathname} request failed`,
        {
          durationMs: Math.round(performance.now() - startedAt),
          error:
            error instanceof Error
              ? { name: error.name, message: error.message }
              : "Unknown transport error",
        }
      );
      throw error;
    }
  };
}
