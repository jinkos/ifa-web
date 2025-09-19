"use client";
import { useState } from 'react';
import { useSelectedClient } from '../SelectedClientContext';
import DocumentDropzone from './DocumentDropzone';
import DocumentList from './DocumentList';

export default function DocumentsPage() {
  const { selectedClient } = useSelectedClient();
  const [refreshToken, setRefreshToken] = useState(0);
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
