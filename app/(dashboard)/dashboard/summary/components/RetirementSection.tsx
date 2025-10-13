"use client";
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Field from '@/components/ui/form/Field';
import FormGrid from '@/components/ui/form/FormGrid';
import FormSection from '@/components/ui/form/FormSection';
import CashflowItemForm from './CashflowItemForm';
import type { CashflowItem, PersonSummary } from '@/lib/types/summary';

type NonListSuggestions = Partial<Pick<
  PersonSummary,
  'health_status' | 'smoker' | 'marital_status' | 'target_retirement_age' | 'target_retirement_income'
>>;

export default function RetirementSection({
  form,
  setForm,
  fieldSuggestions,
  setFieldSuggestions,
  cashflowEqual,
}: {
  form: PersonSummary;
  setForm: React.Dispatch<React.SetStateAction<PersonSummary>>;
  fieldSuggestions: NonListSuggestions | null;
  setFieldSuggestions: React.Dispatch<React.SetStateAction<NonListSuggestions | null>>;
  cashflowEqual: (a?: CashflowItem | null, b?: CashflowItem | null) => boolean;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">Retirement & Goals</h2>
      <FormGrid colsMd={2}>
        <Field
          label="Target retirement age"
          fieldName="Retirement — Target retirement age"
          showShoppingAction
          incoming={typeof fieldSuggestions?.target_retirement_age !== 'undefined' ? {
            value: fieldSuggestions.target_retirement_age,
            onAccept: () => { setForm((prev) => ({ ...prev, target_retirement_age: (fieldSuggestions?.target_retirement_age as any) })); setFieldSuggestions((prev) => { if (!prev) return prev; const next = { ...prev }; delete (next as any).target_retirement_age; return next; }); },
            onReject: () => { setFieldSuggestions((prev) => { if (!prev) return prev; const next = { ...prev }; delete (next as any).target_retirement_age; return next; }); },
          } : null}
        >
          <Input type="number" className="text-lg font-semibold" value={form.target_retirement_age ?? ''} onChange={(e) => setForm({ ...form, target_retirement_age: e.target.value === '' ? null : Number(e.target.value) })} />
        </Field>
      </FormGrid>
      <div className="mt-3">
        <CashflowItemForm
          title="Target retirement income (today's money)"
          value={form.target_retirement_income ? { ...form.target_retirement_income, description: 'Target retirement income' } : { description: 'Target retirement income' }}
          onChange={(v) => setForm({ ...form, target_retirement_income: v ? { ...v, description: 'Target retirement income' } : { description: 'Target retirement income' } })}
          hideDescription
          id={`retirement-income-is_gross`}
        />
        {fieldSuggestions?.target_retirement_income && !cashflowEqual(form.target_retirement_income ?? null, fieldSuggestions.target_retirement_income ?? null) && (
          <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-sm">
            <div className="flex items-center justify_between">
              <span className="text-amber-700">Incoming change for retirement income</span>
              <div className="flex gap-2">
                <Button size="sm" onClick={(e) => { e.preventDefault(); setForm((prev) => ({ ...prev, target_retirement_income: fieldSuggestions?.target_retirement_income as any })); setFieldSuggestions((prev) => { if (!prev) return prev; const next = { ...prev }; delete (next as any).target_retirement_income; return next; }); }}>Accept</Button>
                <Button size="sm" variant="outline" onClick={(e) => { e.preventDefault(); setFieldSuggestions((prev) => { if (!prev) return prev; const next = { ...prev }; delete (next as any).target_retirement_income; return next; }); }}>Reject</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
