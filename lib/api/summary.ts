import type { PersonSummary } from '@/lib/types/summary';

export async function loadSummary(teamId: number, clientId: number): Promise<Partial<PersonSummary>> {
  const res = await fetch(`/api/summary?teamId=${teamId}&clientId=${clientId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load summary');
  return (await res.json()) as Partial<PersonSummary>;
}

export async function saveSummary(teamId: number, clientId: number, payload: PersonSummary): Promise<void> {
  const res = await fetch(`/api/summary?teamId=${teamId}&clientId=${clientId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || 'Failed to save');
  }
}

export async function extractSummary(teamId: number, clientId: number): Promise<Partial<PersonSummary>> {
  const res = await fetch('/api/docs/extract_summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ team_id: teamId, client_id: clientId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || 'Extract failed');
  }
  return (await res.json()) as Partial<PersonSummary>;
}
