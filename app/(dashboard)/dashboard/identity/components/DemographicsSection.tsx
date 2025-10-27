"use client";
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { IdentityState, HealthStatus } from '@/lib/types/identity';
import { healthOptions, smokerOptions } from '@/lib/constants/identity';
import Field from '@/components/ui/form/Field';
import FormGrid from '@/components/ui/form/FormGrid';
import FormSection from '@/components/ui/form/FormSection';
import { Tooltip } from '@/components/ui/tooltip';
import { Select } from '@/components/ui/select';
import { useSectionShopping } from '@/components/shopping/useSectionShopping';
import { secureHeapUsed } from 'crypto';
import {IconNotepad} from './IconNotepad';

type DemoKey = 'health_status' | 'smoker';
const sectionKey = 'identity.demographics'; // or 'identity.address', 'identity.national'
const sectionTitle = 'Health and lifestyle';

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
    const { inShopping, toggle } = useSectionShopping(sectionKey, sectionTitle, 'Identity');
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
            <div data-section-id={sectionKey} />
            <FormGrid colsMd={2}>
                <Field
                    label="Health status"
                    fieldName="Identity — Health status"
                    incoming={typeof suggestions?.health_status !== 'undefined' ? { value: suggestions?.health_status ?? '', onAccept: () => onAccept?.('health_status'), onReject: () => onReject?.('health_status') } : undefined}
                >
                    <Select className="text-lg font-semibold" value={value.health_status ?? ''} onChange={(e) => update({ health_status: (e.target.value || null) as HealthStatus | null })} disabled={loading}>
                        <option value="">Select…</option>
                        {healthOptions.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </Select>
                </Field>

                <Field
                    id="smoker"
                    label="Smoker"
                    fieldName="Identity — Smoker"
                    incoming={typeof suggestions?.smoker !== 'undefined' ? { value: suggestions?.smoker ?? '', onAccept: () => onAccept?.('smoker'), onReject: () => onReject?.('smoker') } : undefined}
                >
                    <Select id="smoker" className="text-lg font-semibold" value={value.smoker ?? ''} onChange={(e) => update({ smoker: e.target.value === '' ? null : (e.target.value as 'yes' | 'no') })} disabled={loading}>
                        <option value="">Select…</option>
                        {smokerOptions.map((s) => (
                            <option key={s} value={s}>{s === 'yes' ? 'Yes' : s === 'no' ? 'No' : s}</option>
                        ))}
                    </Select>
                </Field>
            </FormGrid>
        </FormSection>
    );
}
