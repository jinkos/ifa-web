"use client";
import React from 'react';
import { Input } from '@/components/ui/input';
import Field from '@/components/ui/form/Field';
import FormGrid from '@/components/ui/form/FormGrid';
import type { ValueWithCurrency } from '@/lib/types/summary';

export default function ValueWithCurrencyForm({ value, onChange, title }: { value: ValueWithCurrency | null | undefined; onChange: (v: ValueWithCurrency | null) => void; title?: string }) {
  const v = value ?? {};
  return (
    <div className="border rounded-md p-3 space-y-3">
      {title && <div className="font-medium text-sm">{title}</div>}
      <FormGrid colsMd={3}>
        <Field label="Description" fieldName={`${title ?? 'Value'} — Description`} showShoppingAction>
          <Input value={v.description ?? ''} onChange={(e) => onChange({ ...v, description: e.target.value })} />
        </Field>
        <Field label="Amount" fieldName={`${title ?? 'Value'} — Amount`} showShoppingAction>
          <Input type="number" value={v.amount ?? ''} onChange={(e) => onChange({ ...v, amount: e.target.value === '' ? null : Number(e.target.value) })} />
        </Field>
        <Field label="Currency" fieldName={`${title ?? 'Value'} — Currency`} showShoppingAction>
          <Input value={v.currency ?? 'GBP'} onChange={(e) => onChange({ ...v, currency: e.target.value })} />
        </Field>
      </FormGrid>
    </div>
  );
}
