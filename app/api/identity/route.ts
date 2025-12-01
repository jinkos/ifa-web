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
  
  // Sync address/contact fields to clients table for consistency
  // Clients table is the master for: address1, address2, city, postcode, email, mobile, landline
  const clientUpdates: any = {};
  if (merged.address1 !== undefined) clientUpdates.address1 = merged.address1;
  if (merged.address2 !== undefined) clientUpdates.address2 = merged.address2;
  if (merged.city !== undefined) clientUpdates.city = merged.city;
  if (merged.postcode !== undefined) clientUpdates.postcode = merged.postcode;
  if (merged.email !== undefined) clientUpdates.email = merged.email;
  if (merged.mobile !== undefined) clientUpdates.mobile = merged.mobile;
  if (merged.landline !== undefined) clientUpdates.landline = merged.landline;
  
  if (Object.keys(clientUpdates).length > 0) {
    const { getServerClient } = await import('@/lib/supabase/client.server');
    const supabase = getServerClient();
    await supabase
      .from('clients')
      .update(clientUpdates)
      .eq('client_id', parseInt(clientId, 10));
  }
  
  return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save identity' }, { status: 500 });
  }
}
