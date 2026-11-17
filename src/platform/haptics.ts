export const ImpactFeedbackStyle = { Soft: 'soft', Light: 'light', Medium: 'medium', Heavy: 'heavy' } as const;
export const NotificationFeedbackType = { Success: 'success', Warning: 'warning', Error: 'error' } as const;
export async function impactAsync(_style?: string) { if (navigator.userActivation?.isActive) navigator.vibrate?.(10); }
export const selectionAsync = impactAsync;
export const notificationAsync = impactAsync;
