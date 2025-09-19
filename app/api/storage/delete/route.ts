import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/client.server';
import { getTeamForUser } from '@/lib/db/queries';
import { IFA_DOCS_BUCKET } from '@/lib/storage/constants';
import { docPath } from '@/lib/storage/paths';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { teamId, clientId, filename } = await req.json();
    if (!teamId || !clientId || !filename) {
      return NextResponse.json({ error: 'Missing teamId, clientId, or filename' }, { status: 400 });
    }

    // Validate team
    const team = await getTeamForUser();
    if (!team?.id || team.id.toString() !== String(teamId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

  const supabase = getServerClient();
  const path = docPath(teamId, clientId, filename);
  const { error } = await supabase.storage.from(IFA_DOCS_BUCKET).remove([path]);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete document' }, { status: 500 });
  }
}
