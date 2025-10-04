import { NextRequest, NextResponse } from 'next/server';
import { getTeamForUser } from '@/lib/db/queries';
import { getJson, putJson } from '@/lib/storage/json';

export const runtime = 'nodejs';

// GET /api/summary?teamId=...&clientId=...
export async function GET(req: NextRequest) {
  try {
    const teamId = req.nextUrl.searchParams.get('teamId');
    const clientId = req.nextUrl.searchParams.get('clientId');
    if (!teamId || !clientId) {
      return NextResponse.json({ error: 'Missing teamId or clientId' }, { status: 400 });
    }

    const team = await getTeamForUser();
    if (!team?.id || team.id.toString() !== String(teamId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await getJson<any>(teamId, clientId, 'summary');
    return NextResponse.json(data ?? {});
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load summary' }, { status: 500 });
  }
}

// PUT /api/summary?teamId=...&clientId=...
export async function PUT(req: NextRequest) {
  try {
    const teamId = req.nextUrl.searchParams.get('teamId');
    const clientId = req.nextUrl.searchParams.get('clientId');
    if (!teamId || !clientId) {
      return NextResponse.json({ error: 'Missing teamId or clientId' }, { status: 400 });
    }

    const team = await getTeamForUser();
    if (!team?.id || team.id.toString() !== String(teamId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload = await req.json();
    await putJson(teamId, clientId, 'summary', payload);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save summary' }, { status: 500 });
  }
}
