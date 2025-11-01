import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mocks must be declared before importing the module under test
vi.mock('@/lib/db/queries', () => ({
  getTeamForUser: vi.fn(),
}));

vi.mock('@/lib/storage/json', () => ({
  getJson: vi.fn(),
  putJson: vi.fn(),
}));

// Import after mocks so handlers use mocked deps
import { PUT } from '@/app/api/identity/route';
import { getTeamForUser } from '@/lib/db/queries';
import { getJson, putJson } from '@/lib/storage/json';

function makePutRequest(url: string, body: any) {
  return new NextRequest(url, {
    method: 'PUT',
    body: JSON.stringify(body ?? {}),
  });
}

describe('/api/identity PUT (merge-on-save)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (getTeamForUser as any).mockResolvedValue({ id: 1 });
    (getJson as any).mockResolvedValue({});
    (putJson as any).mockResolvedValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('merges incoming payload with existing identity JSON', async () => {
    (getJson as any).mockResolvedValue({
      personal: { date_of_birth: '1990-01-01' },
      marital_status: 'single',
      health_status: 'good',
    });

    const payload = { retirement: { target_retirement_age: 65 } };
    const req = makePutRequest('http://localhost/api/identity?teamId=1&clientId=123', payload);

    const res = await PUT(req as any);
    expect(res.status).toBe(200);

    // Ensure we wrote a merged identity document
    expect(putJson).toHaveBeenCalledTimes(1);
    const args = (putJson as any).mock.calls[0];
    expect(args[0]).toBe('1'); // teamId from query
    expect(args[1]).toBe('123'); // clientId from query
    expect(args[2]).toBe('identity');

    const saved = args[3];
    expect(saved).toMatchObject({
      personal: { date_of_birth: '1990-01-01' },
      marital_status: 'single',
      health_status: 'good',
      retirement: { target_retirement_age: 65 },
    });
  });

  it('allows explicit nulls to clear fields during merge', async () => {
    (getJson as any).mockResolvedValue({ marital_status: 'married', notes: 'keep' });

    const payload = { marital_status: null };
    const req = makePutRequest('http://localhost/api/identity?teamId=1&clientId=999', payload);

    const res = await PUT(req as any);
    expect(res.status).toBe(200);

    expect(putJson).toHaveBeenCalledTimes(1);
    const saved = (putJson as any).mock.calls[0][3];
    expect(saved.marital_status).toBeNull();
    // Unspecified keys remain
    expect(saved.notes).toBe('keep');
  });

  it('returns 400 if required query params are missing', async () => {
    const req = makePutRequest('http://localhost/api/identity?teamId=1', { any: 'thing' });
    const res = await PUT(req as any);
    expect(res.status).toBe(400);
    expect(putJson).not.toHaveBeenCalled();
  });

  it('returns 403 if team does not match user team', async () => {
    (getTeamForUser as any).mockResolvedValue({ id: 2 });
    const req = makePutRequest('http://localhost/api/identity?teamId=1&clientId=1', { foo: 'bar' });
    const res = await PUT(req as any);
    expect(res.status).toBe(403);
    expect(putJson).not.toHaveBeenCalled();
  });
});
