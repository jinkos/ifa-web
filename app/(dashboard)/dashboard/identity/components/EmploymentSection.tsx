"use client";
import React from 'react';
import { Input } from '@/components/ui/input';
import Field from '@/components/ui/form/Field';
import FormGrid from '@/components/ui/form/FormGrid';
import SuggestionInline from '@/components/ui/suggestion-inline';
import { useSectionShopping } from '@/components/shopping/useSectionShopping';
import { Tooltip } from '@/components/ui/tooltip';
import { IconNotepad } from '@/components/ui/icons/IconNotepad';
import type { BalanceEmploymentStatus } from '@/lib/types/balance';

export type EmploymentValue = {
  employment_status?: BalanceEmploymentStatus | null;
  occupation?: string | null;
};

export default function EmploymentSection({
  value,
  update,
  suggestions,
  onAccept,
  onReject,
}: {
  value: EmploymentValue;
  update: (patch: Partial<EmploymentValue>) => void;
  suggestions?: Partial<EmploymentValue> | null;
  onAccept?: (key: keyof EmploymentValue) => void;
  onReject?: (key: keyof EmploymentValue) => void;
}) {
  const sectionKey = 'identity.employment';
  const sectionTitle = 'Employment';
  const { inShopping, toggle } = useSectionShopping(sectionKey, sectionTitle, 'Identity');

  const employmentOptions: { value: BalanceEmploymentStatus | ''; label: string }[] = [
    { value: '' as any, label: 'Select...' },
    { value: 'employed', label: 'Employed' },
    { value: 'self_employed', label: 'Self-employed' },
    { value: 'retired', label: 'Retired' },
    { value: 'full_time_education', label: 'Full-time education' },
    { value: 'independent_means', label: 'Independent means' },
    { value: 'homemaker', label: 'Homemaker' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4 border-b pb-2">
        <h2 className="text-xl font-semibold">Work</h2>
        <Tooltip content="Add to shopping list">
          <button
            aria-pressed={inShopping}
            title="Add to shopping list"
            type="button"
            className={"p-1 rounded " + (inShopping ? 'bg-amber-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100')}
            onClick={toggle}
          >
            <IconNotepad filled={inShopping} />
          </button>
        </Tooltip>
      </div>
      <FormGrid colsMd={2}>
        <Field label="Employment status">
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={(value.employment_status ?? '') as any}
            onChange={(e) => update({ employment_status: (e.target.value || null) as any })}
          >
            {employmentOptions.map((option) => (
              <option key={option.value || 'blank'} value={option.value as any}>
                {option.label}
              </option>
            ))}
          </select>
          {suggestions?.employment_status ? (
            <SuggestionInline
              value={suggestions.employment_status as any}
              onAccept={() => onAccept?.('employment_status')}
              onReject={() => onReject?.('employment_status')}
            />
          ) : null}
        </Field>
        <Field label="Occupation">
          <Input
            value={value.occupation ?? ''}
            onChange={(e) => update({ occupation: e.target.value })}
            placeholder="e.g., Software Engineer"
          />
          {typeof suggestions?.occupation !== 'undefined' ? (
            <SuggestionInline
              value={String(suggestions.occupation ?? '')}
              onAccept={() => onAccept?.('occupation')}
              onReject={() => onReject?.('occupation')}
            />
          ) : null}
        </Field>
      </FormGrid>
    </section>
  );
}
