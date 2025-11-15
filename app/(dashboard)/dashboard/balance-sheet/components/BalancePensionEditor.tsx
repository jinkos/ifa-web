"use client";
import React from 'react';
import Field from '@/components/ui/form/Field';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { CashFlowFieldset } from '@/components/ui/form/CashFlowFieldset';
import type { PersonalBalanceSheetItem, CashFlow, NonStatePensionData, StatePensionData } from '@/lib/types/balance';

type PensionKinds = 'workplace_pension' | 'defined_benefit_pension' | 'personal_pension' | 'state_pension';

export default function BalancePensionEditor({
  item,
  onChange,
  descriptionError,
}: {
  item: Extract<PersonalBalanceSheetItem, { type: PensionKinds }> & { ite: NonStatePensionData | StatePensionData };
  onChange: (next: PersonalBalanceSheetItem) => void;
  descriptionError?: string;
}) {
  const isState = item.type === 'state_pension';
  const ensureContribution = (): CashFlow =>
    (item as any).ite.contribution ?? { periodic_amount: null, frequency: 'monthly', net_gross: 'gross' };
  const ensureIncome = (): CashFlow =>
    (item as any).ite.income ?? { periodic_amount: null, frequency: 'monthly', net_gross: 'net' };
  const ensureEmployerContribution = (): CashFlow =>
    (item as any).ite.employer_contribution ?? { periodic_amount: null, frequency: 'monthly', net_gross: 'gross' };
  const ensurePension = (): CashFlow =>
    (item as any).ite.pension ?? { periodic_amount: null, frequency: 'monthly', net_gross: 'net' };

  const contrib = isState ? undefined : ((item as any).ite.contribution ?? ensureContribution());
  const employer = isState ? undefined : ((item as any).ite.employer_contribution ?? ensureEmployerContribution());
  const income = isState ? undefined : ((item as any).ite.income ?? ensureIncome());
  const pension = isState ? ((item as any).ite.pension ?? ensurePension()) : undefined;

  // display values handled by CashFlowFieldset

  return (
    <div className="mt-3 rounded-md border p-3 bg-muted/30 space-y-4">
      {/* Row 1: Description (2x), Pot value (non-state only), Currency */}
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
        {!isState && (
          <Field label="Pension value">
            <NumberInput
              value={(((item as any).ite.investment_value ?? null) as any)}
              placeholder="value"
              onValueChange={(v) => {
                const val = v == null ? null : Math.round(v);
                onChange({ ...(item as any), ite: { ...(item as any).ite, investment_value: val } });
              }}
            />
          </Field>
        )}
        <Field label="Currency">
          <Input
            value={item.currency ?? ''}
            onChange={(e) => onChange({ ...item, currency: e.target.value })}
            placeholder="GBP"
          />
        </Field>
      </div>

      {/* Row 2: Personal Contribution (gross), frequency, net/gross (non-state only) */}
      {!isState && (
        <div className="md:col-span-3">
          <CashFlowFieldset
            label="Personal Contribution"
            value={contrib!}
            onChange={(next) => onChange({ ...(item as any), ite: { ...(item as any).ite, contribution: next } })}
          />
        </div>
      )}

      {/* Row 3: Employer Contribution (gross), frequency, net/gross (non-state only) */}
      {!isState && (
        <div className="md:col-span-3">
          <CashFlowFieldset
            label="Employer Contribution"
            value={employer!}
            onChange={(next) => onChange({ ...(item as any), ite: { ...(item as any).ite, employer_contribution: next } })}
          />
        </div>
      )}

      {/* Row 4: Drawings (non-state) OR State pension cash flow */}
      <div className="md:col-span-3">
        <CashFlowFieldset
          label={isState ? 'State pension' : 'Drawings'}
          value={isState ? pension! : income!}
          onChange={(next) => {
            if (isState) onChange({ ...(item as any), ite: { ...(item as any).ite, pension: next } });
            else onChange({ ...(item as any), ite: { ...(item as any).ite, income: next } });
          }}
        />
      </div>
    </div>
  );
}
