import type { CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";

import { getSupabasePublishableKeySafe, getSupabaseUrlSafe } from "@/lib/env";

export async function createSupabaseServerClient() {
  const url = getSupabaseUrlSafe();
  const key = getSupabasePublishableKeySafe();

  if (!url || !key) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) => {
        try {
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Ignore errors during cookie setting in certain contexts
        }
      }
    }
  });
}

export async function getSupabaseServerClient() {
  return createSupabaseServerClient();
}
