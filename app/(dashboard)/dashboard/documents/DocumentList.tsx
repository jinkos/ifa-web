"use client";
import { useEffect, useRef, useState } from 'react';
import { useSelectedClient } from '../SelectedClientContext';
import { useTeam } from '../TeamContext';
import { deleteDocumentByPathAction } from './actions';
import { Button } from '@/components/ui/button';
import { Trash2, Lock, Download, ExternalLink } from 'lucide-react';
// Listing now uses server API for broader compatibility (private/public buckets)

type DocItem = { name: string; url: string | null; status?: 'inactive' | 'digesting' | 'digested' | string };

export default function DocumentList({ refreshToken: externalRefreshToken }: { refreshToken?: number }) {
    const { selectedClient } = useSelectedClient();
    const { team } = useTeam();
    const [items, setItems] = useState<DocItem[]>([]);
    const itemsRef = useRef<DocItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null); // for listing errors
    const [banner, setBanner] = useState<string | null>(null); // transient UI message (e.g., delete failure)
    const [confirmingName, setConfirmingName] = useState<string | null>(null);
    const [deletingName, setDeletingName] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState(0);
    const [viewingName, setViewingName] = useState<string | null>(null);
    const [downloadingName, setDownloadingName] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState<boolean>(true);

    useEffect(() => {
        let ignore = false;
        async function load() {
            if (!team?.id || !selectedClient?.client_id) return;
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/docs/status?teamId=${team.id}&clientId=${selectedClient.client_id}`, { cache: 'no-store' });
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
    }, [team?.id, selectedClient?.client_id, refreshToken, externalRefreshToken]);

    // Keep a ref of the latest items to compare in background polls without causing flicker
    useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    // Track page visibility to pause polling when tab is hidden
    useEffect(() => {
        const onVis = () => setIsVisible(!document.hidden);
        onVis(); // initialize
        document.addEventListener('visibilitychange', onVis);
        return () => document.removeEventListener('visibilitychange', onVis);
    }, []);

    // Poll every 5 seconds for status changes (simple, robust)
    useEffect(() => {
        if (!team?.id || !selectedClient?.client_id) return;
        if (!isVisible) return; // pause when tab hidden
        let cancelled = false;

        const equals = (a: DocItem[], b: DocItem[]) => {
            if (a.length !== b.length) return false;
            for (let i = 0; i < a.length; i++) {
                if (
                    a[i].name !== b[i].name ||
                    (a[i].status ?? null) !== (b[i].status ?? null) ||
                    (a[i].url ?? null) !== (b[i].url ?? null)
                ) {
                    return false;
                }
            }
            return true;
        };

        async function pollOnce() {
            try {
                if (!team?.id || !selectedClient?.client_id) return;
                const res = await fetch(`/api/docs/status?teamId=${team.id}&clientId=${selectedClient.client_id}`, { cache: 'no-store' });
                if (!res.ok) return;
                const data: DocItem[] = await res.json();
                if (!cancelled && !equals(itemsRef.current, data ?? [])) {
                    setItems(data ?? []);
                }
            } catch {
                // silent fail on background poll
            }
        }

        // Run one immediate poll when becoming visible
        pollOnce();

        const id = setInterval(pollOnce, 5000);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, [team?.id, selectedClient?.client_id, isVisible]);

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
                        <div className="mt-2 flex justify-end">
                                <button
                                    className="text-gray-600 hover:text-gray-900 p-1 rounded disabled:opacity-50"
                                    onClick={() => setRefreshToken((t) => t + 1)}
                                    disabled={loading}
                                    aria-label="Refresh"
                                >
                                    {loading ? (
                                        <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l5-5-5-5v4A10 10 0 002 12h2z" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M19.418 9A7.978 7.978 0 0012 4c-4.418 0-8 3.582-8 8m16 0c0 1.657-.672 3.157-1.762 4.243M4.582 15A7.978 7.978 0 0012 20c4.418 0 8-3.582 8-8" />
                                        </svg>
                                    )}
                                </button>
                        </div>
                        <ul className="mt-2 space-y-2">
                {items.map((it) => {
                    const startConfirm = () => setConfirmingName(it.name);
                    const cancelConfirm = () => setConfirmingName((name) => (name === it.name ? null : name));
                    const handleConfirmDelete = async () => {
                        if (!team?.id || !selectedClient?.client_id) return;
                        setDeletingName(it.name);
                        const prev = items;
                        setItems((cur) => cur.filter((x) => x.name !== it.name));
                        try {
                            const form = new FormData();
                            form.set('teamId', String(team.id));
                            form.set('clientId', String(selectedClient.client_id));
                            form.set('fileName', it.name);
                            const result = await deleteDocumentByPathAction(form);
                            if (!result.ok) throw new Error(result.error || 'Delete failed');
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

                    const statusKey = (it.status ?? 'inactive').toLowerCase();
                    const statusLabel = statusKey.charAt(0).toUpperCase() + statusKey.slice(1);
                    const handleActivate = async () => {
                        if (!team?.id || !selectedClient?.client_id) return;
                        try {
                            await fetch('/api/docs/digest', {
                                method: 'POST',
                                headers: { 'content-type': 'application/json' },
                                body: JSON.stringify({
                                    team_id: team.id,
                                    client_id: selectedClient.client_id,
                                    document_name: it.name,
                                }),
                            });
                            // No optimistic change; Supabase Realtime will update status
                        } catch (e) {
                            const msg = e instanceof Error ? e.message : 'Failed to start digest';
                            setBanner(msg);
                            setTimeout(() => setBanner(null), 4000);
                        }
                    };

                    const getFileRoute = (name: string, mode: 'view' | 'download') => {
                        const params = new URLSearchParams({ teamId: String(team?.id ?? ''), clientId: String(selectedClient?.client_id ?? ''), name, mode });
                        return `/api/storage/file?${params.toString()}`;
                    };

                    const handleView = async () => {
                        if (!team?.id || !selectedClient?.client_id) return;
                        try {
                            setViewingName(it.name);
                            const lower = it.name.toLowerCase();
                            const isOffice = lower.endsWith('.doc') || lower.endsWith('.docx') || lower.endsWith('.ppt') || lower.endsWith('.pptx') || lower.endsWith('.xls') || lower.endsWith('.xlsx');
                            if (isOffice) {
                                const params = new URLSearchParams({ teamId: String(team.id), clientId: String(selectedClient.client_id), name: it.name, provider: 'office' });
                                window.open(`/api/storage/viewer?${params.toString()}`, '_blank', 'noopener,noreferrer');
                            } else {
                                const url = getFileRoute(it.name, 'view');
                                window.open(url, '_blank', 'noopener,noreferrer');
                            }
                        } catch (e) {
                            const msg = e instanceof Error ? e.message : 'Failed to open document';
                            setBanner(msg);
                            setTimeout(() => setBanner(null), 4000);
                        } finally {
                            setViewingName(null);
                        }
                    };

                    const handleDownload = async () => {
                        if (!team?.id || !selectedClient?.client_id) return;
                        try {
                            setDownloadingName(it.name);
                            const route = getFileRoute(it.name, 'download');
                            // Try File System Access API for a choose-location dialog
                            const anyWindow: any = window as any;
                            if (anyWindow.showSaveFilePicker) {
                                const resp = await fetch(route, { cache: 'no-store' });
                                if (!resp.ok) throw new Error('Failed to download');
                                const blob = await resp.blob();
                                const suggestedName = it.name;
                                let type = blob.type || 'application/octet-stream';
                                try {
                                    const handle = await anyWindow.showSaveFilePicker({
                                        suggestedName,
                                        types: [{ description: 'File', accept: { [type]: ['.' + (suggestedName.split('.').pop() || '')] } }],
                                    });
                                    const writable = await handle.createWritable();
                                    await writable.write(blob);
                                    await writable.close();
                                } catch (err) {
                                    if ((err as any)?.name !== 'AbortError') throw err;
                                }
                            } else {
                                // Fallback: open attachment route; browser may prompt or save based on settings
                                const a = document.createElement('a');
                                a.href = route;
                                a.download = it.name;
                                document.body.appendChild(a);
                                a.click();
                                a.remove();
                            }
                        } catch (e) {
                            const msg = e instanceof Error ? e.message : 'Failed to download document';
                            setBanner(msg);
                            setTimeout(() => setBanner(null), 4000);
                        } finally {
                            setDownloadingName(null);
                        }
                    };

                    return (
                        <li key={it.name} className="flex items-center justify-between p-3 border rounded-md">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="truncate">{it.name}</span>
                                <span className="inline-flex items-center">
                                    {(() => {
                                        // Show status as a textual label. For 'digesting' show an animated spinner.
                                        if (statusKey === 'digesting') {
                                            return (
                                                <span className="inline-flex items-center gap-2 text-amber-600 text-sm font-medium">
                                                    <svg className="animate-spin h-4 w-4 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l5-5-5-5v4A10 10 0 002 12h2z" />
                                                    </svg>
                                                    <span>Digesting</span>
                                                </span>
                                            );
                                        }
                                        if (statusKey === 'digested') {
                                            return <span className="text-green-600 text-sm font-medium">Digested</span>;
                                        }
                                        if (statusKey === 'inactive') {
                                            return <span className="text-gray-500 text-sm">Inactive</span>;
                                        }
                                        if (statusKey === 'inert') {
                                            return (
                                                <span className="inline-flex items-center gap-2 text-amber-600 text-sm">
                                                    <Lock className="h-4 w-4" />
                                                    <span>Inert</span>
                                                </span>
                                            );
                                        }
                                        // default/unknown: show the raw status label
                                        return <span className="text-sm">{statusLabel}</span>;
                                    })()}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button size="sm" variant="ghost" onClick={handleView} disabled={viewingName === it.name} aria-label={`View ${it.name}`} title="View">
                                    {viewingName === it.name ? (
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l5-5-5-5v4A10 10 0 002 12h2z" />
                                        </svg>
                                    ) : (
                                        <ExternalLink className="w-4 h-4" />
                                    )}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={handleDownload} disabled={downloadingName === it.name} aria-label={`Download ${it.name}`} title="Download">
                                    {downloadingName === it.name ? (
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l5-5-5-5v4A10 10 0 002 12h2z" />
                                        </svg>
                                    ) : (
                                        <Download className="w-4 h-4" />
                                    )}
                                </Button>
                                {statusKey === 'inactive' && (
                                    <button
                                        onClick={handleActivate}
                                        className="text-blue-600 hover:underline"
                                    >
                                        Activate
                                    </button>
                                )}
                                {!isConfirming ? (
                                    <Button size="sm" variant="ghost" onClick={startConfirm} aria-label="Delete document">
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
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
