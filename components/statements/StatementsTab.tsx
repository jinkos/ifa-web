"use client";
import React, { useEffect, useState, useTransition } from 'react';
import { useTeam } from '@/app/(dashboard)/dashboard/TeamContext';
import { useSelectedClient } from '@/app/(dashboard)/dashboard/SelectedClientContext';
import { loadTransactions, updateTransactionCategory, type Transaction, type SpendingCategory } from '@/lib/api/statements';
import CategorySwitch from './CategorySwitch';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatAmount(amount: number | null): string {
  if (amount === null || amount === undefined) return '—';
  const formatted = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(Math.abs(amount));
  return formatted;
}

function maskAccountNumber(accountNumber: string | null): string {
  if (!accountNumber) return 'N/A';
  const digits = accountNumber.replace(/\D/g, '');
  if (digits.length < 4) return accountNumber;
  return `****${digits.slice(-4)}`;
}

function determineCategory(amount: number | null, currentType: string | null): SpendingCategory {
  // Use existing type if set
  if (currentType === 'Discretionary') return 'Discretionary';
  if (currentType === 'Non-Discret') return 'Non-Discret';
  if (currentType === 'Unknown') return 'Unknown';
  if (currentType === 'Funding') return 'Funding';
  
  // Default based on amount sign if no type set
  if (amount && amount > 0) return 'Funding';
  return 'Unknown';
}

