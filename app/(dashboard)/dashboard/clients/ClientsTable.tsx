

"use client";
import Link from "next/link";
import { Button } from '@/components/ui/button';
import { Trash2, Pencil } from 'lucide-react';
import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import DemoModal from '@/components/ui/demo-modal';
import ConfirmModal from '@/components/ui/confirm-modal';
import { useSelectedClient } from '../SelectedClientContext';
import type { Client } from '@/lib/types/client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTeam } from '../TeamContext';

export function ClientsTable({ clients: initialClients }: { clients: Client[] }) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { selectedClient, setSelectedClient } = useSelectedClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { team } = useTeam();

  // show confirm modal when user requests deletion
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; clientId?: number; name?: string }>({ open: false });

  const handleDelete = (clientId: number, name?: string) => {
    setConfirmModal({ open: true, clientId, name });
  };

  const performDelete = async (clientId?: number) => {
    if (!clientId) return;
    setConfirmModal({ open: false });
    setDeletingId(clientId);
    try {
      const res = await fetch(`/api/clients/${clientId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete client');
      setClients(clients.filter((c: Client) => c.client_id !== clientId));
      // If the deleted client was selected, clear the selection to avoid stale localStorage state
      if (selectedClient?.client_id === clientId) {
        setSelectedClient(null);
      }
    } catch (e) {
      setErrorModal({ open: true, message: 'Failed to delete client.' });
    } finally {
      setDeletingId(null);
    }
  };

  const [errorModal, setErrorModal] = useState<{ open: boolean; message?: string }>({ open: false });

  // Auto-delete flow triggered via query param ?autodelete=Name
  const autoDeleteRan = useRef(false);
  const recreateRan = useRef(false);
  useEffect(() => {
    if (autoDeleteRan.current) return;
    const targetName = searchParams.get('autodelete');
    if (!targetName) return;
    const target = clients.find(
      (c) => c.name?.trim().toLowerCase() === targetName.trim().toLowerCase()
    );
    if (!target) {
      // Surface feedback if the requested client does not exist
      setErrorModal({ open: true, message: `Client "${targetName}" not found.` });
      // Clean URL param to avoid persistent modal on back/forward
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.delete('autodelete');
      router.replace(`/dashboard/clients${params.size ? `?${params.toString()}` : ''}`);
      autoDeleteRan.current = true;
      return;
    }
    autoDeleteRan.current = true;
    // Perform delete and then strip the query param to avoid re-running on client navigations
    (async () => {
      await performDelete(target.client_id);
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.delete('autodelete');
      router.replace(`/dashboard/clients${params.size ? `?${params.toString()}` : ''}`);
    })();
  }, [searchParams, clients, router]);

  // Recreate flow: delete by name if exists, then navigate to new-client form with autofill+autosubmit
  useEffect(() => {
    if (recreateRan.current) return;
    const recreate = searchParams.get('recreate');
    if (!recreate) return;
    const targetName = searchParams.get('name') || '';
    const targetEmail = searchParams.get('email') || '';
    if (!targetName) {
      setErrorModal({ open: true, message: 'Missing name for recreate flow.' });
      recreateRan.current = true;
      // Clean param
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.delete('recreate');
      router.replace(`/dashboard/clients${params.size ? `?${params.toString()}` : ''}`);
      return;
    }
    recreateRan.current = true;
    (async () => {
      const target = clients.find(
        (c) => c.name?.trim().toLowerCase() === targetName.trim().toLowerCase()
      );
      if (target) {
        await performDelete(target.client_id);
      }
      // Navigate to new client form with autofill and autosubmit
      const url = `/dashboard/clients/client_details/new?autofill_name=${encodeURIComponent(
        targetName
      )}&autofill_email=${encodeURIComponent(targetEmail)}&autosubmit=1&gp=1&doc=${encodeURIComponent('Gary Thompson FF.docx')}`;
      router.push(url);
    })();
  }, [searchParams, clients, router]);

  // Auto-select flow: wait until target client appears in list (or poll), select, then optionally continue Gary's Path to Documents
  useEffect(() => {
    const selectId = searchParams.get('selectId');
    const selectName = searchParams.get('selectName');
    const continueGP = searchParams.get('gp') === '1';
    const docName = searchParams.get('doc') || 'Gary Thompson FF.docx';
    if (!selectId && !selectName) return;

    let cancelled = false;
    const matchInState = () => {
      const byId = selectId ? clients.find((c) => String(c.client_id) === String(selectId)) : undefined;
      const byName = selectName
        ? clients.find((c) => c.name?.trim().toLowerCase() === selectName.trim().toLowerCase())
        : undefined;
      return byId || byName || null;
    };

    const trySelect = async () => {
      // Check current state first
      let found = matchInState();
      if (found) {
        setSelectedClient(found);
        if (continueGP) {
          router.push(`/dashboard/documents?autoupload=1&name=${encodeURIComponent(docName)}`);
        } else {
          // Clean select params
          const params = new URLSearchParams(Array.from(searchParams.entries()));
          params.delete('selectId');
          params.delete('selectName');
          router.replace(`/dashboard/clients${params.size ? `?${params.toString()}` : ''}`);
        }
        return;
      }

      // If not found, poll /api/clients until it appears (bounded)
      const attempts = 10;
      const delayMs = 400;
      for (let i = 0; i < attempts && !cancelled; i++) {
        try {
          if (!team?.id) break;
          const res = await fetch(`/api/clients?teamId=${team.id}`, { cache: 'no-store' });
          if (res.ok) {
            const list: Client[] = await res.json();
            setClients(list);
            found = (selectId
              ? list.find((c) => String(c.client_id) === String(selectId))
              : list.find((c) => c.name?.trim().toLowerCase() === (selectName ?? '').trim().toLowerCase())) || null;
            if (found) {
              setSelectedClient(found);
              if (continueGP) {
                router.push(`/dashboard/documents?autoupload=1&name=${encodeURIComponent(docName)}`);
              } else {
                const params = new URLSearchParams(Array.from(searchParams.entries()));
                params.delete('selectId');
                params.delete('selectName');
                router.replace(`/dashboard/clients${params.size ? `?${params.toString()}` : ''}`);
              }
              return;
            }
          }
        } catch {}
        await new Promise((r) => setTimeout(r, delayMs));
      }
    };

    trySelect();
    return () => {
      cancelled = true;
    };
  }, [searchParams, clients, team?.id, router, setSelectedClient]);

  return (
    <div className="overflow-x-auto">
      <DemoModal open={errorModal.open} onClose={() => setErrorModal({ open: false })} title="Error">
        {errorModal.message}
      </DemoModal>
      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false })}
        onConfirm={() => performDelete(confirmModal.clientId)}
        title="Delete client"
        message={
          confirmModal.name
            ? `Are you sure you want to delete ${confirmModal.name}? This action cannot be undone.`
            : 'Are you sure you want to delete this client? This action cannot be undone.'
        }
        confirmText="Delete"
        cancelText="Cancel"
      />
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
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(client.client_id, client.name)} disabled={deletingId === client.client_id} aria-label="Delete client">
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

