import { NextRequest, NextResponse } from 'next/server';
import { getTeamForUser } from '@/lib/db/queries';

export const runtime = 'nodejs';

// GET /api/intelliflo/status
export async function GET(req: NextRequest) {
  try {
    const team = await getTeamForUser();
    if (!team?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Your FastAPI server already tracks connection status
    const response = await fetch(`${process.env.FASTAPI_URL}/auth/intelliflo/status?team_id=${team.id}`);
    
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      return NextResponse.json({
        connected: false,
        user_data: null,
      });
    }

  } catch (err: any) {
    console.error('Error checking Intelliflo status:', err);
    return NextResponse.json({
      connected: false,
      user_data: null,
    });
  }
}
