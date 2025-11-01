"use client";
import { useEffect, useState } from 'react';
import { useSelectedClient } from '../SelectedClientContext';
import DocumentDropzone from './DocumentDropzone';
import DocumentList from './DocumentList';
import { useSearchParams } from 'next/navigation';

export default function DocumentsPage() {
  const { selectedClient, setSelectedClient } = useSelectedClient();
  const [refreshToken, setRefreshToken] = useState(0);
  const searchParams = useSearchParams();

  // If selectClientId is provided, fetch client and select it before proceeding
  useEffect(() => {
    const id = searchParams.get('selectClientId');
    if (!id) return;
    let ignore = false;
    const trySelect = async () => {
      const attempts = 6;
      const delayMs = 300;
      for (let i = 0; i < attempts && !ignore; i++) {
        try {
          const res = await fetch(`/api/clients/${id}`, { cache: 'no-store' });
          if (res.ok) {
            const c = await res.json();
            if (c?.client_id) setSelectedClient(c);
            break;
          }
        } catch {}
        await new Promise((r) => setTimeout(r, delayMs));
      }
    };
    trySelect();
    return () => {
      ignore = true;
    };
  }, [searchParams, setSelectedClient]);
  return (
    <section className="p-4 lg:p-8">
      <h1 className="text-2xl font-semibold mb-2">Documents</h1>
      <div className="mb-4 text-lg font-medium">
        {selectedClient ? selectedClient.name : 'No Client Selected'}
      </div>
      <DocumentDropzone onUpload={() => setRefreshToken((x) => x + 1)} />
      <DocumentList refreshToken={refreshToken} />
    </section>
  );
}
