// Generic API helpers for Identity page

export async function loadIdentity<T = any>(teamId: number, clientId: number): Promise<Partial<T>> {
  const res = await fetch(`/api/identity?teamId=${teamId}&clientId=${clientId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load identity');
  return (await res.json()) as Partial<T>;
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
