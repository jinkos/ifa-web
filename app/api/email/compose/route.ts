// Proxies POST /api/email/compose to the FastAPI backend and returns JSON
import { NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL!;

export async function POST(req: Request) {
  const body = await req.json();
  const composeMode = req.headers.get('x-compose-mode') || undefined;
  const r = await fetch(`${FASTAPI_URL}/email/compose`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(composeMode ? { 'X-Compose-Mode': composeMode } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const raw = await r.text().catch(() => '');
    try {
      const parsed = raw ? JSON.parse(raw) : {};
      // FastAPI validation errors typically under `detail`
      const message = (parsed as any)?.error
        || (Array.isArray((parsed as any)?.detail) ? (parsed as any).detail.map((d: any) => d?.msg || JSON.stringify(d)).join('; ') : (parsed as any)?.detail)
        || raw
        || 'Request failed';
      return NextResponse.json({ error: message, detail: (parsed as any)?.detail ?? null }, { status: r.status });
    } catch {
      return NextResponse.json({ error: raw || 'Request failed' }, { status: r.status });
    }
  }

  const data = await r.json();
  return NextResponse.json(data, { status: r.status });
}
