import { getSupabaseConfig } from "@/lib/supabase/config";

export function getAvatarUrl(path: string | null): string | undefined {
  const config = getSupabaseConfig();
  if (!config || !path) return undefined;
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `${config.url}/storage/v1/object/public/avatars/${encodedPath}`;
}
