import 'server-only';
import { getServerClient } from '@/lib/supabase/client.server';
import { dataJsonPath } from './paths'; // optional: if you still want to compute key from path
import { IFA_DOCS_BUCKET } from './constants'; // not used but kept for parity if needed

// Helper: normalize inputs to integers where appropriate
function toInt(v: string | number | undefined | null): number | null {
    if (v === undefined || v === null) return null;
    const n = typeof v === 'number' ? v : parseInt(String(v), 10);
    return Number.isNaN(n) ? null : n;
}

/**
 * GET JSON from DB (server-side).
 */
export async function getJson<T = any>(
    teamId: string | number,
    clientId: string | number,
    key: string
): Promise<T | null> {
    const supabase = getServerClient();

    const tId = toInt(teamId);
    const cId = toInt(clientId);
    if (tId === null || cId === null) {
        throw new Error('Invalid teamId or clientId');
    }
    const normalizedKey = String(key);

    // Query the row; select only data column
    const { data, error, status } = await supabase
        .from('ifa_docs')
        .select('data')
        .eq('team_id', tId)
        .eq('client_id', cId)
        .eq('key', normalizedKey)
        .single();

    if (error) {
        // If not found, return null (mirror storage 404 behavior)
        if (status === 406 || /Results contain 0 rows/.test(String(error.message))) {
            return null;
        }
        throw error;
    }

    // data.data contains the jsonb payload
    try {
        return (data?.data ?? null) as T;
    } catch {
        return null;
    }
}

/**
 * PUT JSON into DB (server-side).
 * - Performs an upsert on (team_id, client_id, key).
 * - Optionally include userId to store actor.
 */
// Use this updated putJson (only showing the function body)
export async function putJson(
    teamId: string | number,
    clientId: string | number,
    key: string,
    value: any,
    opts?: { userId?: string | number; contentType?: string; cacheControl?: string }
) {
    const supabase = getServerClient();

    const tId = toInt(teamId);
    const cId = toInt(clientId);
    const uId = toInt(opts?.userId ?? null);
    if (tId === null || cId === null) {
        throw new Error('Invalid teamId or clientId');
    }
    const normalizedKey = String(key);

    const row = {
        team_id: tId,
        client_id: cId,
        user_id: uId,
        key: normalizedKey,
        data: value,
        content_type: opts?.contentType ?? 'application/json',
        cache_control: opts?.cacheControl ?? '0',
    };

    // Correct upsert: pass an array for values and a string for onConflict
    const { data, error } = await supabase
        .from('ifa_docs')
        .upsert([row], { onConflict: 'team_id,client_id,key' });

    if (error) throw error;
    return { path: `${tId}/${cId}/${normalizedKey}`, result: data?.[0] ?? null };
}