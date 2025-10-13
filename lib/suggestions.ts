export type ListSuggestions<T> = {
  conflicts: Record<string, T>;
  additions: T[];
  removals: Set<string>;
};

/**
 * Build suggestions between current and incoming lists.
 * Skips items with empty/null keys.
 */
export function buildListSuggestions<T>(
  current: T[],
  incoming: T[],
  keyFn: (t: T) => string | null | undefined,
  equalFn: (a?: T | null, b?: T | null) => boolean
): ListSuggestions<T> {
  const curMap = new Map<string, T>();
  for (const it of current || []) {
    const key = keyFn(it);
    if (!key) continue;
    curMap.set(key, it);
  }
  const incMap = new Map<string, T>();
  for (const it of incoming || []) {
    const key = keyFn(it);
    if (!key) continue;
    incMap.set(key, it);
  }

  const conflicts: Record<string, T> = {};
  const additions: T[] = [];
  const removals: Set<string> = new Set();

  // Conflicts and additions
  for (const [key, inc] of incMap.entries()) {
    const cur = curMap.get(key);
    if (cur) {
      if (!equalFn(cur, inc)) conflicts[key] = inc;
    } else {
      additions.push(inc);
    }
  }
  // Removals (present in current but missing in incoming)
  for (const [key] of curMap.entries()) {
    if (!incMap.has(key)) removals.add(key);
  }

  return { conflicts, additions, removals };
}
