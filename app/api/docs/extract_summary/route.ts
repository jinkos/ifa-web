import { NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL!;

// POST /api/docs/extract_summary
// Body: { team_id: number|string, client_id: number|string }
// Proxies to FastAPI /docs/extract_summary and returns its JSON response
export async function POST(req: Request) {
  const body = await req.json();
  const r = await fetch(`${FASTAPI_URL}/docs/extract_summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  return NextResponse.json(data, { status: r.status });
}
