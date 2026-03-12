export type RetryableDeliveryItem = {
    id: string;
    alert_id: string;
    destination_id: string;
    status: string;
    response_status: number | null;
    attempted_at: string;
    attempt_number: number;
    next_retry_at: string | null;
    final_status: string;
    alert_title: string;
    destination_title: string;
    webhook_url: string;
};

export type DeliveryRetryMode = "manual" | "cron";

export type DeliveryFinalStatus = "success" | "failed_permanent" | "failed_retryable";

export type RedeliverResult = {
    ok: boolean;
    message: string;
    attempted: number;
    succeeded: number;
    failed: number;
    skipped: number;
    results: Array<{
        deliveryId: string;
        finalStatus: DeliveryFinalStatus;
        message: string;
    }>;
};
