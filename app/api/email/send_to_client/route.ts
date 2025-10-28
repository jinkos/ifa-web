import { NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL!;

// POST /api/email/send_to_client
// Body: { team_id: number, client_id: number, to_email: string, subject: string, email_body: string }
// Proxies to FastAPI /email/send_to_client and returns its JSON response
export async function POST(req: Request) {
  const body = await req.json();
  try {
    const r = await fetch(`${FASTAPI_URL}/email/send_to_client`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    // Parse JSON or text fallback
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
