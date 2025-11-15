import { NextRequest } from 'next/server';
import { getServerClient } from '@/lib/supabase/client.server';
import { getTeamForUser } from '@/lib/db/queries';
import { IFA_DOCS_BUCKET } from '@/lib/storage/constants';
import { docPath } from '@/lib/storage/paths';

export const runtime = 'nodejs';

// GET /api/storage/file?teamId=...&clientId=...&name=...&mode=view|download
export async function GET(req: NextRequest) {
  try {
    const teamId = req.nextUrl.searchParams.get('teamId');
    const clientId = req.nextUrl.searchParams.get('clientId');
    const name = req.nextUrl.searchParams.get('name');
    const mode = (req.nextUrl.searchParams.get('mode') || 'view').toLowerCase();

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
    const { data, error } = await supabase.storage.from(IFA_DOCS_BUCKET).download(path);
    if (error || !data) {
      const status = (error as any)?.statusCode === 404 ? 404 : 500;
      return new Response(JSON.stringify({ error: error?.message || 'Failed to fetch file' }), {
        status,
        headers: { 'content-type': 'application/json' },
      });
    }

    const disposition = `${mode === 'download' ? 'attachment' : 'inline'}; filename="${encodeURIComponent(name)}"`;

    return new Response(data as any, {
      status: 200,
      headers: {
        'content-type': data.type,
        'content-disposition': disposition,
        'cache-control': 'private, max-age=3600',
        'accept-ranges': 'bytes',
        'cross-origin-resource-policy': 'same-origin',
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Failed to fetch file' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
