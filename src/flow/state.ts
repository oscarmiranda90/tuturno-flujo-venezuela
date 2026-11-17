export type Screen =
  | "1"
  | "2"
  | "3"
  | "4a"
  | "4b"
  | "4c"
  | "5"
  | "6"
  | "7"
  | "7b"
  | "8"
  | "9"
  | "10"
  | "11"
  | "11b"
  | "12"
  | "12c"
  | "12d"
  | "13";
export type Idea = 0 | 1 | 2 | 3 | 4 | 5;
export type Frequency = "weekly" | "fortnightly";
export interface FlowState {
  screen: Screen;
  idea: Idea | null;
  rule: 0 | 1 | 2;
  wheel: number | null;
  frequency: Frequency;
  termsRead: boolean;
  accepted: [boolean, boolean, boolean];
}
export function initialState(screen: Screen = "4a"): FlowState {
  return {
    screen,
    idea: screen === "4a" ? null : 0,
    rule: 0,
    wheel: null,
    frequency: "weekly",
    termsRead: screen === "11b",
    accepted: screen === "11b" ? [true, true, true] : [false, false, false],
  };
}
export const paymentTerms = (frequency: Frequency) =>
  frequency === "weekly"
    ? { quota: 10, service: 1.74, total: 11.74, seats: 10 }
    : { quota: 20, service: 3.48, total: 23.48, seats: 5 };
export function previous(s: FlowState): FlowState {
  if (["4c", "6"].includes(s.screen) && s.rule > 0)
    return { ...s, rule: (s.rule - 1) as 0 | 1 };
  const map: Partial<Record<Screen, Screen>> = {
    "4c": "4a",
    "5": "4c",
    "6": "5",
    "7": "6",
    "7b": "7",
    "8": "7b",
    "9": "8",
    "10": "9",
    "11": "10",
    "11b": "10",
    "12": "11b",
    "12c": "12",
    "12d": "12",
  };
  const screen = map[s.screen] ?? s.screen;
  return { ...s, screen, rule: ["4c", "6"].includes(screen) ? 2 : s.rule };
}
/** Las respuestas del pago conservan la frecuencia elegida y los términos aceptados. */
export const paymentFailed = (s: FlowState): FlowState => ({
  ...s,
  screen: "12c",
});

/** Restaura únicamente el contexto validado del San; el almacenamiento no puede conceder consentimientos ni pagos. */
export function restoreSan(value: unknown, screen: Screen): FlowState {
  const base = initialState(screen);
  if (!value || typeof value !== "object") return base;
  const saved = value as Record<string, unknown>;
  const read = saved.termsRead === true;
  return {
    ...base,
    idea: Number.isInteger(saved.idea) && Number(saved.idea) >= 0 && Number(saved.idea) <= 5
      ? saved.idea as Idea : null,
    frequency: saved.frequency === "fortnightly" ? "fortnightly" : "weekly",
    termsRead: read,
    accepted: read && Array.isArray(saved.accepted) && saved.accepted.length === 3
      ? saved.accepted.map(v => v === true) as FlowState["accepted"] : [false, false, false],
  };
}
