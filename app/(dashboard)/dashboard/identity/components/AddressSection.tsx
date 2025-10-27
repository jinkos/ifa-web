"use client";
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { IdentityState } from '@/lib/types/identity';
import Field from '@/components/ui/form/Field';
import FormGrid from '@/components/ui/form/FormGrid';
import FormSection from '@/components/ui/form/FormSection';
import { useSectionShopping } from '@/components/shopping/useSectionShopping';
import { Tooltip } from '@/components/ui/tooltip';
import { IconNotepad } from '@/components/ui/icons/IconNotepad';

type AddressKey = 'address1' | 'address2' | 'city' | 'postcode';
const sectionKey = 'identity.address'; // or 'identity.personal', 'identity.national'
const sectionTitle = 'Address';

export default function AddressSection({
    value,
    update,
    suggestions,
    onAccept,
    onReject,
    loading,
}: {
    value: Pick<IdentityState, AddressKey>;
    update: (patch: Partial<IdentityState>) => void;
    suggestions?: Partial<Pick<IdentityState, AddressKey>>;
    onAccept?: (key: AddressKey) => void;
    onReject?: (key: AddressKey) => void;
    loading?: boolean;
}) {
    const { inShopping, toggle } = useSectionShopping(sectionKey, sectionTitle, 'Identity');
    const renderSuggestion = (key: AddressKey, incoming?: string) => {
        const current = (value as any)[key] as string;
        if (typeof incoming === 'undefined' || incoming === current) return null;
        return (
            <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-amber-700">Incoming: {incoming || '(empty)'}</span>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="default"
                            onClick={() => onAccept?.(key)}
                            disabled={loading}
                        >
                            Accept
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => onReject?.(key)}
                            disabled={loading}
                        >
                            Reject
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

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
                <Field id="address1" label="Address line 1" fieldName="Identity — Address line 1" incoming={typeof suggestions?.address1 !== 'undefined' ? { value: suggestions?.address1 ?? '', onAccept: () => onAccept?.('address1'), onReject: () => onReject?.('address1') } : undefined}>
                    <Input id="address1" className="text-lg font-semibold" value={value.address1} onChange={(e) => update({ address1: e.target.value })} placeholder="Address line 1" disabled={loading} />
                </Field>
                <Field id="address2" label="Address line 2" fieldName="Identity — Address line 2" incoming={typeof suggestions?.address2 !== 'undefined' ? { value: suggestions?.address2 ?? '', onAccept: () => onAccept?.('address2'), onReject: () => onReject?.('address2') } : undefined}>
                    <Input id="address2" className="text-lg font-semibold" value={value.address2} onChange={(e) => update({ address2: e.target.value })} placeholder="Address line 2" disabled={loading} />
                </Field>
                <Field id="city" label="City" fieldName="Identity — City" incoming={typeof suggestions?.city !== 'undefined' ? { value: suggestions?.city ?? '', onAccept: () => onAccept?.('city'), onReject: () => onReject?.('city') } : undefined}>
                    <Input id="city" className="text-lg font-semibold" value={value.city} onChange={(e) => update({ city: e.target.value })} placeholder="City" disabled={loading} />
                </Field>
                <Field id="postcode" label="Postcode" fieldName="Identity — Postcode" incoming={typeof suggestions?.postcode !== 'undefined' ? { value: suggestions?.postcode ?? '', onAccept: () => onAccept?.('postcode'), onReject: () => onReject?.('postcode') } : undefined}>
                    <Input id="postcode" className="text-lg font-semibold" value={value.postcode} onChange={(e) => update({ postcode: e.target.value })} placeholder="Postcode" disabled={loading} />
                </Field>
            </FormGrid>
        </FormSection>
    );
}
