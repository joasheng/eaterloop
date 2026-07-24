export const hasSupabaseEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

export const hasSupabaseAdminEnv = Boolean(hasSupabaseEnv && process.env.SUPABASE_SERVICE_ROLE_KEY);

export const isDemoMode = !hasSupabaseEnv;

export function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}
