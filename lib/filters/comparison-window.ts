/**
 * Modelo de comparação temporal entre períodos
 * Suporta comparações honestas por taxa diária, não por contagem bruta
 * 
 * Janelas válidas:
 * - current: 7, 30, 90 dias
 * - baseline: 30, 90, 365 dias
 * 
 * Princípio: comparar (count / days) em vez de count bruto
 * Isso evita ilusões causadas por períodos de tamanhos diferentes
 */

export const ALLOWED_CURRENT_WINDOWS = [7, 30, 90] as const;
export const ALLOWED_BASELINE_WINDOWS = [30, 90, 365] as const;

export type CurrentWindow = (typeof ALLOWED_CURRENT_WINDOWS)[number];
export type BaselineWindow = (typeof ALLOWED_BASELINE_WINDOWS)[number];

export interface ComparisonWindow {
  currentDays: CurrentWindow;
  baselineDays: BaselineWindow;
}

/**
 * Chave de comparação para cache/memoization
 */
export function getComparisonKey(current: CurrentWindow, baseline: BaselineWindow): string {
  return `${current}vs${baseline}`;
}

/**
 * Normaliza valor para CurrentWindow válido
 * Fallback: 7
 */
export function normalizeCurrentWindow(
  value: string | number | null | undefined
): CurrentWindow {
  if (!value) return 7;

  const num = typeof value === "string" ? parseInt(value, 10) : value;

  if (ALLOWED_CURRENT_WINDOWS.includes(num as CurrentWindow)) {
    return num as CurrentWindow;
  }

  return 7;
}

/**
 * Normaliza valor para BaselineWindow válido
 * Fallback: 30
 */
export function normalizeBaselineWindow(
  value: string | number | null | undefined
): BaselineWindow {
  if (!value) return 30;

  const num = typeof value === "string" ? parseInt(value, 10) : value;

  if (ALLOWED_BASELINE_WINDOWS.includes(num as BaselineWindow)) {
    return num as BaselineWindow;
  }

  return 30;
}

/**
 * Normaliza um par (current, baseline)
 * Garante que baseline > current para evitar nonsense
 */
export function normalizeComparisonWindow(
  currentValue: string | number | null | undefined,
  baselineValue: string | number | null | undefined
): ComparisonWindow {
  const current = normalizeCurrentWindow(currentValue);
  let baseline = normalizeBaselineWindow(baselineValue);

  // Se baseline <= current, ajustar baseline para próxima janela maior
  if (baseline <= current) {
    if (current === 7) {
      baseline = 30;
    } else if (current === 30) {
      baseline = 90;
    } else if (current === 90) {
      baseline = 365;
    }
  }

  return { currentDays: current, baselineDays: baseline };
}

/**
 * Rótulo amigável para comparação
 * Ex: "7 dias vs. 30 dias (baseline)"
 */
export function getComparisonLabel(currentDays: CurrentWindow, baselineDays: BaselineWindow): string {
  const currentLabel =
    currentDays === 7
      ? "7 dias"
      : currentDays === 30
        ? "30 dias"
        : "90 dias";

  const baselineLabel =
    baselineDays === 30
      ? "30 dias"
      : baselineDays === 90
        ? "90 dias"
        : "ano";

  return `${currentLabel} vs. ${baselineLabel} (baseline)`;
}

/**
 * Monta URL com query params de comparação
 * Preserva outros params existentes
 */
export function buildComparisonUrl(
  baseUrl: string,
  currentDays: CurrentWindow,
  baselineDays: BaselineWindow,
  additionalParams?: Record<string, string>
): string {
  const url = new URL(baseUrl, "http://localhost");
  url.searchParams.set("days", String(currentDays));
  url.searchParams.set("baselineDays", String(baselineDays));

  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
  }

  return url.pathname + url.search;
}

/**
 * Parse de days + baselineDays a partir de searchParams
 * Retorna normalizado ou fallback seguro
 */
export function parseComparisonFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>
): ComparisonWindow {
  const daysParam = searchParams.days;
  const baselineDaysParam = searchParams.baselineDays;

  let currentValue: string | number | null = null;
  let baselineValue: string | number | null = null;

  if (Array.isArray(daysParam)) {
    currentValue = daysParam[0];
  } else if (daysParam) {
    currentValue = daysParam;
  }

  if (Array.isArray(baselineDaysParam)) {
    baselineValue = baselineDaysParam[0];
  } else if (baselineDaysParam) {
    baselineValue = baselineDaysParam;
  }

  return normalizeComparisonWindow(currentValue, baselineValue);
}

/**
 * Próximas janelas recomendadas para "aprofundar"
 * Ex: se estou em 7 vs 30, qual seria o zoom-out natural?
 */
export function getNextComparisonWindow(current: ComparisonWindow): ComparisonWindow {
  if (current.currentDays === 7 && current.baselineDays === 30) {
    return { currentDays: 30, baselineDays: 90 };
  }
  if (current.currentDays === 30 && current.baselineDays === 90) {
    return { currentDays: 90, baselineDays: 365 };
  }
  // Default: stay same or back to 7 vs 30
  return { currentDays: 7, baselineDays: 30 };
}

/**
 * Janelas recomendadas para "zoom-in"
 */
export function getPreviousComparisonWindow(current: ComparisonWindow): ComparisonWindow {
  if (current.currentDays === 30 && current.baselineDays === 90) {
    return { currentDays: 7, baselineDays: 30 };
  }
  if (current.currentDays === 90 && current.baselineDays === 365) {
    return { currentDays: 30, baselineDays: 90 };
  }
  // Default
  return { currentDays: 7, baselineDays: 30 };
}
