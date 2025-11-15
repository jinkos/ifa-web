"use client";
import React from 'react';
import Field from '@/components/ui/form/Field';
import FormGrid from '@/components/ui/form/FormGrid';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { CashFlowFieldset } from '@/components/ui/form/CashFlowFieldset';
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

  return (
    <div className="mt-3 rounded-md border p-3 bg-muted/30">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
        <Field label="Currency">
          <Input
            value={item.currency ?? ''}
            onChange={(e) => onChange({ ...item, currency: e.target.value })}
            placeholder="GBP"
          />
        </Field>
        <div className="md:col-span-3">
          <CashFlowFieldset
            label={amountLabel}
            value={cash}
            onChange={(next) => {
              if (isExpense) onChange({ ...item, ite: { ...item.ite, expenditure: next } } as any);
              else onChange({ ...item, ite: { ...item.ite, income: next } } as any);
            }}
          />
        </div>
      </div>
    </div>
  );
}
