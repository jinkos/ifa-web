// Proxies POST /shopping/get_email to the FastAPI backend and returns JSON
import { NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL!;

export async function POST(req: Request) {
  const body = await req.json();
  const r = await fetch(`${FASTAPI_URL}/shopping/get_email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await r.json();
  return NextResponse.json(data, { status: r.status });
}
