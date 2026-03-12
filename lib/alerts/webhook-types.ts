import { AlertStatus, AlertSeverity } from "./alert-types";

import { AlertDestinationType, AlertDestinationConfig } from "./native-destination-types";

export type WebhookDestinationItem = {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    is_enabled: boolean;
    webhook_url: string;
    secret_header_name: string | null;
    secret_header_value: string | null;
    event_filter: Record<string, any>;
    signing_mode?: string | null;
    signing_secret?: string | null;
    signing_header_name?: string | null;
    signing_timestamp_header_name?: string | null;
    signing_kid?: string | null;
    destination_type: AlertDestinationType;
    destination_config: AlertDestinationConfig;
    created_at: string;
    updated_at: string;
};

export type OpenAlertForDelivery = {
    id: string;
    severity: AlertSeverity;
    scope: "neighborhood" | "condition" | "global";
    neighborhood: string | null;
    condition: string | null;
    title: string;
    summary: string | null;
    status: AlertStatus;
    created_at: string;
    source_snapshot_id: string | null;
    source_diff_id: string | null;
};

export type AlertDeliveryItem = {
    id: string;
    alert_id: string;
    destination_id: string;
    run_id: string | null;
    status: "pending" | "success" | "failed" | "skipped";
    response_status: number | null;
    response_excerpt: string | null;
    attempted_at: string;
    alert_title?: string;
    destination_title?: string;
};

export type AlertDeliveryRunItem = {
    id: string;
    source: "manual" | "job" | "cron";
    started_at: string;
    finished_at: string | null;
    status: "running" | "success" | "partial" | "skipped" | "error";
    message: string | null;
    deliveries_attempted: number;
    deliveries_succeeded: number;
    deliveries_failed: number;
};

export type DeliverAlertsMode = "manual" | "job" | "cron";

export type DeliverAlertsResult = {
    ok: boolean;
    message: string;
    attempted: number;
    succeeded: number;
    failed: number;
    skipped: number;
    runId: string | null;
    reason?: "env-missing" | "unauthorized" | "rpc-missing" | "db-error" | "no-destinations" | "no-alerts";
};
