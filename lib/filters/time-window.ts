/**
 * Filtros temporais - núcleo de janelas de tempo reutilizáveis
 * Suporta: 7, 30, 90, 365 dias
 */

export const ALLOWED_TIME_WINDOWS = [7, 30, 90, 365] as const;
export type TimeWindow = (typeof ALLOWED_TIME_WINDOWS)[number];

export const TIME_WINDOW_LABELS: Record<TimeWindow, string> = {
  7: "Últimos 7 dias",
  30: "Últimos 30 dias",
  90: "Últimos 90 dias",
  365: "Último ano"
};

/**
 * Normaliza valor de query param ou qualquer string em TimeWindow válida
 * Retorna 30 por padrão se inválido
 */
export function normalizeTimeWindow(value: string | number | null | undefined): TimeWindow {
  if (!value) return 30;

  const num = typeof value === "string" ? parseInt(value, 10) : value;

  if (ALLOWED_TIME_WINDOWS.includes(num as TimeWindow)) {
    return num as TimeWindow;
  }

  return 30;
}

/**
 * Get label amigável para timewindow
 */
export function getTimeWindowLabel(days: TimeWindow): string {
  return TIME_WINDOW_LABELS[days] || TIME_WINDOW_LABELS[30];
}

/**
 * Monta URL com query param de days
 * Preserva outros params existentes
 */
export function buildTimeWindowUrl(
  baseUrl: string,
  days: TimeWindow,
  additionalParams?: Record<string, string>
): string {
  const url = new URL(baseUrl, "http://localhost"); // dummy protocol
  url.searchParams.set("days", String(days));

  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
  }

  return url.pathname + url.search;
}

/**
 * Parse de days a partir de searchParams
 * Retorna normalizado ou 30 como fallback
 */
export function parseTimeWindowFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>
): TimeWindow {
  const daysParam = searchParams.days;
  if (Array.isArray(daysParam)) {
    return normalizeTimeWindow(daysParam[0]);
  }
  return normalizeTimeWindow(daysParam);
}
