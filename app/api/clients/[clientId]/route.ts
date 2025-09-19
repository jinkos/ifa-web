import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/client.server';

// GET /api/clients/[clientId]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  try {
    const supabase = getServerClient();
    const { data, error } = await supabase.from('clients').select('*').eq('client_id', clientId).single();
    if (error) throw error;
    const client = data;
    return NextResponse.json(client);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}

// PUT /api/clients/[clientId]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  const updates = await req.json();
  const { clientId } = await params;
  try {
    const supabase = getServerClient();
    const { data, error } = await supabase.from('clients').update(updates).eq('client_id', clientId).single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/clients/[clientId]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  try {
    const supabase = getServerClient();
    const { error } = await supabase.from('clients').delete().eq('client_id', clientId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
