"use client";
import React from 'react';
import Field from '@/components/ui/form/Field';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import type { PersonalBalanceSheetItem, BalanceFrequency, NetGrossIndicator, CashFlow, Debt } from '@/lib/types/balance';

const freqOptions: BalanceFrequency[] = [
  'weekly',
  'monthly',
  'quarterly',
  'six_monthly',
  'annually',
  'unknown',
];

const ngOptions: NetGrossIndicator[] = ['net', 'gross', 'unknown'];

export default function BalanceBuyToLetEditor({
  item,
  onChange,
  descriptionError,
}: {
  item: Extract<PersonalBalanceSheetItem, { type: 'buy_to_let' }>;
  onChange: (next: PersonalBalanceSheetItem) => void;
  descriptionError?: string;
}) {
  const rental = item.ite.rental_income;
  

  const ensureLoan = (): Debt => item.ite.loan ?? { balance: null, repayment: null };
  const ensureRepayment = (): CashFlow => ensureLoan().repayment ?? { periodic_amount: null, frequency: 'monthly', net_gross: 'net' };

  return (
    <div className="mt-3 rounded-md border p-3 bg-muted/30 space-y-4">
      {/* Row 1: Description, Property value, Currency */}
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
        <Field label="Property value">
          <NumberInput
            value={(item.ite.property_value ?? null) as any}
            placeholder="value"
            onValueChange={(v) => {
              const val = v == null ? null : Math.round(v);
              onChange({ ...item, ite: { ...item.ite, property_value: val } });
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
      {/* Row 2: Rent amount, frequency, net/gross */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Rent">
          <NumberInput
            value={(rental.periodic_amount ?? null) as any}
            placeholder="amount"
            onValueChange={(v) => {
              const val = v == null ? null : Math.round(v);
              onChange({ ...item, ite: { ...item.ite, rental_income: { ...rental, periodic_amount: val } } });
            }}
          />
        </Field>
        <Field label="Frequency">
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={rental.frequency}
            onChange={(e) =>
              onChange({
                ...item,
                ite: { ...item.ite, rental_income: { ...rental, frequency: e.target.value as BalanceFrequency } },
              })
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
            value={rental.net_gross}
            onChange={(e) =>
              onChange({
                ...item,
                ite: { ...item.ite, rental_income: { ...rental, net_gross: e.target.value as NetGrossIndicator } },
              })
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

      {/* Row 3: Mortgage balance, repayment, frequency, net/gross */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Field label="Mortgage Balance">
          <NumberInput
            value={(item.ite.loan?.balance ?? null) as any}
            placeholder="balance"
            onValueChange={(v) => {
              const val = v == null ? null : Math.round(v);
              const loan = ensureLoan();
              onChange({ ...item, ite: { ...item.ite, loan: { ...loan, balance: val } } });
            }}
          />
        </Field>
        <Field label="Repayment">
          <NumberInput
            value={(item.ite.loan?.repayment?.periodic_amount ?? null) as any}
            placeholder="amount"
            onValueChange={(v) => {
              const val = v == null ? null : Math.round(v);
              const loan = ensureLoan();
              const repay = ensureRepayment();
              onChange({ ...item, ite: { ...item.ite, loan: { ...loan, repayment: { ...repay, periodic_amount: val } } } });
            }}
          />
        </Field>
        <Field label="Frequency">
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={item.ite.loan?.repayment?.frequency ?? 'unknown'}
            onChange={(e) => {
              const loan = ensureLoan();
              const repay = ensureRepayment();
              onChange({ ...item, ite: { ...item.ite, loan: { ...loan, repayment: { ...repay, frequency: e.target.value as BalanceFrequency } } } });
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
            value={item.ite.loan?.repayment?.net_gross ?? 'unknown'}
            onChange={(e) => {
              const loan = ensureLoan();
              const repay = ensureRepayment();
              onChange({ ...item, ite: { ...item.ite, loan: { ...loan, repayment: { ...repay, net_gross: e.target.value as NetGrossIndicator } } } });
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
