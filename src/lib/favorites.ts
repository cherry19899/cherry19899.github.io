// Local (device) bookmarks for jobs — no backend needed.
const KEY = 'workpro_favorites';

export function getFavorites(): number[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
export function isFavorite(id: number): boolean {
  return getFavorites().includes(id);
}
export function toggleFavorite(id: number): boolean {
  const cur = getFavorites();
  const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('workpro:favchange'));
  return next.includes(id);
}
