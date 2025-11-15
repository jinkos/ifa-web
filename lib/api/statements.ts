// API helpers for Statements page

export type SpendingCategory = 'Discretionary' | 'Non-Discret' | 'Unknown' | 'Funding';

export interface Transaction {
  id: number;
  statement_id: number;
  type: string | null;
  date: string | null;
  description: string;
  amount: number | null;
  created_at: string;
  bank_name: string | null;
  account_number: string | null;
}

export async function loadTransactions(teamId: number, clientId: number): Promise<Transaction[]> {
  const res = await fetch(`/api/statements?teamId=${teamId}&clientId=${clientId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load transactions');
  const data = await res.json();
  return data.transactions || [];
}

export async function updateTransactionCategory(
  teamId: number,
  clientId: number,
  transactionId: number,
  category: SpendingCategory
): Promise<void> {
  const res = await fetch(`/api/statements`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId, clientId, transactionId, category }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || 'Failed to update category');
  }
}
