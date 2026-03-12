export const SIDEWALK_CONDITIONS = ["good", "bad", "blocked"] as const;

export type SidewalkCondition = (typeof SIDEWALK_CONDITIONS)[number];

export const SIDEWALK_CONDITION_LABELS: Record<SidewalkCondition, string> = {
  good: "Passavel",
  bad: "Ruim / irregular",
  blocked: "Inacessivel / perigosa"
};

export const SIDEWALK_TAGS = [
  "buraco",
  "piso_quebrado",
  "irregular",
  "sem_rampa",
  "rampa_ruim",
  "poste_no_meio",
  "entulho",
  "raiz",
  "alagamento",
  "obra"
] as const;

export type SidewalkTagSlug = (typeof SIDEWALK_TAGS)[number];

export const SIDEWALK_TAG_LABELS: Record<SidewalkTagSlug, string> = {
  buraco: "Buraco",
  piso_quebrado: "Piso quebrado",
  irregular: "Superficie irregular",
  sem_rampa: "Sem rampa",
  rampa_ruim: "Rampa inadequada",
  poste_no_meio: "Poste no meio",
  entulho: "Entulho",
  raiz: "Raiz ou arvore",
  alagamento: "Alagamento",
  obra: "Obra em aberto"
};

export function getConditionLabel(condition: SidewalkCondition): string {
  return SIDEWALK_CONDITION_LABELS[condition];
}

export function getTagLabel(tag: SidewalkTagSlug): string {
  return SIDEWALK_TAG_LABELS[tag];
}

export function isValidSidewalkCondition(value: string): value is SidewalkCondition {
  return SIDEWALK_CONDITIONS.includes(value as SidewalkCondition);
}

export function isValidSidewalkTag(value: string): value is SidewalkTagSlug {
  return SIDEWALK_TAGS.includes(value as SidewalkTagSlug);
}
