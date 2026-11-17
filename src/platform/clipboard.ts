export async function getStringAsync() { try { return await navigator.clipboard.readText(); } catch { return ''; } }
export async function setStringAsync(text: string) { await navigator.clipboard.writeText(text); }
