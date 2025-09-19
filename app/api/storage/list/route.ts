import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/client.server';
import { getTeamForUser } from '@/lib/db/queries';
import { IFA_DOCS_BUCKET } from '@/lib/storage/constants';
import { folderPrefix } from '@/lib/storage/paths';

export const runtime = 'nodejs';

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

  const supabase = getServerClient();
  const prefix = folderPrefix(teamId, clientId);
  const { data, error } = await supabase.storage.from(IFA_DOCS_BUCKET).list(prefix);
    if (error) throw error;

    // Generate signed URLs for each file (valid for 1 hour)
    const items = (data || []).map((f) => f.name);
    const result: { name: string; url: string }[] = [];
    for (const name of items) {
      const path = `${prefix}/${name}`;
      const { data: signed, error: signErr } = await supabase.storage.from(IFA_DOCS_BUCKET).createSignedUrl(path, 3600);
      if (signErr) {
        // Fallback to public URL if signing fails
        const { data: pub } = supabase.storage.from(IFA_DOCS_BUCKET).getPublicUrl(path);
        result.push({ name, url: pub.publicUrl });
      } else {
        result.push({ name, url: signed.signedUrl });
      }
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to list documents' }, { status: 500 });
  }
}
