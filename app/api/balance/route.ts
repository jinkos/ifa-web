import { NextRequest, NextResponse } from 'next/server';
import { getTeamForUser } from '@/lib/db/queries';
import { getJson, putJson } from '@/lib/storage/json';

export const runtime = 'nodejs';

// GET /api/balance?teamId=...&clientId=...
export async function GET(req: NextRequest) {
  try {
    const teamId = req.nextUrl.searchParams.get('teamId');
    const clientId = req.nextUrl.searchParams.get('clientId');
    if (!teamId || !clientId) {
      return NextResponse.json({ error: 'Missing teamId or clientId' }, { status: 400 });
    }

    // Validate the team belongs to the current user
    const team = await getTeamForUser();
    if (!team?.id || team.id.toString() !== String(teamId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

  const data = await getJson<any>(teamId, clientId, 'balance');
  // Ensure items-only payload contract with a default empty items array
  const defaults = { balance_sheet: [] as any[] };
  const balance = { ...defaults, ...(data ?? {}) };
  return NextResponse.json(balance);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load balance sheet' }, { status: 500 });
  }
}

// PUT /api/balance?teamId=...&clientId=...
export async function PUT(req: NextRequest) {
  try {
    const teamId = req.nextUrl.searchParams.get('teamId');
    const clientId = req.nextUrl.searchParams.get('clientId');
    if (!teamId || !clientId) {
      return NextResponse.json({ error: 'Missing teamId or clientId' }, { status: 400 });
    }

    // Validate the team belongs to the current user
    const team = await getTeamForUser();
    if (!team?.id || team.id.toString() !== String(teamId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload = await req.json();

    // Ensure each balance_sheet item has a stable integer id for client-side mappings (assumptions, UI state)
    const withIds = (() => {
      try {
        if (payload && Array.isArray(payload.balance_sheet)) {
          // Determine the next integer id based on existing ids (numbers or numeric strings)
          const existingNumericIds: number[] = payload.balance_sheet
            .map((it: any) => it?.id)
            .map((v: any) => {
              const n = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
              return Number.isFinite(n) && n > 0 ? Math.floor(n) : NaN;
            })
            .filter((n: number) => Number.isFinite(n));
          let nextId = existingNumericIds.length > 0 ? Math.max(...existingNumericIds) : 0;

          const nextItems = payload.balance_sheet.map((it: any) => {
            if (it && (it.id == null || it.id === '')) {
              nextId += 1;
              return { ...it, id: nextId };
            }
            return it;
          });
          return { ...payload, balance_sheet: nextItems };
        }
      } catch {}
      return payload;
    })();

    await putJson(teamId, clientId, 'balance', withIds);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save balance sheet' }, { status: 500 });
  }
}
