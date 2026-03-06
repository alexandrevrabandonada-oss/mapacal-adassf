const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabasePublishableKey);
}

export function getSupabaseUrl(): string {
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL não configurada");
  }
  return supabaseUrl;
}

export function getSupabasePublishableKey(): string {
  if (!supabasePublishableKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY não configurada");
  }
  return supabasePublishableKey;
}

export function getSupabaseUrlSafe(): string | null {
  return supabaseUrl || null;
}

export function getSupabasePublishableKeySafe(): string | null {
  return supabasePublishableKey || null;
}
