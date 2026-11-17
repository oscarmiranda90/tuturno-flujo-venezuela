/** Los enlaces antiguos de revisión deben abrir el recorrido vigente. */
const RETIRED_TOURS = new Set(['onboarding', 'welcome-tour', 'san-tour', 'how-it-works']);
export function approvedTourRoute<T extends { kind: string }>(route: T): T | { kind: 'venezuela-v19'; screen: '4a' } {
  return RETIRED_TOURS.has(route.kind) ? { kind: 'venezuela-v19', screen: '4a' } : route;
}
