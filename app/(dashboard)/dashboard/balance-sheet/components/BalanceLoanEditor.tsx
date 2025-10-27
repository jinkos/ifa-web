"use client";
import React from 'react';
import Field from '@/components/ui/form/Field';
import { Input } from '@/components/ui/input';
import type { PersonalBalanceSheetItem, BalanceFrequency, NetGrossIndicator, CashFlow, LoanData } from '@/lib/types/balance';

const freqOptions: BalanceFrequency[] = [
  'weekly',
  'monthly',
  'quarterly',
  'six_monthly',
  'annually',
  'unknown',
];

const ngOptions: NetGrossIndicator[] = ['net', 'gross', 'unknown'];

type LoanKinds = 'credit_card' | 'personal_loan' | 'student_loan';

export default function BalanceLoanEditor({
  item,
  onChange,
  descriptionError,
}: {
  item: Extract<PersonalBalanceSheetItem, { type: LoanKinds }> & { ite: LoanData };
  onChange: (next: PersonalBalanceSheetItem) => void;
  descriptionError?: string;
}) {
  const ensureRepayment = (): CashFlow =>
    item.ite.repayment ?? { periodic_amount: null, frequency: 'monthly', net_gross: 'net' };

  const displayBalance = (item.ite.balance ?? '') as any;
  const repayment = ensureRepayment();
  const displayRepay = (repayment.periodic_amount ?? 0) === 0 && repayment.periodic_amount !== null ? '' : (repayment.periodic_amount ?? '');

  return (
    <div className="mt-3 rounded-md border p-3 bg-muted/30 space-y-4">
      {/* Row 1: Description (2x), Balance, Currency */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Field label="Description" className="md:col-span-2" error={descriptionError}>
          <Input
            value={item.description ?? ''}
            onChange={(e) => onChange({ ...item, description: e.target.value })}
          />
        </Field>
        <Field label="Balance">
          <Input
            type="number"
            inputMode="numeric"
            value={displayBalance}
            placeholder="balance"
            onChange={(e) => {
              const v = e.target.value === '' ? null : Math.round(Number(e.target.value));
              onChange({ ...item, ite: { ...item.ite, balance: v } });
            }}
          />
        </Field>
        <Field label="Currency">
          <Input
            value={item.currency ?? ''}
            onChange={(e) => onChange({ ...item, currency: e.target.value })}
            placeholder="GBP"
          />
        </Field>
      </div>

      {/* Row 2: Repayment amount, frequency, net/gross */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Repayment">
          <Input
            type="number"
            inputMode="numeric"
            value={displayRepay as any}
            placeholder="amount"
            onChange={(e) => {
              const v = e.target.value === '' ? null : Math.round(Number(e.target.value));
              const cf = ensureRepayment();
              onChange({ ...item, ite: { ...item.ite, repayment: { ...cf, periodic_amount: v } } });
            }}
          />
        </Field>
        <Field label="Frequency">
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={repayment.frequency}
            onChange={(e) => {
              const cf = ensureRepayment();
              onChange({ ...item, ite: { ...item.ite, repayment: { ...cf, frequency: e.target.value as BalanceFrequency } } });
            }}
          >
            {freqOptions.map((f) => (
              <option key={f} value={f}>
                {f.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Net/Gross">
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={repayment.net_gross}
            onChange={(e) => {
              const cf = ensureRepayment();
              onChange({ ...item, ite: { ...item.ite, repayment: { ...cf, net_gross: e.target.value as NetGrossIndicator } } });
            }}
          >
            {ngOptions.map((ng) => (
              <option key={ng} value={ng}>
                {ng}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  );
}
