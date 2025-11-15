"use client";
import React from 'react';
import { Input } from '@/components/ui/input';
import Field from '@/components/ui/form/Field';
import FormGrid from '@/components/ui/form/FormGrid';
import SuggestionInline from '@/components/ui/suggestion-inline';
import { useSectionShopping } from '@/components/shopping/useSectionShopping';
import { Tooltip } from '@/components/ui/tooltip';
import { IconNotepad } from '@/components/ui/icons/IconNotepad';
import type { CashFlow } from '@/lib/types/balance';
import CashFlowFieldset from '@/components/ui/form/CashFlowFieldset';

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
        <CashFlowFieldset
          label="Amount per period"
          value={cf}
          onChange={(next) => update({ target_retirement_income: next })}
        />
        {/* Suggestions for nested cashflow fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          <div>
            {typeof (suggestions as any)?.target_retirement_income?.periodic_amount !== 'undefined' ? (
              <SuggestionInline
                value={String((suggestions as any)?.target_retirement_income?.periodic_amount ?? '')}
                onAccept={() => onAccept?.('target_retirement_income', 'periodic_amount' as any)}
                onReject={() => onReject?.('target_retirement_income', 'periodic_amount' as any)}
              />
            ) : null}
          </div>
          <div>
            {typeof (suggestions as any)?.target_retirement_income?.frequency !== 'undefined' ? (
              <SuggestionInline
                value={String((suggestions as any)?.target_retirement_income?.frequency ?? '')}
                onAccept={() => onAccept?.('target_retirement_income', 'frequency' as any)}
                onReject={() => onReject?.('target_retirement_income', 'frequency' as any)}
              />
            ) : null}
          </div>
          <div>
            {typeof (suggestions as any)?.target_retirement_income?.net_gross !== 'undefined' ? (
              <SuggestionInline
                value={String((suggestions as any)?.target_retirement_income?.net_gross ?? '')}
                onAccept={() => onAccept?.('target_retirement_income', 'net_gross' as any)}
                onReject={() => onReject?.('target_retirement_income', 'net_gross' as any)}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
