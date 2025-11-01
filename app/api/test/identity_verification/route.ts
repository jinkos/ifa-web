import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const base = (process.env.BACKEND_URL || process.env.FASTAPI_URL || '').replace(/\/$/, '');
  if (!base) {
    return NextResponse.json({ error: 'Backend URL not configured (set BACKEND_URL or FASTAPI_URL)' }, { status: 500 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // ignore, leave empty body
  }

  try {
    const attempts: Array<{ url: string; status?: number; body?: any }> = [];

    // First attempt: /test/identity_verification
    const url1 = `${base}/test/identity_verification`;
    let resp = await fetch(url1, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-by': 'ifa-web',
      },
      body: JSON.stringify(body),
    });
    let ct = resp.headers.get('content-type') || '';
    let payload: any = ct.includes('application/json') ? await resp.json().catch(() => null) : await resp.text().catch(() => null);
    attempts.push({ url: url1, status: resp.status, body: payload });

    // Fallback attempt if 404: try /api/test/identity_verification
    if (resp.status === 404) {
      const url2 = `${base}/api/test/identity_verification`;
      resp = await fetch(url2, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-by': 'ifa-web',
        },
        body: JSON.stringify(body),
      });
      ct = resp.headers.get('content-type') || '';
      payload = ct.includes('application/json') ? await resp.json().catch(() => null) : await resp.text().catch(() => null);
      attempts.push({ url: url2, status: resp.status, body: payload });
    }

    if (!resp.ok) {
      return NextResponse.json({ error: 'Validation failed', baseUrl: base, attempts }, { status: resp.status });
    }

    // Pass-through successful response
    return ct.includes('application/json')
      ? NextResponse.json(payload, { status: resp.status })
      : new NextResponse(String(payload), { status: resp.status });
  } catch (e: any) {
    return NextResponse.json({ error: 'Proxy error', baseUrl: base, detail: e?.message || String(e) }, { status: 502 });
  }
}
