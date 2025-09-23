import { NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL!;

export async function DELETE(
  req: Request,
  { params }: { params: { parentId: string } }
) {
  const url = new URL(req.url);
  const teamId = url.searchParams.get('teamId');
  const clientId = url.searchParams.get('clientId');
  const r = await fetch(
    `${FASTAPI_URL}/docs/${params.parentId}?team_id=${teamId}&client_id=${clientId}`,
    { method: 'DELETE' }
  );
  const data = await r.json();
  return NextResponse.json(data, { status: r.status });
}
