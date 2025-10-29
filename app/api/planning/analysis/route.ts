import { NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL!;

// POST /api/planning/analysis
// Body: { team_id: number|string, client_id: number|string }
// Proxies to FastAPI /planning/analysis and returns its JSON response
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  try {
    const r = await fetch(`${FASTAPI_URL}/planning/analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const raw = await r.text();
    let data: any;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { error: raw || 'Upstream error' };
    }
    return NextResponse.json(data, { status: r.status });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Upstream fetch failed' },
      { status: 502 }
    );
  }
}
