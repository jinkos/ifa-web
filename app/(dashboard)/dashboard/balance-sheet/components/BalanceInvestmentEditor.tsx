"use client";
import React from 'react';
import Field from '@/components/ui/form/Field';
import { Input } from '@/components/ui/input';
import type {
  PersonalBalanceSheetItem,
  BalanceFrequency,
  NetGrossIndicator,
  CashFlow,
  InvestmentData,
} from '@/lib/types/balance';

const freqOptions: BalanceFrequency[] = [
  'weekly',
  'monthly',
  'quarterly',
  'six_monthly',
  'annually',
  'unknown',
];

const ngOptions: NetGrossIndicator[] = ['net', 'gross', 'unknown'];

type InvestmentKinds =
  | 'current_account'
  | 'gia'
  | 'isa'
  | 'premium_bond'
  | 'savings_account'
  | 'uni_fees_savings_plan'
  | 'vct';

export default function BalanceInvestmentEditor({
  item,
  onChange,
  descriptionError,
}: {
  item: Extract<PersonalBalanceSheetItem, { type: InvestmentKinds }> & { ite: InvestmentData };
  onChange: (next: PersonalBalanceSheetItem) => void;
  descriptionError?: string;
}) {
  const kind = item.type as InvestmentKinds;
  const hasContribution = !(kind === 'current_account' || kind === 'vct');
  const hasIncome = !(kind === 'uni_fees_savings_plan');

  const incomeLabel: string =
    kind === 'current_account' || kind === 'premium_bond' || kind === 'savings_account'
      ? 'Interest'
      : kind === 'gia' || kind === 'vct'
      ? 'Dividends'
      : kind === 'isa'
      ? 'Withdrawals'
      : 'Income';

  const defaultIncomeNetGross: NetGrossIndicator =
    kind === 'vct' || kind === 'premium_bond' ? 'net' : 'gross';

  const ensureContribution = (): CashFlow =>
    item.ite.contribution ?? { periodic_amount: null, frequency: 'monthly', net_gross: 'net' };
  const ensureIncome = (): CashFlow =>
    item.ite.income ?? { periodic_amount: null, frequency: 'monthly', net_gross: defaultIncomeNetGross };

  const contrib = item.ite.contribution ?? ensureContribution();
  const income = item.ite.income ?? ensureIncome();

  const displayContrib = (contrib.periodic_amount ?? 0) === 0 && contrib.periodic_amount !== null ? '' : (contrib.periodic_amount ?? '');
  const displayIncome = (income.periodic_amount ?? 0) === 0 && income.periodic_amount !== null ? '' : (income.periodic_amount ?? '');

  return (
    <div className="mt-3 rounded-md border p-3 bg-muted/30 space-y-4">
      {/* Row 1: Description (2x), Investment value, Currency */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Field label="Description" className="md:col-span-2" error={descriptionError}>
          <Input
            value={item.description ?? ''}
            onChange={(e) => onChange({ ...item, description: e.target.value })}
          />
        </Field>
        <Field label="Investment value">
          <Input
            type="number"
            inputMode="numeric"
            value={(item.ite.investment_value ?? '') as any}
            placeholder="value"
            onChange={(e) => {
              const v = e.target.value === '' ? null : Math.round(Number(e.target.value));
              onChange({ ...item, ite: { ...item.ite, investment_value: v } });
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

      {/* Row 2: Contribution amount, frequency, net/gross (if applicable) */}
      {hasContribution && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Contribution">
            <Input
              type="number"
              inputMode="numeric"
              value={displayContrib as any}
              placeholder="amount"
              onChange={(e) => {
                const v = e.target.value === '' ? null : Math.round(Number(e.target.value));
                const cf = ensureContribution();
                onChange({ ...item, ite: { ...item.ite, contribution: { ...cf, periodic_amount: v } } });
              }}
            />
          </Field>
          <Field label="Frequency">
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={contrib.frequency}
              onChange={(e) => {
                const cf = ensureContribution();
                onChange({ ...item, ite: { ...item.ite, contribution: { ...cf, frequency: e.target.value as BalanceFrequency } } });
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
              value={contrib.net_gross}
              onChange={(e) => {
                const cf = ensureContribution();
                onChange({ ...item, ite: { ...item.ite, contribution: { ...cf, net_gross: e.target.value as NetGrossIndicator } } });
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
      )}

      {/* Row 3: Income amount, frequency, net/gross (if applicable) */}
      {hasIncome && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label={incomeLabel}>
            <Input
              type="number"
              inputMode="numeric"
              value={displayIncome as any}
              placeholder="amount"
              onChange={(e) => {
                const v = e.target.value === '' ? null : Math.round(Number(e.target.value));
                const cf = ensureIncome();
                onChange({ ...item, ite: { ...item.ite, income: { ...cf, periodic_amount: v } } });
              }}
            />
          </Field>
          <Field label="Frequency">
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={income.frequency}
              onChange={(e) => {
                const cf = ensureIncome();
                onChange({ ...item, ite: { ...item.ite, income: { ...cf, frequency: e.target.value as BalanceFrequency } } });
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
              value={income.net_gross}
              onChange={(e) => {
                const cf = ensureIncome();
                onChange({ ...item, ite: { ...item.ite, income: { ...cf, net_gross: e.target.value as NetGrossIndicator } } });
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
      )}
    </div>
  );
}
