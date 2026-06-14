// Lightweight, client-only "recently used" tracking backed by localStorage.
// Used to surface recent templates in the command palette for one-keystroke
// access to whatever an agent was just working on.

export interface RecentTemplate {
  id: string;
  name: string;
  category?: string | null;
}

const KEY = 'recent:templates';
const MAX = 6;

export function recordRecentTemplate(t: RecentTemplate) {
  if (typeof window === 'undefined') return;
  try {
    const list = getRecentTemplates().filter(x => x.id !== t.id);
    list.unshift({ id: t.id, name: t.name, category: t.category ?? null });
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch { /* storage unavailable / quota — non-critical */ }
}

export function getRecentTemplates(): RecentTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}
