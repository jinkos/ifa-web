import { NextRequest, NextResponse } from 'next/server';
import { getTeamForUser } from '@/lib/db/queries';
import { getJson, putJson } from '@/lib/storage/json';
import { toIdentityModel } from '@/lib/types/identity';

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
    // Normalize to transport-safe IdentityModel; ensures retirement keys present as nulls by default
    const identity = toIdentityModel(data ?? {});
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
  // Merge-on-save (deep), then normalize to IdentityModel to keep shape consistent
  const existing = (await getJson<any>(teamId, clientId, 'identity')) ?? {};
  const deepMerge = (a: any, b: any): any => {
    // If b is null, explicitly clear field
    if (b === null) return null;
    // Primitive or array: replace
    if (typeof b !== 'object' || Array.isArray(b)) return b === undefined ? a : b;
    // a missing or not object: take b
    if (typeof a !== 'object' || a === null || Array.isArray(a)) return { ...b };
    // Merge object keys recursively
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    const out: any = { ...a };
    for (const k of keys) {
      if (Object.prototype.hasOwnProperty.call(b, k)) {
        out[k] = deepMerge(a[k], (b as any)[k]);
      }
    }
    return out;
  };
  const merged = deepMerge(existing, payload);
  // Save the raw merged JSON to preserve unknown keys and nested structures.
  // GET will always normalize via toIdentityModel for transport.
  await putJson(teamId, clientId, 'identity', merged);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save identity' }, { status: 500 });
  }
}
