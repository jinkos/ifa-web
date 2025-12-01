import { NextRequest, NextResponse } from 'next/server';
import { getTeamForUser } from '@/lib/db/queries';

export const runtime = 'nodejs';

// GET /api/intelliflo/clients
export async function GET(req: NextRequest) {
  try {
    const team = await getTeamForUser();
    if (!team?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Your FastAPI server already has the token and handles everything
    // Just proxy the request through Next.js to keep API key server-side
    const response = await fetch(`${process.env.FASTAPI_URL}/intelliflo/clients?team_id=${team.id}`, {
      headers: {
        'x-api-key': process.env.INTELLIFLO_API_KEY!,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch clients' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (err: any) {
    console.error('Error fetching Intelliflo clients:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch clients' }, { status: 500 });
  }
}
