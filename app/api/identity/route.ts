import { NextRequest, NextResponse } from 'next/server';
import { getTeamForUser } from '@/lib/db/queries';
import { getJson, putJson } from '@/lib/storage/json';

export const runtime = 'nodejs';

// GET /api/identity?teamId=...&clientId=...
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

    const data = await getJson<any>(teamId, clientId, 'identity');
    // Ensure retirement fields are present in the payload for UI contracts
    const defaults = {
      target_retirement_age: null as number | null,
      target_retirement_income: null as any,
    };
    const identity = { ...defaults, ...(data ?? {}) };
    return NextResponse.json(identity);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load identity' }, { status: 500 });
  }
}

// PUT /api/identity?teamId=...&clientId=...
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
    // Merge-on-save: preserve existing keys unless explicitly overwritten
    // This avoids clobbering other identity fields when a feature saves a partial payload
    const existing = (await getJson<any>(teamId, clientId, 'identity')) ?? {};
    const identity = { ...existing, ...payload };

    await putJson(teamId, clientId, 'identity', identity);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save identity' }, { status: 500 });
  }
}
