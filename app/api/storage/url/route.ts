import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/client.server';
import { getTeamForUser } from '@/lib/db/queries';
import { IFA_DOCS_BUCKET } from '@/lib/storage/constants';
import { docPath } from '@/lib/storage/paths';

export const runtime = 'nodejs';

// GET /api/storage/url?teamId=...&clientId=...&name=...
// Returns: { url: string }
export async function GET(req: NextRequest) {
  try {
    const teamId = req.nextUrl.searchParams.get('teamId');
    const clientId = req.nextUrl.searchParams.get('clientId');
    const name = req.nextUrl.searchParams.get('name');

    if (!teamId || !clientId || !name) {
      return NextResponse.json({ error: 'Missing teamId, clientId, or name' }, { status: 400 });
    }

    const team = await getTeamForUser();
    if (!team?.id || team.id.toString() !== String(teamId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getServerClient();
    const path = docPath(teamId, clientId, name);

    const { data: signed, error } = await supabase
      .storage
      .from(IFA_DOCS_BUCKET)
      .createSignedUrl(path, 3600);

    if (error || !signed?.signedUrl) {
      return NextResponse.json({ error: error?.message || 'Failed to sign URL' }, { status: 500 });
    }

    return NextResponse.json({ url: signed.signedUrl }, { headers: { 'cache-control': 'no-store' } });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to get signed URL' }, { status: 500 });
  }
}
