import { NextRequest, NextResponse } from 'next/server';
import { getTeamForUser } from '@/lib/db/queries';
import { client } from '@/lib/db/drizzle';

export const runtime = 'nodejs';

// GET /api/statements?teamId=...&clientId=...
export async function GET(req: NextRequest) {
  try {
    const teamId = req.nextUrl.searchParams.get('teamId');
    const clientId = req.nextUrl.searchParams.get('clientId');

    if (!teamId || !clientId) {
      return NextResponse.json({ error: 'Missing teamId or clientId' }, { status: 400 });
    }

    // Validate the team belongs to the current user
    const team = await getTeamForUser();
    if (!team?.id || team.id.toString() !== String(teamId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('[statements] Querying transactions for clientId:', clientId);

    // Query transactions for this client using raw SQL via postgres.js client
    const transactions = await client`
      SELECT
        t.id,
        t.statement_id,
        t.type,
        t.date,
        t.description,
        t.amount,
        t.created_at,
        b.bank_name,
        b.account_number
      FROM public.transactions t
      JOIN public.bank_statements b ON b.id = t.statement_id
      WHERE b.client_id = ${clientId}
      ORDER BY t.date DESC NULLS LAST, t.created_at DESC
    `;

    console.log('[statements] Found transactions:', transactions.length);

    return NextResponse.json({ transactions });
  } catch (err: any) {
    console.error('Error loading transactions:', err);
    return NextResponse.json({ error: err.message || 'Failed to load transactions' }, { status: 500 });
  }
}

// PATCH /api/statements - Update transaction spending category
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { teamId, clientId, transactionId, category } = body;

    if (!teamId || !clientId || !transactionId || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate the team belongs to the current user
    const team = await getTeamForUser();
    if (!team?.id || team.id.toString() !== String(teamId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify the transaction belongs to a statement for this client
    const verification = await client`
      SELECT t.id
      FROM public.transactions t
      JOIN public.bank_statements b ON b.id = t.statement_id
      WHERE t.id = ${transactionId} AND b.client_id = ${clientId}
      LIMIT 1
    `;

    if (verification.length === 0) {
      return NextResponse.json({ error: 'Transaction not found for this client' }, { status: 404 });
    }

    // Update the type field
    await client`
      UPDATE public.transactions
      SET type = ${category}
      WHERE id = ${transactionId}
    `;

    console.log('[statements] Updated transaction', transactionId, 'to category:', category);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error updating transaction category:', err);
    return NextResponse.json({ error: err.message || 'Failed to update category' }, { status: 500 });
  }
}
