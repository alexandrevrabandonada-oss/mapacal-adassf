import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublishableKeySafe, getSupabaseUrlSafe } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createSupabaseBrowserClient() {
  const url = getSupabaseUrlSafe();
  const key = getSupabasePublishableKeySafe();

  if (!url || !key) {
    return null;
  }

  if (browserClient) {
    return browserClient;
  }

  browserClient = createBrowserClient(url, key);
  return browserClient;
}

export function getSupabaseBrowserClient() {
  return createSupabaseBrowserClient();
}
