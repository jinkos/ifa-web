import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const fastapi = process.env.FASTAPI_URL;
    if (!fastapi) {
      return Response.json({ error: 'FASTAPI_URL not configured' }, { status: 500 });
    }

    const resp = await fetch(`${fastapi}/docs/digest`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await resp.json().catch(() => ({}));
    return new Response(JSON.stringify(data), {
      status: resp.status,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Failed to start digest' }, { status: 500 });
  }
}
