import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const base = (process.env.FASTAPI_URL || '').replace(/\/$/, '');
  if (!base) return NextResponse.json({ error: 'FASTAPI_URL missing' }, { status: 500 });
  const url = new URL(req.url);
  const qs = url.searchParams.toString();
  const upstream = await fetch(`${base}/auth/intelliflo/logout${qs ? `?${qs}` : ''}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const text = await upstream.text();
  const contentType = upstream.headers.get('content-type') || 'application/json';
  return new NextResponse(text, { status: upstream.status, headers: { 'Content-Type': contentType } });
}
