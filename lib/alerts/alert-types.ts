export type AlertScope = "neighborhood" | "condition" | "global";
export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type AlertStatus = "open" | "acknowledged" | "dismissed";
export type AlertSource = "manual" | "job" | "cron";

export type AlertEventItem = {
    id: string;
    severity: AlertSeverity;
    scope: AlertScope;
    neighborhood: string | null;
    condition: string | null;
    title: string;
    summary: string | null;
    status: AlertStatus;
    created_at: string;
    source_snapshot_id: string | null;
    source_diff_id: string | null;
};

export type AlertRunItem = {
    id: string;
    source: AlertSource;
    started_at: string;
    finished_at: string | null;
    status: "running" | "success" | "skipped" | "error";
    message: string | null;
    alerts_created: number;
};

export type EvaluateAlertsResult = {
    ok: boolean;
    message: string;
    alertsCreated: number;
    runId: string | null;
    reason?: "env-missing" | "unauthorized" | "db-error" | "rpc-missing";
};
