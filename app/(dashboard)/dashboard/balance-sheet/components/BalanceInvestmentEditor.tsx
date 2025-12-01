"use client";
import React from 'react';
import Field from '@/components/ui/form/Field';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { CashFlowFieldset } from '@/components/ui/form/CashFlowFieldset';
import type { PersonalBalanceSheetItem, InvestmentData } from '@/lib/types/balance';

type InvestmentKinds =
  | 'current_account'
  | 'deposit_account'
  | 'gia'
  | 'isa'
  | 'premium_bond'
  | 'savings_account'
  | 'uni_fees_savings_plan'
  | 'vct'
  | 'eis'
  | 'IHT_scheme'
  | 'life_insurance'
  | 'whole_of_life_policy';

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
    kind === 'current_account' || kind === 'deposit_account' || kind === 'premium_bond' || kind === 'savings_account'
      ? 'Interest'
      : kind === 'gia' || kind === 'vct' || kind === 'eis' || kind === 'IHT_scheme'
      ? 'Dividends'
      : kind === 'isa'
      ? 'Withdrawals'
      : kind === 'life_insurance' || kind === 'whole_of_life_policy'
      ? 'Payouts'
      : 'Income';

  const contrib = item.ite.contribution ?? null;
  const income = item.ite.income ?? null;

  return (
    <div className="mt-3 rounded-md border p-3 bg-muted/30 space-y-4">
      {/* Row 1: Description (2x), Investment value, Currency */}
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
        <Field label="Investment value">
          <NumberInput
            value={item.ite.investment_value ?? null}
            onValueChange={(v) => onChange({ ...item, ite: { ...item.ite, investment_value: (v == null ? null : Math.round(v)) } })}
            decimals={0}
            placeholder="value"
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

      {/* Row 2: Contribution (if applicable) */}
      {hasContribution && (
        <div className="md:col-span-3">
          <CashFlowFieldset
            label="Contribution"
            value={contrib}
            onChange={(next) => onChange({ ...item, ite: { ...item.ite, contribution: next } })}
          />
        </div>
      )}

      {/* Row 3: Income (if applicable) */}
      {hasIncome && (
        <div className="md:col-span-3">
          <CashFlowFieldset
            label={incomeLabel}
            value={income}
            onChange={(next) => onChange({ ...item, ite: { ...item.ite, income: next } })}
          />
        </div>
      )}
    </div>
  );
}
