import { z } from 'zod';
import type { BalanceFrequency, CashFlow, NetGrossIndicator } from '@/lib/types/balance';
import { BALANCE_FREQUENCIES, NET_GROSS_VALUES } from '@/lib/types/balance';

// Shared enums
export const zBalanceFrequency = z.enum(
  BALANCE_FREQUENCIES as [BalanceFrequency, ...BalanceFrequency[]]
);

export const zNetGrossIndicator = z.enum(
  NET_GROSS_VALUES as [NetGrossIndicator, ...NetGrossIndicator[]]
);

// Core value objects
export const zCashFlow = z.object({
  periodic_amount: z
    .number({ invalid_type_error: 'amount must be a number' })
    .int('amount must be an integer')
    .nullable()
    .optional()
    .transform((v) => (v === undefined ? null : v)),
  frequency: zBalanceFrequency.default('unknown'),
  net_gross: zNetGrossIndicator.default('unknown'),
});

export type ZCashFlow = z.infer<typeof zCashFlow>;

// Helpers
export function normalizeCashFlow(input: any, defaults?: Partial<CashFlow>): CashFlow {
  const base = { periodic_amount: null, frequency: 'unknown', net_gross: 'unknown', ...(defaults || {}) } as CashFlow;
  const parsed = zCashFlow.safeParse({ ...base, ...(input || {}) });
  if (parsed.success) return parsed.data as CashFlow;
  return base;
}

// These helpers intentionally keep the existing transport normalizers as source of truth
// but expose zod building blocks for future UI validation.
