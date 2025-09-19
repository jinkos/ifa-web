import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/client.server';

// GET /api/clients?teamId=123
export async function GET(req: NextRequest) {
  const teamId = req.nextUrl.searchParams.get('teamId');
  if (!teamId) return NextResponse.json({ error: 'Missing teamId' }, { status: 400 });
  try {
    const supabase = getServerClient();
    const { data, error } = await supabase.from('clients').select('*').eq('team_id', teamId);
    if (error) throw error;
    const clients = data;
    return NextResponse.json(clients);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/clients
export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const supabase = getServerClient();
    const { data, error } = await supabase.from('clients').insert([body]).single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
