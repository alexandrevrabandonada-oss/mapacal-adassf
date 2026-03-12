const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const storageBucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET;

const appBaseUrl = process.env.APP_BASE_URL;
const snapshotCronSecret = process.env.SNAPSHOT_CRON_SECRET;
const alertsCronSecret = process.env.ALERTS_CRON_SECRET;
const alertWebhookUserAgent = process.env.ALERT_WEBHOOK_USER_AGENT;

export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabasePublishableKey);
}

export function isStorageConfigured(): boolean {
  return !!(supabaseUrl && supabasePublishableKey && storageBucket);
}

export function isSnapshotCronConfigured(): boolean {
  return !!snapshotCronSecret;
}

export function isAlertsCronConfigured(): boolean {
  return !!alertsCronSecret;
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

export function getStorageBucket(): string {
  if (!storageBucket) {
    throw new Error("NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET não configurada");
  }
  return storageBucket;
}

export function getAppBaseUrl(): string {
  return appBaseUrl || "http://localhost:3000";
}

export function getSnapshotCronSecret(): string {
  if (!snapshotCronSecret) {
    throw new Error("SNAPSHOT_CRON_SECRET não configurada");
  }
  return snapshotCronSecret;
}

export function getAlertsCronSecret(): string {
  if (!alertsCronSecret) {
    throw new Error("ALERTS_CRON_SECRET não configurada");
  }
  return alertsCronSecret;
}

export function getAlertWebhookUserAgent(): string {
  return alertWebhookUserAgent || "MapaCalcadasSF-WebhookSender/1.0";
}

export function getSupabaseUrlSafe(): string | null {
  return supabaseUrl || null;
}

export function getSupabasePublishableKeySafe(): string | null {
  return supabasePublishableKey || null;
}

export function getStorageBucketSafe(): string | null {
  return storageBucket || null;
}
