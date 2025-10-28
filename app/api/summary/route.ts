import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Legacy summary API is decommissioned. Use /api/balance instead.
export async function GET(_req: NextRequest) {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Use /api/balance.' },
    { status: 410 }
  );
}

export async function PUT(_req: NextRequest) {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Use /api/balance.' },
    { status: 410 }
  );
}
