"use client";
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { IdentityState, Gender, EmploymentStatus } from '@/lib/types/identity';
import { genderOptions, employmentOptions } from '@/lib/constants/identity';
import Field from '@/components/ui/form/Field';
import FormGrid from '@/components/ui/form/FormGrid';
import FormSection from '@/components/ui/form/FormSection';
import { Select } from '@/components/ui/select';

type DemoKey = 'date_of_birth' | 'gender' | 'nationality' | 'nationality2' | 'employment_status' | 'occupation';

export default function DemographicsSection({
  value,
  update,
  suggestions,
  onAccept,
  onReject,
  loading,
}: {
  value: Pick<IdentityState, DemoKey>;
  update: (patch: Partial<IdentityState>) => void;
  suggestions?: Partial<Pick<IdentityState, DemoKey>>;
  onAccept?: (key: DemoKey) => void;
  onReject?: (key: DemoKey) => void;
  loading?: boolean;
}) {
  const renderSuggestion = (key: DemoKey, incoming?: string) => {
    const current = (value as any)[key] as string;
    if (typeof incoming === 'undefined' || incoming === current) return null;
    return (
      <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-amber-700">Incoming: {incoming || '(empty)'}</span>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="default" onClick={() => onAccept?.(key)} disabled={loading}>
              Accept
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => onReject?.(key)} disabled={loading}>
              Reject
            </Button>
          </div>
        </div>
      </div>
    );
  };
  return (
    <FormSection title="Demographics">
      <FormGrid colsMd={2}>
        <Field id="date_of_birth" label="Date of birth" fieldName="Identity — Date of birth" showShoppingAction incoming={typeof suggestions?.date_of_birth !== 'undefined' ? { value: suggestions?.date_of_birth ?? '', onAccept: () => onAccept?.('date_of_birth'), onReject: () => onReject?.('date_of_birth') } : undefined}>
          <Input id="date_of_birth" type="date" className="text-lg font-semibold" value={value.date_of_birth} onChange={(e) => update({ date_of_birth: e.target.value })} disabled={loading} />
        </Field>
        <Field id="gender" label="Gender" fieldName="Identity — Gender" showShoppingAction incoming={typeof suggestions?.gender !== 'undefined' ? { value: suggestions?.gender ?? '', onAccept: () => onAccept?.('gender'), onReject: () => onReject?.('gender') } : undefined}>
          <Select id="gender" className="text-lg font-semibold" value={value.gender} onChange={(e) => update({ gender: e.target.value as Gender | '' })} disabled={loading}>
            <option value="">Select…</option>
            {genderOptions.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="nationality" label="Nationality" fieldName="Identity — Nationality" showShoppingAction incoming={typeof suggestions?.nationality !== 'undefined' ? { value: suggestions?.nationality ?? '', onAccept: () => onAccept?.('nationality'), onReject: () => onReject?.('nationality') } : undefined}>
          <Input id="nationality" className="text-lg font-semibold" value={value.nationality} onChange={(e) => update({ nationality: e.target.value })} placeholder="Nationality" disabled={loading} />
        </Field>
        <Field id="nationality2" label="Second nationality" fieldName="Identity — Second nationality" showShoppingAction incoming={typeof suggestions?.nationality2 !== 'undefined' ? { value: suggestions?.nationality2 ?? '', onAccept: () => onAccept?.('nationality2'), onReject: () => onReject?.('nationality2') } : undefined}>
          <Input id="nationality2" className="text-lg font-semibold" value={value.nationality2} onChange={(e) => update({ nationality2: e.target.value })} placeholder="Second nationality" disabled={loading} />
        </Field>
        <Field id="employment_status" label="Employment status" fieldName="Identity — Employment status" showShoppingAction incoming={typeof suggestions?.employment_status !== 'undefined' ? { value: suggestions?.employment_status ?? '', onAccept: () => onAccept?.('employment_status'), onReject: () => onReject?.('employment_status') } : undefined}>
          <Select id="employment_status" className="text-lg font-semibold" value={value.employment_status} onChange={(e) => update({ employment_status: e.target.value as EmploymentStatus | '' })} disabled={loading}>
            <option value="">Select…</option>
            {employmentOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="occupation" label="Occupation" fieldName="Identity — Occupation" showShoppingAction incoming={typeof suggestions?.occupation !== 'undefined' ? { value: suggestions?.occupation ?? '', onAccept: () => onAccept?.('occupation'), onReject: () => onReject?.('occupation') } : undefined}>
          <Input id="occupation" className="text-lg font-semibold" value={value.occupation} onChange={(e) => update({ occupation: e.target.value })} placeholder="Occupation" disabled={loading} />
        </Field>
      </FormGrid>
    </FormSection>
  );
}
