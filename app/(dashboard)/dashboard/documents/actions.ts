"use server";

export async function deleteDocumentByPathAction(formData: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const teamId = formData.get('teamId');
    const clientId = formData.get('clientId');
    const fileName = formData.get('fileName');
    if (!teamId || !clientId || !fileName) {
      return { ok: false, error: 'Missing teamId, clientId, or fileName' };
    }

    const FASTAPI_URL = process.env.FASTAPI_URL;
    if (!FASTAPI_URL) {
      return { ok: false, error: 'FASTAPI_URL is not configured' };
    }

    const qs = new URLSearchParams({
      team_id: String(teamId),
      client_id: String(clientId),
      filename: String(fileName),
    });

    const r = await fetch(`${FASTAPI_URL}/docs/by-path?${qs}`, { method: 'DELETE' });
    if (!r.ok) {
      let msg = `Delete failed ${r.status}`;
      try {
        const data = await r.json();
        if (data?.error) msg = data.error;
      } catch {}
      return { ok: false, error: msg };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Delete failed' };
  }
}
