import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const base = (process.env.FASTAPI_URL || '').replace(/\/$/, '');
  if (!base) return NextResponse.json({ error: 'FASTAPI_URL missing' }, { status: 500 });
  const url = new URL(req.url);
  const qs = url.searchParams.toString();
  const upstream = await fetch(`${base}/intelliflo/pull${qs ? `?${qs}` : ''}`, {
    headers: { Accept: 'application/json' }
  });
  const text = await upstream.text();
  const contentType = upstream.headers.get('content-type') || 'application/json';
  return new NextResponse(text, { status: upstream.status, headers: { 'Content-Type': contentType } });
}
