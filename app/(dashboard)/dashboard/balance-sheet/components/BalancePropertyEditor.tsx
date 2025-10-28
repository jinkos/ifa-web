"use client";
import React from 'react';
import Field from '@/components/ui/form/Field';
import { Input } from '@/components/ui/input';
import type { PersonalBalanceSheetItem, BalanceFrequency, NetGrossIndicator, CashFlow, Debt, PropertyData } from '@/lib/types/balance';

const freqOptions: BalanceFrequency[] = [
  'weekly',
  'monthly',
  'quarterly',
  'six_monthly',
  'annually',
  'unknown',
];

const ngOptions: NetGrossIndicator[] = ['net', 'gross', 'unknown'];

type PropertyKinds = 'main_residence' | 'holiday_home' | 'car';

export default function BalancePropertyEditor({
  item,
  onChange,
  descriptionError,
}: {
  item: Extract<PersonalBalanceSheetItem, { type: PropertyKinds }> & { ite: PropertyData };
  onChange: (next: PersonalBalanceSheetItem) => void;
  descriptionError?: string;
}) {
  const isCar = item.type === 'car';
  const valueLabel = isCar ? 'Car value' : 'Property value';
  const balanceLabel = isCar ? 'Loan Balance' : 'Mortgage Balance';
  const repayLabel = 'Repayment';

  const ensureLoan = (): Debt => item.ite.loan ?? { balance: null, repayment: null };
  const ensureRepayment = (): CashFlow => ensureLoan().repayment ?? { periodic_amount: null, frequency: 'monthly', net_gross: 'net' };

  const displayValue = (item.ite.value ?? '') as any;
  const displayBalance = (item.ite.loan?.balance ?? '') as any;
  const repay = ensureRepayment();
  const displayRepay = (repay.periodic_amount ?? 0) === 0 && repay.periodic_amount !== null ? '' : (repay.periodic_amount ?? '');

  return (
    <div className="mt-3 rounded-md border p-3 bg-muted/30 space-y-4">
      {/* Row 1: Description (2x), Value, Currency */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Field label="Description" className="md:col-span-2" error={descriptionError}>
          <Input
            value={item.description ?? ''}
            onChange={(e) => onChange({ ...item, description: e.target.value })}
          />
        </Field>
        <Field label={valueLabel}>
          <Input
            type="number"
            inputMode="numeric"
            value={displayValue}
            placeholder="value"
            onChange={(e) => {
              const v = e.target.value === '' ? null : Math.round(Number(e.target.value));
              onChange({ ...item, ite: { ...item.ite, value: v } });
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

      {/* Row 2: Balance, Repayment, Frequency, Net/Gross */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Field label={balanceLabel}>
          <Input
            type="number"
            inputMode="numeric"
            value={displayBalance}
            placeholder="balance"
            onChange={(e) => {
              const v = e.target.value === '' ? null : Math.round(Number(e.target.value));
              const loan = ensureLoan();
              onChange({ ...item, ite: { ...item.ite, loan: { ...loan, balance: v } } });
            }}
          />
        </Field>
        <Field label={repayLabel}>
          <Input
            type="number"
            inputMode="numeric"
            value={displayRepay as any}
            placeholder="amount"
            onChange={(e) => {
              const v = e.target.value === '' ? null : Math.round(Number(e.target.value));
              const loan = ensureLoan();
              const repayment = ensureRepayment();
              onChange({ ...item, ite: { ...item.ite, loan: { ...loan, repayment: { ...repayment, periodic_amount: v } } } });
            }}
          />
        </Field>
        <Field label="Frequency">
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={repay.frequency}
            onChange={(e) => {
              const loan = ensureLoan();
              const repayment = ensureRepayment();
              onChange({ ...item, ite: { ...item.ite, loan: { ...loan, repayment: { ...repayment, frequency: e.target.value as BalanceFrequency } } } });
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
            value={repay.net_gross}
            onChange={(e) => {
              const loan = ensureLoan();
              const repayment = ensureRepayment();
              onChange({ ...item, ite: { ...item.ite, loan: { ...loan, repayment: { ...repayment, net_gross: e.target.value as NetGrossIndicator } } } });
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
