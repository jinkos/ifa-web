// API helpers for Balance Sheet page
import type { PersonalBalanceSheetItem } from '@/lib/types/balance';
import { toBalanceSheetModel } from '@/lib/types/balance';

export async function loadBalanceSheet<T = any>(teamId: number, clientId: number): Promise<Partial<T>> {
  const res = await fetch(`/api/balance?teamId=${teamId}&clientId=${clientId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load balance sheet');
  const data = (await res.json()) as Partial<T>;
  // Contract checks (dev only): enforce items-only
  if (process.env.NODE_ENV !== 'production' && data && typeof data === 'object') {
    const legacyKeys = ['target_retirement_age', 'target_retirement_income', 'employment_status', 'occupation'];
    const found = legacyKeys.filter((k) => Object.prototype.hasOwnProperty.call(data as any, k));
    if (found.length > 0) {
      // eslint-disable-next-line no-console
      console.error('[balance] items-only mode expected; legacy fields present in response:', found);
    }
    const isArray = Array.isArray((data as any)?.balance_sheet);
    if (!isArray) {
      // eslint-disable-next-line no-console
      console.error('[balance] expected { balance_sheet: PersonalBalanceSheetItem[] } in response');
    }
  }
  return data;
}

export async function saveBalanceSheet<T = any>(teamId: number, clientId: number, payload: T): Promise<void> {
  const res = await fetch(`/api/balance?teamId=${teamId}&clientId=${clientId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || 'Failed to save');
  }
}

export async function extractBalance<T = any>(
  teamId: number,
  clientId: number,
  balanceSheet?: PersonalBalanceSheetItem[]
): Promise<Partial<T>> {
  const res = await fetch('/api/docs/extract_balance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ team_id: teamId, client_id: clientId, balance_sheet: balanceSheet ?? [] }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || 'Extract failed');
  }
  return (await res.json()) as Partial<T>;
}

export async function validateBalanceSheetModel(teamId: number, clientId: number): Promise<any> {
  const raw = await loadBalanceSheet<any>(teamId, clientId);
  const model = toBalanceSheetModel(raw);
  const res = await fetch('/api/test/balance_sheet_verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ team_id: teamId, client_id: clientId, balance_sheet_model: model }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({} as any));
    const error = new Error((err as any)?.detail || (err as any)?.error || 'Validation failed');
    (error as any).meta = err;
    (error as any).status = res.status;
    throw error;
  }
  const contentType = res.headers.get('content-type') || '';
  return contentType.includes('application/json') ? await res.json() : await res.text();
}
