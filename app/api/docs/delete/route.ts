import { NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL!;

export async function DELETE(
    req: Request,
    _ctx: { params: Promise<Record<string, string>> }
) {
    const url = new URL(req.url);
    const teamId = url.searchParams.get('teamId');
    const clientId = url.searchParams.get('clientId');
    const fileName = url.searchParams.get('fileName');
    const qs = new URLSearchParams({
        team_id: teamId ?? '',
        client_id: clientId ?? '',
        filename: fileName ?? '', // Ensure fileName is a string
    });

    const r = await fetch(
        `${FASTAPI_URL}/docs/by-path?${qs}`,
        { method: 'DELETE' }
    );
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
}
