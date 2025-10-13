"use client";
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import Field from '@/components/ui/form/Field';
import FormGrid from '@/components/ui/form/FormGrid';
import FormSection from '@/components/ui/form/FormSection';

export default function FormStylePreview() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Form style preview</h1>

      <section className="max-w-3xl space-y-6">
        <FormSection title="Identity-style fields">
          <FormGrid colsMd={2}>
            <Field label="Address line 1">
              <Input className="text-lg font-semibold" placeholder="Old Post House, The Street" />
            </Field>
            <Field label="Address line 2">
              <Input className="text-lg font-semibold" placeholder="Address line 2" />
            </Field>
            <Field label="City">
              <Input className="text-lg font-semibold" placeholder="Colchester" />
            </Field>
            <Field label="Postcode">
              <Input className="text-lg font-semibold" placeholder="CO7 6TB" />
            </Field>
          </FormGrid>
        </FormSection>

        <FormSection title="Demographics">
          <FormGrid colsMd={2}>
            <Field label="Date of birth">
              <Input className="text-lg font-semibold" type="date" />
            </Field>
            <Field label="Gender">
              <Select className="text-lg font-semibold"><option value="">Select…</option><option>Male</option><option>Female</option></Select>
            </Field>
            <Field label="Nationality">
              <Input className="text-lg font-semibold" placeholder="Nationality" />
            </Field>
            <Field label="Second nationality">
              <Input className="text-lg font-semibold" placeholder="Second nationality" />
            </Field>
            <Field label="Employment status">
              <Select className="text-lg font-semibold"><option value="">Select…</option><option>Employed</option><option>Self-employed</option></Select>
            </Field>
            <Field label="Occupation">
              <Input className="text-lg font-semibold" placeholder="Occupation" />
            </Field>
          </FormGrid>
        </FormSection>

        <div>
          <h2 className="text-lg font-semibold mb-2">Switch & checkbox</h2>
          <div className="flex items-center gap-3">
            <Switch id="net-toggle" checked={false} onCheckedChange={() => {}} label="Net" />
          </div>
        </div>
      </section>
    </div>
  );
}
