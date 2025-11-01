// Generic API helpers for Identity page

export async function loadIdentity<T = any>(teamId: number, clientId: number): Promise<Partial<T>> {
  const res = await fetch(`/api/identity?teamId=${teamId}&clientId=${clientId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load identity');
  const data = (await res.json()) as Partial<T>;
  if (process.env.NODE_ENV !== 'production') {
    const hasTRA = Object.prototype.hasOwnProperty.call(data as any, 'target_retirement_age');
    const hasTRI = Object.prototype.hasOwnProperty.call(data as any, 'target_retirement_income');
    // eslint-disable-next-line no-console
    if (!hasTRA && !hasTRI) console.warn('[identity] retirement fields not present in identity payload');
  }
  return data;
}

export async function saveIdentity<T = any>(teamId: number, clientId: number, payload: T): Promise<void> {
  const res = await fetch(`/api/identity?teamId=${teamId}&clientId=${clientId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || 'Failed to save');
  }
}

export async function extractIdentity<T = any>(teamId: number, clientId: number): Promise<Partial<T>> {
  const res = await fetch('/api/docs/extract_identity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ team_id: teamId, client_id: clientId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || 'Extract failed');
  }
  return (await res.json()) as Partial<T>;
}

import { toIdentityModel } from '@/lib/types/identity';

export async function validateIdentityModel(teamId: number, clientId: number): Promise<any> {
  const raw = await loadIdentity<any>(teamId, clientId);
  const model = toIdentityModel(raw);
  const res = await fetch('/api/test/identity_verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ team_id: teamId, client_id: clientId, identity_model: model }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({} as any));
    const message = (err as any)?.detail || (err as any)?.error || 'Validation failed';
    const error = new Error(message);
    // attach server payload for richer UI feedback
    (error as any).meta = err;
    (error as any).status = res.status;
    throw error;
  }
  const contentType = res.headers.get('content-type') || '';
  return contentType.includes('application/json') ? await res.json() : await res.text();
}
