"use client";
import React from 'react';
import Field from '@/components/ui/form/Field';
import FormGrid from '@/components/ui/form/FormGrid';
import FormSection from '@/components/ui/form/FormSection';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { IdentityState, Gender, MaritalStatus } from '@/lib/types/identity';
import { genderOptions, maritalOptions } from '@/lib/constants/identity';
import { useSectionShopping } from '@/components/shopping/useSectionShopping';
import { Tooltip } from '@/components/ui/tooltip';
import { IconNotepad } from './IconNotepad';

type PersonalKey = 'date_of_birth' | 'gender' | 'marital_status';
const sectionKey = 'identity.personal'; // or 'identity.address', 'identity.national'
const sectionTitle = 'Personal information';

function calcAge(dob?: string) {
    if (!dob) return undefined;
    try {
        const now = new Date();
        const b = new Date(dob);
        if (Number.isNaN(b.getTime())) return undefined;
        let age = now.getFullYear() - b.getFullYear();
        const m = now.getMonth() - b.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
        return age;
    } catch {
        return undefined;
    }
}

export default function PersonalSection({
    value,
    update,
    suggestions,
    onAccept,
    onReject,
    loading,
}: {
    value: Pick<IdentityState, PersonalKey>;
    update: (patch: Partial<IdentityState>) => void;
    suggestions?: Partial<Pick<IdentityState, PersonalKey>>;
    onAccept?: (key: PersonalKey) => void;
    onReject?: (key: PersonalKey) => void;
    loading?: boolean;
}) {
    const { inShopping, toggle } = useSectionShopping(sectionKey, sectionTitle, 'Identity');
    const age = calcAge(value.date_of_birth);

    return (
        <FormSection
            title={sectionTitle}
            action={
                <Tooltip content="Add to shopping list">
                    <button
                        aria-pressed={inShopping}
                        title="Add to shopping list"
                        type="button"
                        className={"p-1 rounded " + (inShopping ? 'bg-amber-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100')}
                        onClick={toggle}>
                        <IconNotepad filled={inShopping} />
                    </button>
                </Tooltip>
            }
        >
            <FormGrid colsMd={2}>
                <Field id="date_of_birth" label="Date of birth" incoming={typeof suggestions?.date_of_birth !== 'undefined' ? { value: suggestions?.date_of_birth ?? '', onAccept: () => onAccept?.('date_of_birth'), onReject: () => onReject?.('date_of_birth') } : undefined}>
                    <div className="flex items-center gap-3">
                        <Input id="date_of_birth" type="date" className="text-lg font-semibold" value={value.date_of_birth} onChange={(e) => update({ date_of_birth: e.target.value })} disabled={loading} />
                        <div className="text-sm text-muted-foreground">{age !== undefined ? `${age} yrs` : ''}</div>
                    </div>
                </Field>

                <Field id="gender" label="Gender" incoming={typeof suggestions?.gender !== 'undefined' ? { value: suggestions?.gender ?? '', onAccept: () => onAccept?.('gender'), onReject: () => onReject?.('gender') } : undefined}>
                    <Select id="gender" className="text-lg font-semibold" value={value.gender} onChange={(e) => update({ gender: e.target.value as Gender | '' })} disabled={loading}>
                        <option value="">Select…</option>
                        {genderOptions.map((g) => (
                            <option key={g} value={g}>{g}</option>
                        ))}
                    </Select>
                </Field>

                <Field id="marital_status" label="Marital status" incoming={typeof suggestions?.marital_status !== 'undefined' ? { value: suggestions?.marital_status ?? '', onAccept: () => onAccept?.('marital_status'), onReject: () => onReject?.('marital_status') } : undefined}>
                    <Select id="marital_status" className="text-lg font-semibold" value={value.marital_status ?? ''} onChange={(e) => update({ marital_status: (e.target.value || null) as MaritalStatus | null })} disabled={loading}>
                        <option value="">Select…</option>
                        {maritalOptions.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </Select>
                </Field>
            </FormGrid>
        </FormSection>
    );
}
