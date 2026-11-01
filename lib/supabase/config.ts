export interface SupabaseConfig {
  url: string;
  key: string;
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  if (!url || !key) return null;
  if (
    /placeholder|your-project/i.test(url) ||
    /placeholder|your[-_ ]?key/i.test(key) ||
    key === "******"
  ) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    if (
      (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") ||
      !parsedUrl.hostname ||
      parsedUrl.username ||
      parsedUrl.password ||
      parsedUrl.pathname !== "/" ||
      parsedUrl.search ||
      parsedUrl.hash
    ) {
      return null;
    }
  } catch {
    return null;
  }

  return { url: new URL(url).origin, key };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}
