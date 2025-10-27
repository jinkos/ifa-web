// API helpers for Balance Sheet page
import type { PersonalBalanceSheetItem } from '@/lib/types/balance';

export async function loadBalanceSheet<T = any>(teamId: number, clientId: number): Promise<Partial<T>> {
  const res = await fetch(`/api/balance?teamId=${teamId}&clientId=${clientId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load balance sheet');
  return (await res.json()) as Partial<T>;
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
