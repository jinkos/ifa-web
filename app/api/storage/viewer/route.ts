import { NextRequest } from 'next/server';
import { getServerClient } from '@/lib/supabase/client.server';
import { getTeamForUser } from '@/lib/db/queries';
import { IFA_DOCS_BUCKET } from '@/lib/storage/constants';
import { docPath } from '@/lib/storage/paths';

export const runtime = 'nodejs';

// GET /api/storage/viewer?teamId=...&clientId=...&name=...&provider=office|google
// Redirects to a third-party viewer with a short-lived signed URL
export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams;
    const teamId = search.get('teamId');
    const clientId = search.get('clientId');
    const name = search.get('name');
    const provider = (search.get('provider') || 'office').toLowerCase();

    if (!teamId || !clientId || !name) {
      return new Response(JSON.stringify({ error: 'Missing teamId, clientId, or name' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    const team = await getTeamForUser();
    if (!team?.id || team.id.toString() !== String(teamId)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      });
    }

    const supabase = getServerClient();
    const path = docPath(teamId, clientId, name);
    const { data: signed, error } = await supabase.storage.from(IFA_DOCS_BUCKET).createSignedUrl(path, 600);
    if (error || !signed?.signedUrl) {
      return new Response(JSON.stringify({ error: error?.message || 'Failed to sign URL' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }

    const src = encodeURIComponent(signed.signedUrl);
    let target: string;
    if (provider === 'google') {
      target = `https://docs.google.com/gview?embedded=1&url=${src}`;
    } else {
      // Default to Office Online Viewer
      target = `https://view.officeapps.live.com/op/view.aspx?src=${src}`;
    }

    return new Response(null, {
      status: 302,
      headers: {
        location: target,
        'cache-control': 'no-store',
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Failed to build viewer URL' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
