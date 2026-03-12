import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseUrlSafe } from "@/lib/env";

export function getSupabaseAdminClient() {
    const url = getSupabaseUrlSafe();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
        return null;
    }

    return createClient(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}
