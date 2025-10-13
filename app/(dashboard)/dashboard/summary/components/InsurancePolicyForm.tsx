"use client";
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { insuranceTypeOptions } from '@/lib/constants/summary';
import Field from '@/components/ui/form/Field';
import FormGrid from '@/components/ui/form/FormGrid';
import { Select } from '@/components/ui/select';
import type { InsurancePolicy, InsurancePolicyType, ValueWithCurrency, CashflowItem } from '@/lib/types/summary';
import ValueWithCurrencyForm from './ValueWithCurrencyForm';
import CashflowItemForm from './CashflowItemForm';

export default function InsurancePolicyForm({ value, onChange, onRemove, idBase, children }: { value: InsurancePolicy; onChange: (v: InsurancePolicy) => void; onRemove: () => void; idBase: string; children?: React.ReactNode }) {
  return (
    <div className="border rounded-md p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">Insurance Policy</div>
        <Button type="button" variant="outline" size="sm" onClick={onRemove}>
          Remove
        </Button>
      </div>
      <FormGrid colsMd={3}>
        <Field label="Description" fieldName={`Insurance — ${value.description ?? 'Description'}`} showShoppingAction>
          <Input value={value.description ?? ''} onChange={(e) => onChange({ ...value, description: e.target.value })} />
        </Field>
        <Field label="Type" fieldName={`Insurance — Type`} showShoppingAction>
          <Select value={value.type ?? ''} onChange={(e) => onChange({ ...value, type: (e.target.value || null) as InsurancePolicyType | null })}>
            <option value="">Select…</option>
            {insuranceTypeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
        </Field>
      </FormGrid>
      <ValueWithCurrencyForm title="Coverage Amount" value={value.coverage_amount as ValueWithCurrency} onChange={(v) => onChange({ ...value, coverage_amount: v })} />
      <CashflowItemForm title="Premium" value={value.premium as CashflowItem} onChange={(v) => onChange({ ...value, premium: v })} id={`${idBase}-premium-is_gross`} />
      {children}
    </div>
  );
}
