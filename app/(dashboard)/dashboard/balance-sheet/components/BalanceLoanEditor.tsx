"use client";
import React from 'react';
import Field from '@/components/ui/form/Field';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
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

  const repayment = ensureRepayment();
  

  return (
    <div className="mt-3 rounded-md border p-3 bg-muted/30 space-y-4">
      {/* Row 1: Description (2x), Balance, Currency */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Field label="Description" className="md:col-span-2" error={descriptionError}>
          <Input
            required
            value={item.description ?? ''}
            onChange={(e) => onChange({ ...item, description: e.target.value })}
            onBlur={(e) => {
              const v = (e.target.value ?? '').trim();
              if (!v) {
                const toTitle = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                onChange({ ...item, description: toTitle(String(item.type)) });
              }
            }}
          />
        </Field>
        <Field label="Balance">
          <NumberInput
            value={item.ite.balance ?? null}
            placeholder="balance"
            onValueChange={(v) => {
              const val = v == null ? null : Math.round(v);
              onChange({ ...item, ite: { ...item.ite, balance: val } });
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
          <NumberInput
            value={repayment.periodic_amount ?? null}
            placeholder="amount"
            onValueChange={(v) => {
              const val = v == null ? null : Math.round(v);
              const cf = ensureRepayment();
              onChange({ ...item, ite: { ...item.ite, repayment: { ...cf, periodic_amount: val } } });
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
