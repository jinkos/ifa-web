"use client";
import React from 'react';
import { Input } from '@/components/ui/input';
import Field from '@/components/ui/form/Field';
import FormGrid from '@/components/ui/form/FormGrid';
import SuggestionInline from '@/components/ui/suggestion-inline';
import { useSectionShopping } from '@/components/shopping/useSectionShopping';
import { Tooltip } from '@/components/ui/tooltip';
import { IconNotepad } from '@/components/ui/icons/IconNotepad';

type EmploymentStatus =
  | 'employed'
  | 'self_employed'
  | 'retired'
  | 'full_time_education'
  | 'independent_means'
  | 'homemaker'
  | 'other'
  | '';

type FormData = {
  employment_status: EmploymentStatus;
  occupation: string;
};

const employmentOptions: { value: EmploymentStatus; label: string }[] = [
  { value: '', label: 'Select...' },
  { value: 'employed', label: 'Employed' },
  { value: 'self_employed', label: 'Self-employed' },
  { value: 'retired', label: 'Retired' },
  { value: 'full_time_education', label: 'Full-time education' },
  { value: 'independent_means', label: 'Independent means' },
  { value: 'homemaker', label: 'Homemaker' },
  { value: 'other', label: 'Other' },
];

export default function EmploymentSection<T extends FormData>({
  form,
  setForm,
  suggestions,
  onAccept,
  onReject,
}: {
  form: T;
  setForm: React.Dispatch<React.SetStateAction<T>>;
  suggestions?: Partial<FormData> | null;
  onAccept?: (key: keyof FormData) => void;
  onReject?: (key: keyof FormData) => void;
}) {
  const sectionKey = 'balance.employment';
  const sectionTitle = 'Employment';
  const { inShopping, toggle } = useSectionShopping(sectionKey, sectionTitle, 'Balance sheet');
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
            value={form.employment_status}
            onChange={(e) =>
              setForm({ ...form, employment_status: e.target.value as EmploymentStatus })
            }
          >
            {employmentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {suggestions?.employment_status ? (
            <SuggestionInline
              value={suggestions.employment_status}
              onAccept={() => {
                setForm({ ...form, employment_status: suggestions.employment_status as EmploymentStatus });
                onAccept?.('employment_status');
              }}
              onReject={() => onReject?.('employment_status')}
            />
          ) : null}
        </Field>
        <Field label="Occupation">
          <Input
            value={form.occupation}
            onChange={(e) => setForm({ ...form, occupation: e.target.value })}
            placeholder="e.g., Software Engineer"
          />
          {suggestions?.occupation ? (
            <SuggestionInline
              value={suggestions.occupation}
              onAccept={() => {
                setForm({ ...form, occupation: suggestions.occupation as string });
                onAccept?.('occupation');
              }}
              onReject={() => onReject?.('occupation')}
            />
          ) : null}
        </Field>
      </FormGrid>
    </section>
  );
}
