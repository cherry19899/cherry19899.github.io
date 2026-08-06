import { useEffect, useRef, useState } from 'react';

/**
 * Form drafts that survive a lost session.
 *
 * Pi Browser sessions expire without warning — often enough that people lose a
 * proposal or a job description they spent minutes on, with no way to get it
 * back. A draft outlives a reload, a 401 bounce to the login screen, and the app
 * being killed in the background.
 *
 * The storage layer is split out from the hook so it can be tested without a
 * renderer; the hook is a thin wrapper over it.
 */

const prefix = (key: string) => `workpro_draft_${key}`;

/** True when every field is blank — such a draft is worth deleting, not storing. */
export function isBlank(value: object): boolean {
  return Object.values(value).every(v => v === '' || v === false || v == null);
}

export function readDraft<T extends object>(key: string, initial: T): T {
  try {
    const saved = localStorage.getItem(prefix(key));
    if (!saved) return initial;
    // Spread over `initial` so a draft written by an older build — before a
    // field existed — cannot leave that field undefined.
    return { ...initial, ...JSON.parse(saved) };
  } catch {
    return initial;   // corrupt JSON, or storage blocked in private mode
  }
}

export function writeDraft<T extends object>(key: string, value: T): void {
  try {
    if (isBlank(value)) localStorage.removeItem(prefix(key));
    else localStorage.setItem(prefix(key), JSON.stringify(value));
  } catch { /* quota or private mode — losing a draft beats breaking the form */ }
}

export function clearDraft(key: string): void {
  try { localStorage.removeItem(prefix(key)); } catch {}
}

/**
 * Returns `[value, setValue, clear]`. Call `clear()` only once the form has
 * actually been accepted by the server — anything earlier leaves the user's
 * text deleted after a failure, which is the exact thing this prevents.
 */
export function useDraft<T extends object>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readDraft(key, initial));

  // Skip the write caused by the first render: it would rewrite the draft that
  // was just restored, and create an empty one for a form nobody has touched.
  const settled = useRef(false);

  useEffect(() => {
    if (!settled.current) { settled.current = true; return; }
    writeDraft(key, value);
  }, [value, key]);

  return [value, setValue, () => clearDraft(key)] as const;
}
