"use client";
import React from 'react';
import Field from '@/components/ui/form/Field';
import { Input } from '@/components/ui/input';
import type {
  PersonalBalanceSheetItem,
  BalanceFrequency,
  NetGrossIndicator,
  CashFlow,
  NonStatePensionData,
  StatePensionData,
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

  const displayContrib = isState ? '' : ((contrib!.periodic_amount ?? 0) === 0 && contrib!.periodic_amount !== null ? '' : (contrib!.periodic_amount ?? ''));
  const displayEmployer = isState ? '' : ((employer!.periodic_amount ?? 0) === 0 && employer!.periodic_amount !== null ? '' : (employer!.periodic_amount ?? ''));
  const displayIncome = isState ? '' : ((income!.periodic_amount ?? 0) === 0 && income!.periodic_amount !== null ? '' : (income!.periodic_amount ?? ''));
  const displayPension = isState ? (((pension!.periodic_amount ?? 0) === 0 && pension!.periodic_amount !== null) ? '' : (pension!.periodic_amount ?? '')) : '';

  return (
    <div className="mt-3 rounded-md border p-3 bg-muted/30 space-y-4">
      {/* Row 1: Description (2x), Pot value (non-state only), Currency */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Field label="Description" className="md:col-span-2" error={descriptionError}>
          <Input
            value={item.description ?? ''}
            onChange={(e) => onChange({ ...item, description: e.target.value })}
          />
        </Field>
        {!isState && (
          <Field label="Pension value">
            <Input
              type="number"
              inputMode="numeric"
              value={(((item as any).ite.investment_value ?? '') as any)}
              placeholder="value"
              onChange={(e) => {
                const v = e.target.value === '' ? null : Math.round(Number(e.target.value));
                onChange({ ...(item as any), ite: { ...(item as any).ite, investment_value: v } });
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Personal Contribution">
            <Input
              type="number"
              inputMode="numeric"
              value={displayContrib as any}
              placeholder="amount"
              onChange={(e) => {
                const v = e.target.value === '' ? null : Math.round(Number(e.target.value));
                const cf = ensureContribution();
                onChange({ ...(item as any), ite: { ...(item as any).ite, contribution: { ...cf, periodic_amount: v } } });
              }}
            />
          </Field>
          <Field label="Frequency">
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={contrib!.frequency}
              onChange={(e) => {
                const cf = ensureContribution();
                onChange({ ...(item as any), ite: { ...(item as any).ite, contribution: { ...cf, frequency: e.target.value as BalanceFrequency } } });
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
              value={contrib!.net_gross}
              onChange={(e) => {
                const cf = ensureContribution();
                onChange({ ...(item as any), ite: { ...(item as any).ite, contribution: { ...cf, net_gross: e.target.value as NetGrossIndicator } } });
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

      {/* Row 3: Employer Contribution (gross), frequency, net/gross (non-state only) */}
      {!isState && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Employer Contribution">
            <Input
              type="number"
              inputMode="numeric"
              value={displayEmployer as any}
              placeholder="amount"
              onChange={(e) => {
                const v = e.target.value === '' ? null : Math.round(Number(e.target.value));
                const cf = ensureEmployerContribution();
                onChange({ ...(item as any), ite: { ...(item as any).ite, employer_contribution: { ...cf, periodic_amount: v } } });
              }}
            />
          </Field>
          <Field label="Frequency">
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={employer!.frequency}
              onChange={(e) => {
                const cf = ensureEmployerContribution();
                onChange({ ...(item as any), ite: { ...(item as any).ite, employer_contribution: { ...cf, frequency: e.target.value as BalanceFrequency } } });
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
              value={employer!.net_gross}
              onChange={(e) => {
                const cf = ensureEmployerContribution();
                onChange({ ...(item as any), ite: { ...(item as any).ite, employer_contribution: { ...cf, net_gross: e.target.value as NetGrossIndicator } } });
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

      {/* Row 4: Drawings (non-state) OR State pension cash flow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label={isState ? 'State pension' : 'Drawings'}>
          <Input
            type="number"
            inputMode="numeric"
            value={(isState ? displayPension : displayIncome) as any}
            placeholder="amount"
            onChange={(e) => {
              const v = e.target.value === '' ? null : Math.round(Number(e.target.value));
              if (isState) {
                const cf = ensurePension();
                onChange({ ...(item as any), ite: { ...(item as any).ite, pension: { ...cf, periodic_amount: v } } });
              } else {
                const cf = ensureIncome();
                onChange({ ...(item as any), ite: { ...(item as any).ite, income: { ...cf, periodic_amount: v } } });
              }
            }}
          />
        </Field>
        <Field label="Frequency">
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={(isState ? pension!.frequency : income!.frequency)}
            onChange={(e) => {
              if (isState) {
                const cf = ensurePension();
                onChange({ ...(item as any), ite: { ...(item as any).ite, pension: { ...cf, frequency: e.target.value as BalanceFrequency } } });
              } else {
                const cf = ensureIncome();
                onChange({ ...(item as any), ite: { ...(item as any).ite, income: { ...cf, frequency: e.target.value as BalanceFrequency } } });
              }
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
            value={(isState ? pension!.net_gross : income!.net_gross)}
            onChange={(e) => {
              if (isState) {
                const cf = ensurePension();
                onChange({ ...(item as any), ite: { ...(item as any).ite, pension: { ...cf, net_gross: e.target.value as NetGrossIndicator } } });
              } else {
                const cf = ensureIncome();
                onChange({ ...(item as any), ite: { ...(item as any).ite, income: { ...cf, net_gross: e.target.value as NetGrossIndicator } } });
              }
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
