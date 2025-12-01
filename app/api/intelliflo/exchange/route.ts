import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
	try {
		const base = (process.env.FASTAPI_URL || '').replace(/\/$/, '');
		if (!base) {
			return NextResponse.json(
				{ error: 'FASTAPI_URL is not configured on the server' },
				{ status: 500 }
			);
		}

		const payload = await req.json().catch(() => ({}));

		const resp = await fetch(`${base}/auth/intelliflo/exchange`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		const text = await resp.text();
		const contentType = resp.headers.get('content-type') || 'application/json';

		return new NextResponse(text, { status: resp.status, headers: { 'Content-Type': contentType } });
	} catch (err: any) {
		return NextResponse.json(
			{ error: err?.message || 'Exchange proxy failed' },
			{ status: 500 }
		);
	}
}

