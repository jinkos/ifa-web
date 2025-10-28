import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Treat null, undefined, empty string, whitespace-only string, and empty arrays as blank
export function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') {
    const s = value.trim().toLowerCase();
    if (s.length === 0) return true;
    if (s === 'unknown') return true; // treat sentinel "unknown" as blank
    return false;
  }
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

// Choose the non-blank value when exactly one side is blank; otherwise keep current
export function preferNonBlank<T>(current: T, incoming: T): T {
  const curBlank = isBlank(current);
  const incBlank = isBlank(incoming);
  if (curBlank && !incBlank) return incoming;
  if (!curBlank && incBlank) return current;
  // If both blank or both non-blank, keep current
  return current;
}

// Shallow merge helper for identity-like objects: only fill in blanks from incoming
export function mergeIdentityFields<T extends Record<string, any>>(current: T, incoming: Partial<T>): T {
  const keys = new Set([...Object.keys(current ?? {}), ...Object.keys(incoming ?? {})]);
  const result: any = { ...(current ?? {}) };
  for (const key of keys) {
    const curVal = (current as any)?.[key];
    const incVal = (incoming as any)?.[key];
    result[key] = preferNonBlank(curVal, incVal as any);
  }
  return result as T;
}

