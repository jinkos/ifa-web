"use client";
import React from 'react';
import Field from '@/components/ui/form/Field';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
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

type PropertyKinds = 'main_residence' | 'holiday_home' | 'other_valuable_item';

export default function BalancePropertyEditor({
  item,
  onChange,
  descriptionError,
}: {
  item: Extract<PersonalBalanceSheetItem, { type: PropertyKinds }> & { ite: PropertyData };
  onChange: (next: PersonalBalanceSheetItem) => void;
  descriptionError?: string;
}) {
  const isValuableItem = item.type === 'other_valuable_item';
  const valueLabel = isValuableItem ? 'Item value' : 'Property value';
  const balanceLabel = isValuableItem ? 'Loan Balance' : 'Mortgage Balance';
  const repayLabel = 'Repayment';

  const ensureLoan = (): Debt => item.ite.loan ?? { balance: null, repayment: null };
  const ensureRepayment = (): CashFlow => ensureLoan().repayment ?? { periodic_amount: null, frequency: 'monthly', net_gross: 'net' };

  const repay = ensureRepayment();
  

  return (
    <div className="mt-3 rounded-md border p-3 bg-muted/30 space-y-4">
      {/* Row 1: Description (2x), Value, Currency */}
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
        <Field label={valueLabel}>
          <NumberInput
            value={item.ite.value ?? null}
            placeholder="value"
            onValueChange={(v) => {
              const val = v == null ? null : Math.round(v);
              onChange({ ...item, ite: { ...item.ite, value: val } });
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
          <NumberInput
            value={item.ite.loan?.balance ?? null}
            placeholder="balance"
            onValueChange={(v) => {
              const val = v == null ? null : Math.round(v);
              const loan = ensureLoan();
              onChange({ ...item, ite: { ...item.ite, loan: { ...loan, balance: val } } });
            }}
          />
        </Field>
        <Field label={repayLabel}>
          <NumberInput
            value={repay.periodic_amount ?? null}
            placeholder="amount"
            onValueChange={(v) => {
              const val = v == null ? null : Math.round(v);
              const loan = ensureLoan();
              const repayment = ensureRepayment();
              onChange({ ...item, ite: { ...item.ite, loan: { ...loan, repayment: { ...repayment, periodic_amount: val } } } });
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
