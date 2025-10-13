"use client";
import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import Field from '@/components/ui/form/Field';
import FormGrid from '@/components/ui/form/FormGrid';
import FormSection from '@/components/ui/form/FormSection';
import type { PersonSummary, HealthStatus, MaritalStatus } from '@/lib/types/summary';
import { healthOptions, maritalOptions } from '@/lib/constants/summary';

type NonListSuggestions = Partial<Pick<
  PersonSummary,
  'health_status' | 'smoker' | 'marital_status' | 'target_retirement_age' | 'target_retirement_income'
>>;

export default function StatusSection({
  form,
  setForm,
  fieldSuggestions,
  setFieldSuggestions,
}: {
  form: PersonSummary;
  setForm: React.Dispatch<React.SetStateAction<PersonSummary>>;
  fieldSuggestions: NonListSuggestions | null;
  setFieldSuggestions: React.Dispatch<React.SetStateAction<NonListSuggestions | null>>;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">Status</h2>
      <FormGrid colsMd={2}>
        <Field
          label="Health status"
          fieldName="Status — Health status"
          showShoppingAction
          incoming={fieldSuggestions?.health_status !== undefined ? {
            value: fieldSuggestions.health_status,
            onAccept: () => { setForm((prev) => ({ ...prev, health_status: (fieldSuggestions?.health_status ?? prev.health_status) as any })); setFieldSuggestions((prev) => { if (!prev) return prev; const next = { ...prev }; delete (next as any).health_status; return next; }); },
            onReject: () => { setFieldSuggestions((prev) => { if (!prev) return prev; const next = { ...prev }; delete (next as any).health_status; return next; }); },
          } : null}
        >
          <Select className="text-lg font-semibold" value={form.health_status ?? ''} onChange={(e) => setForm({ ...form, health_status: (e.target.value || null) as HealthStatus | null })}>
            <option value="">Select…</option>
            {healthOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </Field>

        <div className="flex items-center gap-2 mt-6">
          <input id="smoker" type="checkbox" checked={!!form.smoker} onChange={(e) => setForm({ ...form, smoker: e.target.checked })} />
          <Label htmlFor="smoker">Smoker</Label>
          {typeof fieldSuggestions?.smoker !== 'undefined' && (fieldSuggestions?.smoker as any) !== (form.smoker ?? false) && (
            <div className="ml-3 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs">
              Incoming: {String(fieldSuggestions.smoker)}
              <span className="ml-2">
                <Button size="sm" onClick={(e) => { e.preventDefault(); setForm((prev) => ({ ...prev, smoker: (fieldSuggestions?.smoker as any) })); setFieldSuggestions((prev) => { if (!prev) return prev; const next = { ...prev }; delete (next as any).smoker; return next; }); }}>Accept</Button>
                <Button className="ml-1" size="sm" variant="outline" onClick={(e) => { e.preventDefault(); setFieldSuggestions((prev) => { if (!prev) return prev; const next = { ...prev }; delete (next as any).smoker; return next; }); }}>Reject</Button>
              </span>
            </div>
          )}
        </div>

        <Field
          label="Marital status"
          fieldName="Status — Marital status"
          showShoppingAction
          incoming={fieldSuggestions?.marital_status !== undefined ? {
            value: fieldSuggestions.marital_status,
            onAccept: () => { setForm((prev) => ({ ...prev, marital_status: (fieldSuggestions?.marital_status ?? prev.marital_status) as any })); setFieldSuggestions((prev) => { if (!prev) return prev; const next = { ...prev }; delete (next as any).marital_status; return next; }); },
            onReject: () => { setFieldSuggestions((prev) => { if (!prev) return prev; const next = { ...prev }; delete (next as any).marital_status; return next; }); },
          } : null}
        >
          <Select className="text-lg font-semibold" value={form.marital_status ?? ''} onChange={(e) => setForm({ ...form, marital_status: (e.target.value || null) as MaritalStatus | null })}>
            <option value="">Select…</option>
            {maritalOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </Field>
      </FormGrid>
    </section>
  );
}
