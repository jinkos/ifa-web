import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const base = (process.env.BACKEND_URL || process.env.FASTAPI_URL || '').replace(/\/$/, '');
  if (!base) {
    return NextResponse.json({ error: 'Backend URL not configured (set BACKEND_URL or FASTAPI_URL)' }, { status: 500 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  try {
    const attempts: Array<{ url: string; status?: number; body?: any }> = [];

    const tryPost = async (url: string) => {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-by': 'ifa-web' },
        body: JSON.stringify(body),
      });
      const ct = resp.headers.get('content-type') || '';
      const payload = ct.includes('application/json') ? await resp.json().catch(() => null) : await resp.text().catch(() => null);
      attempts.push({ url, status: resp.status, body: payload });
      return { resp, payload, ct };
    };

    let { resp, payload, ct } = await tryPost(`${base}/test/balance_sheet_verification`);
    if (resp.status === 404) {
      ({ resp, payload, ct } = await tryPost(`${base}/api/test/balance_sheet_verification`));
    }

    if (!resp.ok) {
      return NextResponse.json({ error: 'Validation failed', baseUrl: base, attempts }, { status: resp.status });
    }

    return ct.includes('application/json')
      ? NextResponse.json(payload, { status: resp.status })
      : new NextResponse(String(payload), { status: resp.status });
  } catch (e: any) {
    return NextResponse.json({ error: 'Proxy error', baseUrl: base, detail: e?.message || String(e) }, { status: 502 });
  }
}
