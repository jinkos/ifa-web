"use client";
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { pensionTypeOptions } from '@/lib/constants/summary';
import Field from '@/components/ui/form/Field';
import FormGrid from '@/components/ui/form/FormGrid';
import { Select } from '@/components/ui/select';
import type { PensionHolding, PensionTypes, ValueWithCurrency, CashflowItem } from '@/lib/types/summary';
import ValueWithCurrencyForm from './ValueWithCurrencyForm';
import CashflowItemForm from './CashflowItemForm';

export default function PensionHoldingForm({ value, onChange, onRemove, idBase, children }: { value: PensionHolding; onChange: (v: PensionHolding) => void; onRemove: () => void; idBase: string; children?: React.ReactNode }) {
  return (
    <div className="border rounded-md p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">Pension</div>
        <Button type="button" variant="outline" size="sm" onClick={onRemove}>
          Remove
        </Button>
      </div>
      <FormGrid colsMd={3}>
        <Field label="Description" fieldName={`Pension — ${value.description ?? 'Description'}`} showShoppingAction>
          <Input value={value.description ?? ''} onChange={(e) => onChange({ ...value, description: e.target.value })} />
        </Field>
        <Field label="Type" fieldName={`Pension — Type`} showShoppingAction>
          <Select value={value.type ?? ''} onChange={(e) => onChange({ ...value, type: (e.target.value || null) as PensionTypes | null })}>
            <option value="">Select…</option>
            {pensionTypeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
        </Field>
      </FormGrid>
      <ValueWithCurrencyForm title="Value" value={value.value as ValueWithCurrency} onChange={(v) => onChange({ ...value, value: v })} />
      <CashflowItemForm title="Contribution" value={value.contribution as CashflowItem} onChange={(v) => onChange({ ...value, contribution: v })} id={`${idBase}-contribution-is_gross`} />
      {children}
    </div>
  );
}
