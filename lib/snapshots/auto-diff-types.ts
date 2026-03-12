export type AutoDiffStatus = "success" | "skipped" | "error" | "running";

export type AutoDiffResult = {
    ok: boolean;
    status: AutoDiffStatus;
    message: string;
    previousSnapshotId: string | null;
    diffId: string | null;
    reason?: "env-missing" | "unauthorized" | "db-error" | "rpc-missing";
};

export type SnapshotDiffRunItem = {
    id: string;
    source: "manual" | "job" | "cron";
    snapshot_id: string;
    previous_snapshot_id: string | null;
    diff_id: string | null;
    started_at: string;
    finished_at: string | null;
    status: AutoDiffStatus;
    message: string | null;
};

export type PreviousCompatibleSnapshot = {
    snapshot_id: string;
    kind: "transparency" | "territory";
    days: number;
    neighborhood: string | null;
    snapshot_at: string;
};
