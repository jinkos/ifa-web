"use client";
import React from 'react';
import { Input } from '@/components/ui/input';
import CashFlowFieldset from '@/components/ui/form/CashFlowFieldset';
import Field from '@/components/ui/form/Field';
import FormGrid from '@/components/ui/form/FormGrid';
import SuggestionInline from '@/components/ui/suggestion-inline';
import { useSectionShopping } from '@/components/shopping/useSectionShopping';
import { Tooltip } from '@/components/ui/tooltip';
import { IconNotepad } from '@/components/ui/icons/IconNotepad';

type CashflowItem = {
  description?: string | null;
  inflow?: boolean | null;
  amount?: number | null;
  currency?: string | null;
  frequency?: 'weekly' | 'monthly' | 'quarterly' | 'annually' | null;
  is_gross?: boolean | null;
};

type FormData = {
  target_retirement_age?: number | null;
  target_retirement_income?: CashflowItem | null;
};

export default function RetirementGoalsSection<T extends FormData>({
  form,
  setForm,
  suggestions,
  onAccept,
  onReject,
}: {
  form: T;
  setForm: React.Dispatch<React.SetStateAction<T>>;
  suggestions?: Partial<FormData> | null;
  onAccept?: (key: keyof FormData, subkey?: keyof CashflowItem) => void;
  onReject?: (key: keyof FormData, subkey?: keyof CashflowItem) => void;
}) {
  const retirementIncome = form.target_retirement_income || {};
  const sectionKey = 'balance.retirement_goals';
  const sectionTitle = 'Retirement & Goals';
  const { inShopping, toggle } = useSectionShopping(sectionKey, sectionTitle, 'Balance sheet');

  const updateRetirementIncome = (updates: Partial<CashflowItem>) => {
    setForm({
      ...form,
      target_retirement_income: {
        ...retirementIncome,
        ...updates,
      },
    });
  };

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
            value={form.target_retirement_age ?? ''}
            onChange={(e) =>
              setForm({
                ...form,
                target_retirement_age: e.target.value === '' ? null : Number(e.target.value),
              })
            }
          />
          {typeof suggestions?.target_retirement_age !== 'undefined' ? (
            <SuggestionInline
              value={String(suggestions?.target_retirement_age ?? '')}
              onAccept={() => {
                setForm({
                  ...form,
                  target_retirement_age: suggestions?.target_retirement_age ?? null,
                });
                onAccept?.('target_retirement_age');
              }}
              onReject={() => onReject?.('target_retirement_age')}
            />
          ) : null}
        </Field>
      </FormGrid>

      <div className="mt-4">
        <h3 className="text-base font-medium mb-3">Target retirement income (today's money)</h3>
        <CashFlowFieldset
          label="Amount per period"
          value={(() => {
            // Adapt the local legacy CashflowItem to CashFlow-like shape for the fieldset
            const amount = retirementIncome.amount ?? null;
            const periodic_amount = amount === null ? null : Math.round(amount as number);
            const frequency = ((): any => {
              const f = retirementIncome.frequency;
              return f === 'weekly' || f === 'monthly' || f === 'quarterly' || f === 'annually' ? f : 'unknown';
            })();
            const net_gross = retirementIncome.is_gross === true ? 'gross' : retirementIncome.is_gross === false ? 'net' : 'unknown';
            return { periodic_amount, frequency, net_gross };
          })() as any}
          onChange={(next) => {
            updateRetirementIncome({
              amount: next.periodic_amount,
              frequency: ((): any => (next.frequency === 'weekly' || next.frequency === 'monthly' || next.frequency === 'quarterly' || next.frequency === 'annually' ? next.frequency : null))(),
              is_gross: next.net_gross === 'gross' ? true : next.net_gross === 'net' ? false : null,
            });
          }}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          <div>
            {typeof suggestions?.target_retirement_income?.amount !== 'undefined' ? (
              <SuggestionInline
                value={String(suggestions?.target_retirement_income?.amount ?? '')}
                onAccept={() => {
                  updateRetirementIncome({ amount: suggestions?.target_retirement_income?.amount ?? null });
                  onAccept?.('target_retirement_income', 'amount');
                }}
                onReject={() => onReject?.('target_retirement_income', 'amount')}
              />
            ) : null}
          </div>
          <div>
            {typeof suggestions?.target_retirement_income?.frequency !== 'undefined' ? (
              <SuggestionInline
                value={String(suggestions?.target_retirement_income?.frequency ?? '')}
                onAccept={() => {
                  updateRetirementIncome({ frequency: suggestions?.target_retirement_income?.frequency ?? null as any });
                  onAccept?.('target_retirement_income', 'frequency');
                }}
                onReject={() => onReject?.('target_retirement_income', 'frequency')}
              />
            ) : null}
          </div>
          <div>
            {typeof suggestions?.target_retirement_income?.is_gross !== 'undefined' ? (
              <SuggestionInline
                value={
                  suggestions?.target_retirement_income?.is_gross === null || suggestions?.target_retirement_income?.is_gross === undefined
                    ? ''
                    : suggestions?.target_retirement_income?.is_gross
                    ? 'gross'
                    : 'net'
                }
                onAccept={() => {
                  updateRetirementIncome({ is_gross: suggestions?.target_retirement_income?.is_gross ?? null });
                  onAccept?.('target_retirement_income', 'is_gross');
                }}
                onReject={() => onReject?.('target_retirement_income', 'is_gross')}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
