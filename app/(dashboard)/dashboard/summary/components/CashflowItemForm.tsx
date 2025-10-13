"use client";
import React, { useId } from 'react';
import { useShoppingList } from '@/components/shopping/ShoppingListContext';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { frequencyOptions } from '@/lib/constants/summary';
import Field from '@/components/ui/form/Field';
import FormGrid from '@/components/ui/form/FormGrid';
import { Select } from '@/components/ui/select';
import type { CashflowItem, FrequencyType } from '@/lib/types/summary';

type Props = {
  value: CashflowItem | null | undefined;
  onChange: (v: CashflowItem | null) => void;
  title?: string;
  id?: string;
  hideDescription?: boolean;
};

export default function CashflowItemForm({ value, onChange, title, id, hideDescription }: Props) {
  const v = value ?? {};
  const reactId = useId();
  const fieldId = id ?? `f-${reactId}`;
  const shopping = useShoppingList();
  const alreadyAdded = shopping.exists(fieldId);
  return (
    <div className="border rounded-md p-3 space-y-3">
      {title && <div className="font-medium text-sm">{title}</div>}
      <FormGrid colsMd={3}>
        {!hideDescription && (
          <Field label="Description" fieldName={`${title ?? 'Cashflow'} — Description`} showShoppingAction>
            <Input value={v.description ?? ''} onChange={(e) => onChange({ ...v, description: e.target.value })} />
          </Field>
        )}

        <Field label="Amount" fieldName={`${title ?? 'Cashflow'} — Amount`} showShoppingAction>
          <Input type="number" className="text-lg font-semibold" value={v.amount ?? ''} onChange={(e) => onChange({ ...v, amount: e.target.value === '' ? null : Number(e.target.value) })} />
        </Field>

        <Field label="Currency" fieldName={`${title ?? 'Cashflow'} — Currency`} showShoppingAction>
          <Input className="text-lg font-semibold" value={v.currency ?? 'GBP'} onChange={(e) => onChange({ ...v, currency: e.target.value })} />
        </Field>

        <Field label="Frequency" fieldName={`${title ?? 'Cashflow'} — Frequency`} showShoppingAction>
          <Select className="text-lg font-semibold" value={v.frequency ?? ''} onChange={(e) => onChange({ ...v, frequency: e.target.value ? (e.target.value as FrequencyType) : null })}>
            <option value="">Select frequency</option>
            {frequencyOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex items-center gap-3 mt-6">
          <Switch id={id ?? undefined} checked={!!v.is_gross} onCheckedChange={(checked) => onChange({ ...v, is_gross: checked })} label={v.is_gross ? 'Gross' : 'Net'} />
          <button
            type="button"
            aria-pressed={alreadyAdded}
            className={"ml-1 inline-flex items-center justify-center rounded px-2 py-0.5 text-sm font-medium transition " + (alreadyAdded ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'text-slate-500 hover:text-slate-700')}
            onClick={(e) => {
              e.preventDefault();
              if (alreadyAdded) {
                const item = shopping.list().find((s: any) => s.fieldId === fieldId);
                if (item) shopping.remove(item.id);
                return;
              }
              shopping.add({ fieldId, label: `${title ?? 'Cashflow'} — ${v.is_gross ? 'Gross' : 'Net'}`, section: undefined, path: undefined, meta: {} });
            }}
            title={alreadyAdded ? 'Remove from shopping list' : 'Add to shopping list'}
          >
            {alreadyAdded ? '−' : '＋'}
          </button>
        </div>
      </FormGrid>
    </div>
  );
}
