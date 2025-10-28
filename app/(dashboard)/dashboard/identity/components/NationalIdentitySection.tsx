"use client";
import React from 'react';
import Field from '@/components/ui/form/Field';
import FormGrid from '@/components/ui/form/FormGrid';
import FormSection from '@/components/ui/form/FormSection';
import { Input } from '@/components/ui/input';
import type { IdentityState } from '@/lib/types/identity';
import { useSectionShopping } from '@/components/shopping/useSectionShopping';
import { Tooltip } from '@/components/ui/tooltip';
import {IconNotepad} from './IconNotepad';

type NationalKey = 'nationality' | 'nationality2' | 'n_i_number';
const sectionKey = 'identity.national'; // or 'identity.address', 'identity.personal
const sectionTitle = 'National identity';

export default function NationalIdentitySection({
    value,
    update,
    suggestions,
    onAccept,
    onReject,
    loading,
}: {
    value: Pick<IdentityState, NationalKey>;
    update: (patch: Partial<IdentityState>) => void;
    suggestions?: Partial<Pick<IdentityState, NationalKey>>;
    onAccept?: (key: NationalKey) => void;
    onReject?: (key: NationalKey) => void;
    loading?: boolean;
}) {
    const { inShopping, toggle } = useSectionShopping(sectionKey, sectionTitle, 'Identity');
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
                <Field id="nationality" label="Nationality" incoming={typeof suggestions?.nationality !== 'undefined' ? { value: suggestions?.nationality ?? '', onAccept: () => onAccept?.('nationality'), onReject: () => onReject?.('nationality') } : undefined}>
                    <Input id="nationality" value={value.nationality} onChange={e => update({ nationality: e.target.value })} disabled={loading} />
                </Field>
                <Field id="nationality2" label="Second nationality" incoming={typeof suggestions?.nationality2 !== 'undefined' ? { value: suggestions?.nationality2 ?? '', onAccept: () => onAccept?.('nationality2'), onReject: () => onReject?.('nationality2') } : undefined}>
                    <Input id="nationality2" value={value.nationality2} onChange={e => update({ nationality2: e.target.value })} disabled={loading} />
                </Field>
                <Field id="n_i_number" label="NI number" incoming={typeof suggestions?.n_i_number !== 'undefined' ? { value: suggestions?.n_i_number ?? '', onAccept: () => onAccept?.('n_i_number'), onReject: () => onReject?.('n_i_number') } : undefined}>
                    <Input id="n_i_number" value={value.n_i_number} onChange={e => update({ n_i_number: e.target.value })} disabled={loading} />
                </Field>
            </FormGrid>
        </FormSection>
    );
}