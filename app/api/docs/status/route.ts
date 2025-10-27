import { client } from '@/lib/db/drizzle';

export const dynamic = 'force-dynamic';

type Row = {
  file_name: string;
  status: string;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = Number(searchParams.get('teamId'));
    const clientId = Number(searchParams.get('clientId'));
    const status = searchParams.get('status') || undefined;
    const limitRaw = searchParams.get('limit');
    let limit = 1000; // sensible default
    if (limitRaw !== null) {
      const parsed = parseInt(limitRaw, 10);
      if (Number.isFinite(parsed)) {
        limit = Math.min(Math.max(1, parsed), 5000);
      }
    }

    if (!teamId || !clientId) {
      return Response.json(
        { error: 'teamId and clientId are required' },
        { status: 400 }
      );
    }

    // Fetch recent rows then reduce in JS to latest per file_name (more predictable than DISTINCT ON)
    // Return all distinct file names for this team/client
    const rows: Row[] = status
      ? await client<Row[]>`
          select distinct on (file_name)
            file_name, status
          from ifa_docs_status
          where team_id = ${teamId}
            and client_id = ${clientId}
            and status = ${status}
            and file_name is not null
          order by file_name, created_at desc
          limit ${limit}
        `
      : await client<Row[]>`
          select distinct on (file_name)
            file_name, status
          from ifa_docs_status
          where team_id = ${teamId}
            and client_id = ${clientId}
            and file_name is not null
          order by file_name, created_at desc
          limit ${limit}
        `;


    const items = rows.map((r) => ({
      name: r.file_name,
      url: null as string | null,
      status: r.status,
    }));

    return new Response(JSON.stringify(items), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
      },
    });
  } catch (e: any) {
    return Response.json(
      { error: e?.message || 'Failed to fetch document statuses' },
      { status: 500 }
    );
  }
}
