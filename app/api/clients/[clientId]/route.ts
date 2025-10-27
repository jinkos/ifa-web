import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/client.server';

// GET /api/clients/[clientId]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const id = Number.parseInt(clientId, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'Invalid client id' }, { status: 400 });
  }
  try {
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('client_id', id)
      .single();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Not found' }, { status: 404 });
  }
}

// PUT /api/clients/[clientId]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  const updates = await req.json();
  const { clientId } = await params;
  const id = Number.parseInt(clientId, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'Invalid client id' }, { status: 400 });
  }
  try {
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('client_id', id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to update client' }, { status: 500 });
  }
}

// DELETE /api/clients/[clientId]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const id = Number.parseInt(clientId, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'Invalid client id' }, { status: 400 });
  }
  try {
    const supabase = getServerClient();
    // Fetch client to get team_id for purge call
    const { data: clientData, error: fetchErr } = await supabase
      .from('clients')
      .select('*')
      .eq('client_id', id)
      .single();
    if (fetchErr) throw fetchErr;
    if (!clientData) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const teamId = clientData.team_id;

    // Call external purge API if configured
    const FASTAPI_URL = process.env.FASTAPI_URL;
    if (FASTAPI_URL) {
      try {
        const r = await fetch(`${FASTAPI_URL}/client/purge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ team_id: teamId, client_id: id })
        });

        const raw = await r.text();
        let parsed: any = null;
        try {
          parsed = JSON.parse(raw);
        } catch (_) {
          parsed = { error: raw };
        }

        if (!r.ok) {
          return NextResponse.json({ error: parsed }, { status: r.status });
        }
      } catch (err: any) {
        return NextResponse.json({ error: err.message ?? String(err) }, { status: 502 });
      }
    }

    // Finally delete client record from Supabase storage table
    const { error: delErr } = await supabase.from('clients').delete().eq('client_id', id);
    if (delErr) throw delErr;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to delete client' }, { status: 500 });
  }
}
