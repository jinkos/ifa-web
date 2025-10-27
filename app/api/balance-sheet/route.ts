import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Deprecated: this endpoint is not used anymore. Use /api/balance instead.
export async function GET() {
	return NextResponse.json({ error: 'Use /api/balance instead' }, { status: 404 });
}

export async function PUT(req: NextRequest) {
	return NextResponse.json({ error: 'Use /api/balance instead' }, { status: 405 });
}

