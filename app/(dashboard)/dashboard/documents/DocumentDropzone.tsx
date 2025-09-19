"use client";
import { useState, DragEvent } from "react";
import { useSelectedClient } from '../SelectedClientContext';
import { useTeam } from '../TeamContext';

export default function DocumentDropzone({ onUpload }: { onUpload?: () => void }) {
  const { selectedClient } = useSelectedClient();
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get team from provider
  const { team } = useTeam();

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    setError(null);
    setSuccess(null);
    if (!selectedClient || !team) {
      setError('Select a client first.');
      return;
    }
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        const form = new FormData();
        form.set('file', file);
        form.set('teamId', team.id.toString());
        form.set('clientId', selectedClient.client_id.toString());
        const res = await fetch('/api/storage/upload', { method: 'POST', body: form });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Upload failed');
        }
      }
      setSuccess('Upload successful!');
      if (onUpload) onUpload();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300 bg-white'}`}
      style={{ cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}
    >
      <div className="text-lg font-medium mb-2">Drag and drop files here to upload</div>
      {uploading && <div className="text-orange-500">Uploading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-600">{success}</div>}
      <div className="text-gray-500 text-sm mt-2">Files will be saved to Supabase storage for this client.</div>
    </div>
  );
}
