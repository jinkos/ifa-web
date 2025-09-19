"use client";
import { useEffect, useState } from 'react';
import { useSelectedClient } from '../SelectedClientContext';
import useSWR from 'swr';
import { useTeam } from '../TeamContext';
// Listing now uses server API for broader compatibility (private/public buckets)

type DocItem = { name: string; url: string };

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DocumentList({ refreshToken }: { refreshToken?: number }) {
  const { selectedClient } = useSelectedClient();
  const { team } = useTeam();
  const [items, setItems] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // for listing errors
  const [banner, setBanner] = useState<string | null>(null); // transient UI message (e.g., delete failure)
  const [confirmingName, setConfirmingName] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!team?.id || !selectedClient?.client_id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/storage/list?teamId=${team.id}&clientId=${selectedClient.client_id}`, { cache: 'no-store' });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to list documents');
        }
        const data: DocItem[] = await res.json();
        if (!ignore) setItems(data ?? []);
      } catch (e: any) {
        if (!ignore) setError(e.message || 'Failed to list documents');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team?.id, selectedClient?.client_id, refreshToken]);

  if (!selectedClient) return <div className="mt-4 text-gray-500">Select a client to see documents.</div>;
  if (loading) return <div className="mt-4">Loading documents...</div>;
  if (error) return <div className="mt-4 text-red-500">{error}</div>;
  if (!items || items.length === 0) return <div className="mt-4 text-gray-500">No documents yet.</div>;

  return (
    <>
      {banner && (
        <div className="mt-4 text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
          {banner}
        </div>
      )}
      <ul className="mt-4 space-y-2">
      {items.map((it) => {
        const startConfirm = () => setConfirmingName(it.name);
        const cancelConfirm = () => setConfirmingName((name) => (name === it.name ? null : name));
        const handleConfirmDelete = async () => {
          if (!team?.id || !selectedClient?.client_id) return;
          setDeletingName(it.name);
          const prev = items;
          setItems((cur) => cur.filter((x) => x.name !== it.name));
          try {
            const res = await fetch('/api/storage/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ teamId: String(team.id), clientId: String(selectedClient.client_id), filename: it.name }),
            });
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err.error || 'Delete failed');
            }
          } catch (e) {
            // rollback on failure
            setItems(prev);
            const msg = e instanceof Error ? e.message : 'Delete failed';
            setBanner(msg);
            setTimeout(() => setBanner(null), 4000);
          } finally {
            setDeletingName(null);
            setConfirmingName(null);
          }
        };

        const isConfirming = confirmingName === it.name;
        const isDeleting = deletingName === it.name;

        return (
          <li key={it.name} className="flex items-center justify-between p-3 border rounded-md">
            <span className="truncate">{it.name}</span>
            <div className="flex items-center gap-3">
              <a className="text-orange-600 hover:underline" href={it.url} target="_blank" rel="noopener noreferrer">View</a>
              {!isConfirming ? (
                <button onClick={startConfirm} className="text-red-600 hover:underline">Delete</button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    className={`px-2 py-1 rounded text-white ${isDeleting ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                  >
                    {isDeleting ? 'Deleting…' : 'Confirm'}
                  </button>
                  <button
                    onClick={cancelConfirm}
                    disabled={isDeleting}
                    className="px-2 py-1 rounded border hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </li>
        );
      })}
      </ul>
    </>
  );
}
