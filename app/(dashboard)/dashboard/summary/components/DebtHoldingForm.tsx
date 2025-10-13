"use client";
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { debtTypeOptions } from '@/lib/constants/summary';
import Field from '@/components/ui/form/Field';
import FormGrid from '@/components/ui/form/FormGrid';
import { Select } from '@/components/ui/select';
import type { DebtHolding, DebtType, ValueWithCurrency, CashflowItem } from '@/lib/types/summary';
import ValueWithCurrencyForm from './ValueWithCurrencyForm';
import CashflowItemForm from './CashflowItemForm';

export default function DebtHoldingForm({ value, onChange, onRemove, idBase, children }: { value: DebtHolding; onChange: (v: DebtHolding) => void; onRemove: () => void; idBase: string; children?: React.ReactNode }) {
  return (
    <div className="border rounded-md p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">Debt</div>
        <Button type="button" variant="outline" size="sm" onClick={onRemove}>
          Remove
        </Button>
      </div>
      <FormGrid colsMd={3}>
        <Field label="Description" fieldName={`Debt — ${value.description ?? 'Description'}`} showShoppingAction>
          <Input value={value.description ?? ''} onChange={(e) => onChange({ ...value, description: e.target.value })} />
        </Field>
        <Field label="Type" fieldName={`Debt — Type`} showShoppingAction>
          <Select value={value.type ?? ''} onChange={(e) => onChange({ ...value, type: (e.target.value || null) as DebtType | null })}>
            <option value="">Select…</option>
            {debtTypeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
        </Field>
      </FormGrid>
      <ValueWithCurrencyForm title="Balance" value={value.balance as ValueWithCurrency} onChange={(v) => onChange({ ...value, balance: v })} />
      <CashflowItemForm title="Repayment" value={value.repayment as CashflowItem} onChange={(v) => onChange({ ...value, repayment: v })} id={`${idBase}-repayment-is_gross`} />
      {children}
    </div>
  );
}
