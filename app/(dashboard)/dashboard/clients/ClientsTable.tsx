

"use client";
import Link from "next/link";
import { Button } from '@/components/ui/button';
import { Trash2, Pencil } from 'lucide-react';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { useSelectedClient } from '../SelectedClientContext';
import type { Client } from '@/lib/types/client';

export function ClientsTable({ clients: initialClients }: { clients: Client[] }) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { selectedClient, setSelectedClient } = useSelectedClient();

  const handleDelete = async (clientId: number) => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) return;
    setDeletingId(clientId);
    try {
      const res = await fetch(`/api/clients/${clientId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete client');
      setClients(clients.filter((c: Client) => c.client_id !== clientId));
    } catch (e) {
      alert('Failed to delete client.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {clients.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No clients found.</td>
            </tr>
          ) : (
            clients.map((client: Client) => {
              const isSelected = selectedClient?.client_id === client.client_id;
              return (
                <tr key={client.client_id}>
                  <td className="px-2 py-4 whitespace-nowrap w-8">
                    <button
                      aria-label={isSelected ? 'Selected client' : 'Select client'}
                      onClick={() => {
                        if (!isSelected) setSelectedClient(client);
                      }}
                      className="focus:outline-none"
                    >
                      <Check className="w-5 h-5" stroke={isSelected ? 'black' : '#d1d5db'} />
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{client.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{client.email || '-'} </td>
                  <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                    <Link href={`/dashboard/clients/client_details/${client.client_id}`}>
                      <Button size="sm" variant="outline" aria-label="Edit client">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(client.client_id)} disabled={deletingId === client.client_id} aria-label="Delete client">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

