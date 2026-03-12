export type OgBadgeVariant = "neutral" | "warning" | "danger" | "success" | "primary";

export type BaseOgProps = {
    title: string;
    subtitle?: string;
    badges?: Array<{ label: string; variant: OgBadgeVariant }>;
    metrics?: Array<{ label: string; value: string | number }>;
    dateLabel?: string;
    urlPath?: string;
};
