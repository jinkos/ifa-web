"use client";
import React from 'react';
import Field from '@/components/ui/form/Field';
import { NumberInput } from '@/components/ui/number-input';
import type { BalanceFrequency, CashFlow, NetGrossIndicator } from '@/lib/types/balance';
import { BALANCE_FREQUENCIES, NET_GROSS_VALUES, formatFrequency, formatNetGross } from '@/lib/types/balance';
import { normalizeCashFlow } from '@/lib/schemas/domain';

const freqOptions: readonly BalanceFrequency[] = BALANCE_FREQUENCIES;
const ngOptions: readonly NetGrossIndicator[] = NET_GROSS_VALUES;

export function CashFlowFieldset({
  label = 'Amount',
  value,
  onChange,
  className,
}: {
  label?: string;
  value: CashFlow | null | undefined;
  onChange: (next: CashFlow) => void;
  className?: string;
}) {
  const cf = normalizeCashFlow(value);
  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label={label}>
          <NumberInput
            value={(cf.periodic_amount ?? null) as any}
            placeholder="amount"
            onValueChange={(v) => {
              const val = v == null ? null : Math.round(v);
              onChange({ ...cf, periodic_amount: val });
            }}
          />
        </Field>
        <Field label="Frequency">
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={cf.frequency}
            onChange={(e) => onChange({ ...cf, frequency: e.target.value as BalanceFrequency })}
          >
            {freqOptions.map((f) => (
              <option key={f} value={f}>
                {formatFrequency(f)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Net/Gross">
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={cf.net_gross}
            onChange={(e) => onChange({ ...cf, net_gross: e.target.value as NetGrossIndicator })}
          >
            {ngOptions.map((ng) => (
              <option key={ng} value={ng}>
                {formatNetGross(ng)}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  );
}

export default CashFlowFieldset;
