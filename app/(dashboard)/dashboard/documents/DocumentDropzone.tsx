"use client";
import { useState, DragEvent } from "react";
import { useSelectedClient } from '../SelectedClientContext';
import { useTeam } from '../TeamContext';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // ok for PoC; signed upload doesn't require RLS
  { auth: { persistSession: false } }
);

async function sha256(file: File) {
    const buf = await file.arrayBuffer();
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

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

                // 1) INIT (ask FastAPI for signed upload URL+token)
                const initRes = await fetch('/api/docs/init-upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        team_id: team.id,
                        client_id: selectedClient.client_id,
                        document_name: file.name,
                        content_type: file.type || 'application/octet-stream',
                    }),
                });
                if (!initRes.ok) {
                    // check for 400/409 for user-friendly message
                    if (initRes.status === 400) {
                        const err = await initRes.json().catch(() => ({}));
                        throw new Error(err.error || 'Invalid upload request');
                    }
                    if (initRes.status === 409) {
                        throw new Error('A document with this name already exists for the client.');
                    }
                    throw new Error('init-upload failed');
                }
                const { storage_path, token } = await initRes.json();

                // 2) Direct upload to Storage via signed token
                const up = await supabase.storage.from('ifa_docs').uploadToSignedUrl(storage_path, token, file);
                if (up.error) throw up.error;

                // 3) client-side checksum for integrity
                const checksum = await sha256(file);

                console.log('Uploaded:', team.id, selectedClient.client_id, storage_path, checksum, file.name);

                // 4) Commit (tell FastAPI to ingest)
                const commitRes = await fetch('/api/docs/commit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        team_id: team.id,
                        client_id: selectedClient.client_id,
                        storage_path,
                        document_name: file.name,
                        content_type: file.type || 'application/octet-stream',
                        sha256: checksum,
                    }),
                });
                if (!commitRes.ok) throw new Error('commit failed');
                const commit = await commitRes.json();
                console.log('Committed:', commit);

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
