"use client";
import React from 'react';
import Field from '@/components/ui/form/Field';
import FormGrid from '@/components/ui/form/FormGrid';
import { Input } from '@/components/ui/input';
import type { PersonalBalanceSheetItem, BalanceFrequency, NetGrossIndicator } from '@/lib/types/balance';

const freqOptions: BalanceFrequency[] = [
  'weekly',
  'monthly',
  'quarterly',
  'six_monthly',
  'annually',
  'unknown',
];

const ngOptions: NetGrossIndicator[] = ['net', 'gross', 'unknown'];

export default function BalanceIncomeEditor({
  item,
  onChange,
  amountLabel = 'AMOUNT',
  descriptionError,
}: {
  item: Extract<
    PersonalBalanceSheetItem,
    { type: 'salary_income' | 'side_hustle_income' | 'self_employment_income' | 'expenses' }
  >;
  onChange: (next: PersonalBalanceSheetItem) => void;
  amountLabel?: string;
  descriptionError?: string;
}) {
  const isExpense = item.type === 'expenses';
  const cash = (item.ite as any).income ?? (item.ite as any).expenditure;
  const displayAmount = (cash.periodic_amount ?? 0) === 0 && cash.periodic_amount !== null ? '' : (cash.periodic_amount ?? '');

  return (
    <div className="mt-3 rounded-md border p-3 bg-muted/30">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Field label="Description" className="md:col-span-2" error={descriptionError}>
          <Input
            value={item.description ?? ''}
            onChange={(e) => onChange({ ...item, description: e.target.value })}
          />
        </Field>
        <Field label="Currency">
          <Input
            value={item.currency ?? ''}
            onChange={(e) => onChange({ ...item, currency: e.target.value })}
            placeholder="GBP"
          />
        </Field>
        <Field label={amountLabel}>
            <Input
              type="number"
              inputMode="numeric"
              value={displayAmount as any}
              placeholder="amount"
              onChange={(e) => {
                const v = e.target.value === '' ? null : Math.round(Number(e.target.value));
                if (isExpense) onChange({ ...item, ite: { ...item.ite, expenditure: { ...cash, periodic_amount: v } } } as any);
                else onChange({ ...item, ite: { ...item.ite, income: { ...cash, periodic_amount: v } } } as any);
              }}
            />
          </Field>
        <Field label="Frequency">
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={cash.frequency}
              onChange={(e) =>
                onChange({
                  ...item,
                  ite: isExpense ? { ...item.ite, expenditure: { ...cash, frequency: e.target.value as BalanceFrequency } } : { ...item.ite, income: { ...cash, frequency: e.target.value as BalanceFrequency } },
                } as any)
              }
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
              value={cash.net_gross}
              onChange={(e) =>
                onChange({
                  ...item,
                  ite: isExpense ? { ...item.ite, expenditure: { ...cash, net_gross: e.target.value as NetGrossIndicator } } : { ...item.ite, income: { ...cash, net_gross: e.target.value as NetGrossIndicator } },
                } as any)
              }
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
