import type { PersonalBalanceSheetItem } from '@/lib/types/balance';

// Humanize a type or fallback string to a title-cased description
const toTitle = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// Create a stable local id for client-side identification
export const createLocalId = (): string =>
  (typeof crypto !== 'undefined' && (crypto as any).randomUUID
    ? (crypto as any).randomUUID()
    : `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);

// Normalize items loaded from the API for client use:
// - Ensure description is non-empty (defaults from type)
// - Drop falsy currency (let server default to GBP)
// - Ensure every item has a __localId used for UI operations like delete/reorder
export function normalizeLoadedItems(arr: any[]): PersonalBalanceSheetItem[] {
  return (Array.isArray(arr) ? arr : []).map((it: any) => {
    const desc = typeof it?.description === 'string' && it.description.trim().length > 0
      ? it.description
      : toTitle(String(it?.type ?? 'item'));
    const out: any = { ...it, description: desc };
    if (!out.currency) delete out.currency;
    if (!out.__localId) out.__localId = createLocalId();
    return out as PersonalBalanceSheetItem;
  });
}
