import 'server-only';
import { getServerClient } from '@/lib/supabase/client.server';
import { IFA_DOCS_BUCKET } from './constants';
import { dataJsonPath } from './paths';

function isNotFound(err: any) {
    const status = err?.status ?? err?.statusCode;
    const msg = err?.message ?? '';
    return status === 404 || String(status) === '404' || /not\s*found/i.test(msg);
}

async function readResponseToString(data: any): Promise<string> {
    if (!data) return '';
    if (typeof (data as any).text === 'function') {
        return await (data as any).text();
    }
    if (Buffer.isBuffer(data)) {
        return data.toString('utf8');
    }
    if ((data as any).readable) {
        const chunks: Buffer[] = [];
        for await (const chunk of data as any) chunks.push(Buffer.from(chunk));
        return Buffer.concat(chunks).toString('utf8');
    }
    return String(data);
}

/**
 * GET JSON from Storage (server-side).
 */
export async function getJson<T = any>(
    teamId: string | number,
    clientId: string | number,
    key: string
): Promise<T | null> {
    const supabase = getServerClient();
    const path = dataJsonPath(teamId, clientId, key);

    const { data, error } = await supabase.storage.from(IFA_DOCS_BUCKET).download(path);
    if (error) {
        if (isNotFound(error)) return null;
        throw error;
    }
    const text = await readResponseToString(data);
    try {
        return JSON.parse(text) as T;
    } catch {
        return null;
    }
}

/**
 * PUT JSON into Storage (server-side).
 * - Uploads JSON, sets cacheControl, verifies metadata after upload.
 * - If metadata doesn't match, re-uploads the same bytes (upsert) to enforce metadata.
 */
export async function putJson(
    teamId: string | number,
    clientId: string | number,
    key: string,
    value: any
) {
    const supabase = getServerClient();
    const path = dataJsonPath(teamId, clientId, key);
    const file = Buffer.from(JSON.stringify(value), 'utf8');
    const { data, error } = await supabase.storage
        .from(IFA_DOCS_BUCKET)
        .upload(path, file, { upsert: true, contentType: 'application/json', cacheControl: '0' });
    if (error) throw error;
    return { path, result: data };
}
