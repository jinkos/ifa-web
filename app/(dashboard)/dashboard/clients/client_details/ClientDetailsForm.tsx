"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Field from '@/components/ui/form/Field';
import FormGrid from '@/components/ui/form/FormGrid';
import FormSection from '@/components/ui/form/FormSection';

type ClientDetails = {
  client_id?: number;
  team_id?: number;
  name: string;
  email?: string;
  address1?: string;
  address2?: string;
  postcode?: string;
  mobile?: string;
  landline?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
};

export default function ClientDetailsForm({ clientId }: { clientId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [loading, setLoading] = useState(clientId !== 'new');
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const autoSubmitRan = useRef(false);

  useEffect(() => {
    let ignore = false;
    if (clientId !== 'new') {
      setLoading(true);
      fetch(`/api/clients/${clientId}`)
        .then((res) => {
          if (!res.ok) throw new Error('Client not found');
          return res.json();
        })
        .then((data) => {
          if (!ignore) setClient(data);
        })
        .catch((e) => !ignore && setError(e.message))
        .finally(() => !ignore && setLoading(false));
    }
    return () => {
      ignore = true;
    };
  }, [clientId]);

  // Auto-submit logic - must be declared before early returns
  const isNew = clientId === 'new';
  const autoName = searchParams.get('autofill_name') || undefined;
  const autoEmail = searchParams.get('autofill_email') || undefined;
  const doAutoSubmit = searchParams.get('autosubmit') === '1';

  useEffect(() => {
    if (!isNew) return;
    if (!doAutoSubmit) return;
    if (autoSubmitRan.current) return;
    autoSubmitRan.current = true;
    // Delay a tick to ensure defaultValue is rendered
    setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 0);
  }, [isNew, doAutoSubmit]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      payload[key] = value;
    });
    try {
      let res: Response;
      if (clientId === 'new') {
        // Try to get team_id from localStorage (set by settings page), fallback to /api/team
        let teamId: string | null = null;
        try {
          teamId = localStorage.getItem('team_id');
        } catch {}
        if (!teamId) {
          const teamRes = await fetch('/api/team');
          if (teamRes.ok) {
            const teamData = await teamRes.json();
            teamId = teamData?.id ?? null;
          }
        }
        if (!teamId) {
          throw new Error('Could not determine your team. Please reload the page.');
        }
        payload.team_id = teamId;
        res = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/clients/${clientId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) throw new Error('Failed to save client');
      const created = await res.json().catch(() => null);
      // If invoked as part of Gary's Path (gp=1), set selected client and go to Documents for auto-upload
      const isGaryPath = searchParams.get('gp') === '1';
      const docName = searchParams.get('doc') || 'Gary Thompson FF.docx';
      if (isGaryPath && created && typeof window !== 'undefined') {
        try {
          localStorage.setItem('selected_client', JSON.stringify(created));
        } catch {}
        const cid = created?.client_id;
        // Route back to Clients so we can visibly see Gary listed, then let ClientsTable
        // select and continue to Documents with autoupload.
        router.push(`/dashboard/clients?selectId=${encodeURIComponent(String(cid))}&gp=1&doc=${encodeURIComponent(docName)}`);
      } else {
        router.push('/dashboard/clients');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium bold text-gray-900 mb-6">
        {isNew ? 'New Client' : 'Edit Client'}
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>{isNew ? 'Create a new client' : 'Edit client details'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form ref={formRef} className="space-y-6" onSubmit={handleSubmit}>
            <FormSection>
              <FormGrid colsMd={2}>
                <Field label="Name">
                  <Input name="name" type="text" placeholder="Client Name" defaultValue={autoName ?? client?.name ?? ''} required />
                </Field>
                <Field label="Email">
                  <Input name="email" type="email" placeholder="Client Email" defaultValue={autoEmail ?? client?.email ?? ''} />
                </Field>
                <Field label="Mobile">
                  <Input name="mobile" type="text" placeholder="Mobile Number" defaultValue={client?.mobile || ''} />
                </Field>
                <Field label="Landline">
                  <Input name="landline" type="text" placeholder="Landline Number" defaultValue={client?.landline || ''} />
                </Field>
              </FormGrid>
            </FormSection>

            <div>
              <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded">
                {isNew ? 'Create Client' : 'Update Client'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
