import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/client.server';
import { getTeamForUser } from '@/lib/db/queries';
import { IFA_DOCS_BUCKET } from '@/lib/storage/constants';
import { docPath } from '@/lib/storage/paths';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const form = await req.formData();
        const file = form.get('file');
        const teamId = form.get('teamId');
        const clientId = form.get('clientId');

        if (!(file && teamId && clientId)) {
            return NextResponse.json({ error: 'Missing file, teamId, or clientId' }, { status: 400 });
        }

        if (!(file instanceof File)) {
            return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
        }

        // Validate the team belongs to the current user
        const team = await getTeamForUser();
        if (!team?.id || team.id.toString() !== String(teamId)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const supabase = getServerClient();
        const path = docPath(teamId as string, clientId as string, file.name);

        // Convert File to ArrayBuffer for Supabase upload
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        const { data, error } = await supabase.storage
            .from(IFA_DOCS_BUCKET)
            .upload(path, bytes, { upsert: true, contentType: file.type || 'application/octet-stream' });

        if (error) throw error;

        return NextResponse.json({ path: data?.path ?? path }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
    }
}