export default function StatementsTab() {
  const { team } = useTeam();
  const { selectedClient } = useSelectedClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate totals inline to avoid useMemo overhead
  const calculateTotals = (txList: Transaction[]) => {
    const result = {
      funding: 0,
      discretionary: 0,
      nonDiscretionary: 0,
      unknown: 0,
      totalSpending: 0,
    };

    txList.forEach((tx) => {
      const amount = Number(tx.amount) || 0;
      const category = determineCategory(tx.amount, tx.type);

      if (category === 'Funding') {
        result.funding += amount;
      } else if (category === 'Discretionary') {
        result.discretionary += Math.abs(amount);
        result.totalSpending += Math.abs(amount);
      } else if (category === 'Non-Discret') {
        result.nonDiscretionary += Math.abs(amount);
        result.totalSpending += Math.abs(amount);
      } else {
        result.unknown += Math.abs(amount);
        result.totalSpending += Math.abs(amount);
      }
    });

    return result;
  };

  const totals = calculateTotals(transactions);

  useEffect(() => {
    let ignore = false;

    async function fetchTransactions() {
      if (!team?.id || !selectedClient?.client_id) return;

      setLoading(true);
      setError(null);
      try {
        const data = await loadTransactions(team.id, selectedClient.client_id);
        if (!ignore) {
          setTransactions(data);
        }
      } catch (err: any) {
        if (!ignore) {
          setError(err.message || 'Failed to load transactions');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchTransactions();

    return () => {
      ignore = true;
    };
  }, [team?.id, selectedClient?.client_id]);

  async function handleCategoryChange(transactionId: number, newCategory: SpendingCategory) {
    if (!team?.id || !selectedClient?.client_id) return;

    // Optimistic update - update UI immediately with flushSync for instant update
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === transactionId ? { ...tx, type: newCategory } : tx))
    );

    // Fire and forget - don't await
    updateTransactionCategory(team.id, selectedClient.client_id, transactionId, newCategory)
      .catch((err: any) => {
        // Revert on error
        console.error('Failed to update category:', err);
        alert(err.message || 'Failed to update category');
        // Reload to get correct state
        if (team?.id && selectedClient?.client_id) {
          loadTransactions(team.id, selectedClient.client_id).then(setTransactions);
        }
      });
  }

  async function handleBulkCategoryChange(description: string, newCategory: SpendingCategory) {
    if (!team?.id || !selectedClient?.client_id) return;

    // Find all transactions with the same description
    const matchingTxIds = transactions
      .filter((tx) => tx.description === description)
      .map((tx) => tx.id);

    if (matchingTxIds.length === 0) return;

    // Optimistic update - update all matching transactions immediately
    setTransactions((prev) =>
      prev.map((tx) => (tx.description === description ? { ...tx, type: newCategory } : tx))
    );

    // Fire and forget - update all matching transactions
    Promise.all(
      matchingTxIds.map((id) =>
        updateTransactionCategory(team.id!, selectedClient.client_id!, id, newCategory)
      )
    ).catch((err: any) => {
      console.error('Failed to bulk update categories:', err);
      alert(err.message || 'Failed to update categories');
      // Reload to get correct state
      if (team?.id && selectedClient?.client_id) {
        loadTransactions(team.id, selectedClient.client_id).then(setTransactions);
      }
    });
  }

  if (!team?.id || !selectedClient?.client_id) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Please select a client to view statements.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="border border-red-200 bg-red-50 text-red-700 rounded-md p-4">
          <p className="font-medium">Error loading transactions</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="p-4">
        <div className="border rounded-md p-6 bg-white dark:bg-neutral-900 text-center">
          <p className="text-sm text-muted-foreground">
            No transactions found for <span className="font-medium text-foreground">{selectedClient.name}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Totals Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="border rounded-md p-4 bg-white dark:bg-neutral-900">
          <div className="text-sm text-muted-foreground mb-1">Total Funding</div>
          <div className="text-2xl font-semibold text-green-600">
            {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(totals.funding)}
          </div>
        </div>
        <div className="border rounded-md p-4 bg-white dark:bg-neutral-900">
          <div className="text-sm text-muted-foreground mb-1">Total Spending</div>
          <div className="text-2xl font-semibold text-red-600">
            {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(totals.totalSpending)}
          </div>
        </div>
        <div className="border rounded-md p-4 bg-white dark:bg-neutral-900">
          <div className="text-sm text-muted-foreground mb-1">Discretionary</div>
          <div className="text-xl font-semibold">
            {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(totals.discretionary)}
          </div>
        </div>
        <div className="border rounded-md p-4 bg-white dark:bg-neutral-900">
          <div className="text-sm text-muted-foreground mb-1">Non-Discretionary</div>
          <div className="text-xl font-semibold">
            {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(totals.nonDiscretionary)}
          </div>
        </div>
        <div className="border rounded-md p-4 bg-white dark:bg-neutral-900">
          <div className="text-sm text-muted-foreground mb-1">Unknown</div>
          <div className="text-xl font-semibold text-gray-500">
            {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(totals.unknown)}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="border rounded-md bg-white dark:bg-neutral-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-neutral-800 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Bank</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Account</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Description</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">Amount</th>
                <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
              {transactions.map((tx) => {
                const category = determineCategory(tx.amount, tx.type);
                const isPositive = tx.amount && tx.amount > 0;
                const matchingCount = transactions.filter((t) => t.description === tx.description).length;

                return (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(tx.date)}</td>
                    <td className="px-4 py-3">{tx.bank_name || 'N/A'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{maskAccountNumber(tx.account_number)}</td>
                    <td className="px-4 py-3">{tx.description}</td>
                    <td className={`px-4 py-3 text-right font-medium whitespace-nowrap ${
                      isPositive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isPositive ? '+' : '−'}{formatAmount(tx.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <CategorySwitch
                          value={category}
                          onChange={(newCategory) => handleCategoryChange(tx.id, newCategory)}
                          disabled={false}
                        />
                        {matchingCount > 1 && (
                          <button
                            onClick={() => handleBulkCategoryChange(tx.description, category)}
                            title={`Apply "${category}" to all ${matchingCount} transactions with this description`}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-400 transition-colors"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="w-4 h-4"
                            >
                              <path d="M1 8.25a1.25 1.25 0 112.5 0v7.5a1.25 1.25 0 11-2.5 0v-7.5zM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0114 3c0 .995-.182 1.948-.514 2.826-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 01-1.341 5.974C17.153 16.323 16.072 17 14.9 17h-3.192a3 3 0 01-1.341-.317l-2.734-1.366A3 3 0 006.292 15H5V8h.963c.685 0 1.258-.483 1.612-1.068a4.011 4.011 0 012.166-1.73c.432-.143.853-.386 1.011-.814.16-.432.248-.9.248-1.388z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="text-sm text-muted-foreground px-4">
        Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
