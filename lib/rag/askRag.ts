export type AskRequest = {
  team_id: number;
  client_id: number;
  question: string;
  k?: number;
  max_context_chars?: number | null;
  model?: string;         // defaults server-side to "gpt-4o-mini"
  temperature?: number;   // defaults server-side to 0.0
};

export type AskResponse = {
  answer: string;
  citations: Array<{ source?: string; title?: string; doc_id?: string }>;
  used_docs: number;
};

export async function askRag(
  req: AskRequest,
  opts?: { signal?: AbortSignal; endpoint?: string }
): Promise<AskResponse> {
  const endpoint = opts?.endpoint ?? "/api/rag/ask";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal: opts?.signal,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`RAG ask failed ${res.status}: ${text || res.statusText}`);
  }

  return (await res.json()) as AskResponse;
}
