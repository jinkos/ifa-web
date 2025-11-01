import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// DEV-ONLY helper to serve a known external file for UI simulation flows.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name') || 'Gary Thompson FF.docx';

  // For safety, allow only files under the external directory and prevent path traversal
  const externalDir = path.join(process.cwd(), 'external');
  const safeName = name.replace(/\\|\/+|\.{2,}/g, ' ').trim();
  const filePath = path.join(externalDir, safeName);

  try {
  const data = await fs.readFile(filePath);
    // Best-effort content type for .docx
    const headers = new Headers({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `inline; filename="${safeName}"`
    });
  return new NextResponse(new Uint8Array(data).buffer, { status: 200, headers });
  } catch (err) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
