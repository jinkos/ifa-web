import 'server-only';
import { getServerClient } from '@/lib/supabase/client.server';
import { IFA_DOCS_BUCKET } from './constants';
import { dataJsonPath } from './paths';

export async function getJson<T = any>(teamId: string | number, clientId: string | number, key: string): Promise<T | null> {
  const supabase = getServerClient();
  const dir = `${teamId}/${clientId}/data`;
  const filename = `${key}.json`;
  const { data: listing, error: listErr } = await supabase.storage.from(IFA_DOCS_BUCKET).list(dir);
  if (listErr) {
    const statusCode = (listErr as any)?.statusCode ?? (listErr as any)?.status;
    const message = (listErr as any)?.message || '';
    if (statusCode === 404 || String(statusCode) === '404' || /not\s*found/i.test(message)) {
      return null;
    }
    throw listErr;
  }
  if (!listing || !listing.some((f) => f.name === filename)) {
    return null;
  }
  const path = dataJsonPath(teamId, clientId, key);
  const { data, error } = await supabase.storage.from(IFA_DOCS_BUCKET).download(path);
  if (error) {
    // If the object is missing, return null; other errors should bubble up
    const statusCode = (error as any)?.statusCode ?? (error as any)?.status;
    const message = (error as any)?.message || '';
    if (statusCode === 404 || String(statusCode) === '404' || /not\s*found/i.test(message)) {
      return null;
    }
    throw error;
  }
  const text = await data.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    // Malformed JSON; treat as null to avoid crashing callers
    return null;
  }
}

export async function putJson(teamId: string | number, clientId: string | number, key: string, value: any) {
  const supabase = getServerClient();
  const path = dataJsonPath(teamId, clientId, key);
  const blob = new Blob([JSON.stringify(value)], { type: 'application/json' });
  // Use upsert to create or replace
  const { error } = await supabase.storage.from(IFA_DOCS_BUCKET).upload(path, blob, { upsert: true, contentType: 'application/json' });
  if (error) throw error;
  return { path };
}
