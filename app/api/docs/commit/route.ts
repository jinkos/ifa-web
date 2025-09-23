import { NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL!;

export async function POST(req: Request) {
  const body = await req.json(); // { team_id, client_id, storage_path, document_name?, content_type?, sha256? }
  const r = await fetch(`${FASTAPI_URL}/docs/commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  return NextResponse.json(data, { status: r.status });
}

