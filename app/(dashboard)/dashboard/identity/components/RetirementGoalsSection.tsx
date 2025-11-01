"use client";
import React from 'react';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import Field from '@/components/ui/form/Field';
import FormGrid from '@/components/ui/form/FormGrid';
import SuggestionInline from '@/components/ui/suggestion-inline';
import { useSectionShopping } from '@/components/shopping/useSectionShopping';
import { Tooltip } from '@/components/ui/tooltip';
import { IconNotepad } from '@/components/ui/icons/IconNotepad';
import type { CashFlow, BalanceFrequency } from '@/lib/types/balance';

export type RetirementValue = {
  target_retirement_age?: number | null;
  target_retirement_income?: CashFlow | null;
};

export default function RetirementGoalsSection({
  value,
  update,
  suggestions,
  onAccept,
  onReject,
}: {
  value: RetirementValue;
  update: (patch: Partial<RetirementValue>) => void;
  suggestions?: Partial<RetirementValue> | null;
  onAccept?: (key: keyof RetirementValue, subkey?: keyof CashFlow) => void;
  onReject?: (key: keyof RetirementValue, subkey?: keyof CashFlow) => void;
}) {
  const sectionKey = 'identity.retirement_goals';
  const sectionTitle = 'Retirement & Goals';
  const { inShopping, toggle } = useSectionShopping(sectionKey, sectionTitle, 'Identity');

  const cf = value.target_retirement_income ?? null;
  const netGrossToSelect = (ng: CashFlow['net_gross'] | undefined) => (ng === 'gross' ? 'gross' : ng === 'net' ? 'net' : '');
  const selectToNetGross = (s: string): CashFlow['net_gross'] => (s === 'gross' ? 'gross' : s === 'net' ? 'net' : 'unknown');
  const freqToSelect = (f: BalanceFrequency | undefined) => (f === 'weekly' || f === 'monthly' || f === 'quarterly' || f === 'annually' ? f : '');
  const selectToFreq = (s: string): BalanceFrequency => (s === 'weekly' || s === 'monthly' || s === 'quarterly' || s === 'annually' ? s : 'unknown');

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4 border-b pb-2">
        <h2 className="text-xl font-semibold">Retirement Goals</h2>
        <Tooltip content="Add to shopping list">
          <button
            aria-pressed={inShopping}
            title="Add to shopping list"
            type="button"
            className={"p-1 rounded " + (inShopping ? 'bg-amber-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100')}
            onClick={toggle}
          >
            <IconNotepad filled={inShopping} />
          </button>
        </Tooltip>
      </div>
      <FormGrid colsMd={2}>
        <Field label="Target retirement age">
          <Input
            type="number"
            className="text-lg font-semibold"
            value={value.target_retirement_age ?? ''}
            onChange={(e) => update({ target_retirement_age: e.target.value === '' ? null : Number(e.target.value) })}
          />
          {typeof suggestions?.target_retirement_age !== 'undefined' ? (
            <SuggestionInline
              value={String(suggestions?.target_retirement_age ?? '')}
              onAccept={() => onAccept?.('target_retirement_age')}
              onReject={() => onReject?.('target_retirement_age')}
            />
          ) : null}
        </Field>
      </FormGrid>

      <div className="mt-4">
        <h3 className="text-base font-medium mb-3">Target retirement income (today's money)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Amount per period">
            <NumberInput
              value={(cf?.periodic_amount ?? null) as any}
              placeholder="amount"
              onValueChange={(v) =>
                update({
                  target_retirement_income: {
                    periodic_amount: v == null ? null : Math.round(v),
                    frequency: cf?.frequency ?? 'unknown',
                    net_gross: cf?.net_gross ?? 'unknown',
                  },
                })
              }
            />
            {typeof (suggestions as any)?.target_retirement_income?.periodic_amount !== 'undefined' ? (
              <SuggestionInline
                value={String((suggestions as any)?.target_retirement_income?.periodic_amount ?? '')}
                onAccept={() => onAccept?.('target_retirement_income', 'periodic_amount' as any)}
                onReject={() => onReject?.('target_retirement_income', 'periodic_amount' as any)}
              />
            ) : null}
          </Field>
          <Field label="Frequency">
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={freqToSelect(cf?.frequency)}
              onChange={(e) =>
                update({
                  target_retirement_income: {
                    periodic_amount: cf?.periodic_amount ?? 0,
                    frequency: selectToFreq(e.target.value),
                    net_gross: cf?.net_gross ?? 'unknown',
                  },
                })
              }
            >
              <option value="">Select...</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annually">Annually</option>
            </select>
            {typeof (suggestions as any)?.target_retirement_income?.frequency !== 'undefined' ? (
              <SuggestionInline
                value={String((suggestions as any)?.target_retirement_income?.frequency ?? '')}
                onAccept={() => onAccept?.('target_retirement_income', 'frequency' as any)}
                onReject={() => onReject?.('target_retirement_income', 'frequency' as any)}
              />
            ) : null}
          </Field>
          <Field label="Net/Gross">
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={netGrossToSelect(cf?.net_gross)}
              onChange={(e) =>
                update({
                  target_retirement_income: {
                    periodic_amount: cf?.periodic_amount ?? 0,
                    frequency: cf?.frequency ?? 'unknown',
                    net_gross: selectToNetGross(e.target.value),
                  },
                })
              }
            >
              <option value="">Select...</option>
              <option value="gross">Gross</option>
              <option value="net">Net</option>
            </select>
            {typeof (suggestions as any)?.target_retirement_income?.net_gross !== 'undefined' ? (
              <SuggestionInline
                value={String((suggestions as any)?.target_retirement_income?.net_gross ?? '')}
                onAccept={() => onAccept?.('target_retirement_income', 'net_gross' as any)}
                onReject={() => onReject?.('target_retirement_income', 'net_gross' as any)}
              />
            ) : null}
          </Field>
        </div>
      </div>
    </section>
  );
}
