"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [loading, setLoading] = useState(clientId !== 'new');
  const [error, setError] = useState<string | null>(null);

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
      router.push('/dashboard/clients');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  const isNew = clientId === 'new';

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
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="name" className="mb-2">Name</Label>
              <Input id="name" name="name" type="text" placeholder="Client Name" defaultValue={client?.name || ''} required />
            </div>
            <div>
              <Label htmlFor="email" className="mb-2">Email</Label>
              <Input id="email" name="email" type="email" placeholder="Client Email" defaultValue={client?.email || ''} />
            </div>
            <div>
              <Label htmlFor="address1" className="mb-2">Address Line 1</Label>
              <Input id="address1" name="address1" type="text" placeholder="Address Line 1" defaultValue={client?.address1 || ''} />
            </div>
            <div>
              <Label htmlFor="address2" className="mb-2">Address Line 2</Label>
              <Input id="address2" name="address2" type="text" placeholder="Address Line 2" defaultValue={client?.address2 || ''} />
            </div>
            <div>
              <Label htmlFor="postcode" className="mb-2">Postcode</Label>
              <Input id="postcode" name="postcode" type="text" placeholder="Postcode" defaultValue={client?.postcode || ''} />
            </div>
            <div>
              <Label htmlFor="mobile" className="mb-2">Mobile</Label>
              <Input id="mobile" name="mobile" type="text" placeholder="Mobile Number" defaultValue={client?.mobile || ''} />
            </div>
            <div>
              <Label htmlFor="landline" className="mb-2">Landline</Label>
              <Input id="landline" name="landline" type="text" placeholder="Landline Number" defaultValue={client?.landline || ''} />
            </div>
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
