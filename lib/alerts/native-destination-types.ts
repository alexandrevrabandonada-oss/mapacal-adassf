export type AlertDestinationType = 
    | "generic_webhook"
    | "slack_webhook"
    | "discord_webhook"
    | "telegram_bot";

export interface GenericWebhookConfig {
    [key: string]: unknown;
}

export interface SlackWebhookConfig {
    channelLabel?: string;
    includeOgLink?: boolean;
}

export interface DiscordWebhookConfig {
    username?: string;
    includeOgLink?: boolean;
}

export interface TelegramBotConfig {
    botToken?: string;
    chatId?: string;
    disableWebPagePreview?: boolean;
    includeOgLink?: boolean;
}

export type AlertDestinationConfig = 
    | GenericWebhookConfig
    | SlackWebhookConfig
    | DiscordWebhookConfig
    | TelegramBotConfig;

// Guard functions
export function isSlackConfig(type: AlertDestinationType, config: unknown): config is SlackWebhookConfig {
    return type === "slack_webhook" && typeof config === "object" && config !== null;
}

export function isDiscordConfig(type: AlertDestinationType, config: unknown): config is DiscordWebhookConfig {
    return type === "discord_webhook" && typeof config === "object" && config !== null;
}

export function isTelegramConfig(type: AlertDestinationType, config: unknown): config is TelegramBotConfig {
    return type === "telegram_bot" && typeof config === "object" && config !== null;
}
