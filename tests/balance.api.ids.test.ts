import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db/queries', () => ({ getTeamForUser: vi.fn() }));
vi.mock('@/lib/storage/json', () => ({ putJson: vi.fn(), getJson: vi.fn() }));

import { PUT } from '@/app/api/balance/route';
import { getTeamForUser } from '@/lib/db/queries';
import { putJson } from '@/lib/storage/json';

function makePutRequest(url: string, body: any) {
  return new NextRequest(url, { method: 'PUT', body: JSON.stringify(body) });
}

describe('/api/balance PUT assigns ids to items lacking them', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (getTeamForUser as any).mockResolvedValue({ id: 1 });
    (putJson as any).mockResolvedValue({});
  });

  it('adds id to balance_sheet items without id', async () => {
    const payload = {
      balance_sheet: [
        { type: 'isa', description: 'ISA', ite: { investment_value: 1000 } },
        { id: 'fixed', type: 'gia', description: 'GIA', ite: { investment_value: 2000 } },
      ],
    };
    const req = makePutRequest('http://localhost/api/balance?teamId=1&clientId=2', payload);
    const res = await PUT(req as any);
    expect(res.status).toBe(200);

    const saved = (putJson as any).mock.calls[0][3];
    expect(saved.balance_sheet[0].id).toBeTruthy();
    expect(saved.balance_sheet[1].id).toBe('fixed');
  });
});
